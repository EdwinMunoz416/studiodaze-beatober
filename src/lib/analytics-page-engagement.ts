import { trackEvent } from "@/lib/analytics";
import { getSessionId } from "@/lib/visitor-id";

const MIN_ENGAGEMENT_MS = 100;
const MAX_ENGAGEMENT_MS = 60 * 60 * 1000;
/** Max ms credited in one tick (timer drift + background tab edge cases). */
const MAX_TICK_MS = 6_000;
const TICK_INTERVAL_MS = 5_000;
const FIRST_TICK_MS = 500;

type EngagementCtx = {
  surface: string;
  day: number | null;
  path: string;
  sliceId: string;
  seq: number;
  visibleSince: number;
  accumulatedVisibleMs: number;
};

type EngagementOpts = {
  surface: string;
  day: number | null;
  path: string;
};

let current: EngagementCtx | null = null;
let lastEngagementOpts: EngagementOpts | null = null;
let progressTimer: ReturnType<typeof setInterval> | null = null;
let firstTickTimer: ReturnType<typeof setTimeout> | null = null;
let hooksInstalled = false;

function visibleElapsed(ctx: EngagementCtx): number {
  if (typeof document === "undefined") return 0;
  if (document.visibilityState !== "visible") return 0;
  return Math.max(0, Date.now() - ctx.visibleSince);
}

function totalVisibleMs(ctx: EngagementCtx): number {
  return Math.min(
    ctx.accumulatedVisibleMs + visibleElapsed(ctx),
    MAX_ENGAGEMENT_MS,
  );
}

function clearProgressTimer(): void {
  if (progressTimer != null) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

function clearFirstTickTimer(): void {
  if (firstTickTimer != null) {
    clearTimeout(firstTickTimer);
    firstTickTimer = null;
  }
}

function makeSliceId(sessionId: string, opts: EngagementOpts): string {
  const dayPart = opts.day != null ? String(opts.day) : "x";
  const pathPart = opts.path.replace(/[^\w/-]/g, "_").slice(0, 64);
  return `${sessionId.slice(0, 8)}-${pathPart}-${opts.surface}-${dayPart}-${Date.now()}`;
}

function resetVisibleAccumulation(ctx: EngagementCtx): EngagementCtx {
  return {
    ...ctx,
    visibleSince: Date.now(),
    accumulatedVisibleMs: 0,
  };
}

function emitEngagement(
  ctx: EngagementCtx,
  durationMs: number,
  reason: EngagementFlushReason,
): void {
  const ms = Math.min(Math.floor(durationMs), MAX_TICK_MS);
  if (ms < MIN_ENGAGEMENT_MS) return;

  const tickId = `${ctx.sliceId}:${ctx.seq}`;
  trackEvent("page_engagement", {
    surface: ctx.surface,
    ...(ctx.day != null ? { day: ctx.day } : {}),
    duration_ms: ms,
    reason,
    path: ctx.path,
    slice_id: ctx.sliceId,
    seq: ctx.seq,
    tick_id: tickId,
  });
  ctx.seq += 1;
}

type EngagementFlushReason =
  | "route_change"
  | "pagehide"
  | "hidden"
  | "day_change"
  | "tick"
  | "first_tick"
  | "unmount";

function emitVisibleDelta(reason: EngagementFlushReason): void {
  const ctx = current;
  if (!ctx) return;
  if (
    reason !== "hidden" &&
    reason !== "pagehide" &&
    reason !== "route_change" &&
    reason !== "day_change" &&
    reason !== "unmount" &&
    document.visibilityState !== "visible"
  ) {
    return;
  }

  const durationMs = totalVisibleMs(ctx);
  emitEngagement(ctx, durationMs, reason);
  current = resetVisibleAccumulation(ctx);
}

function startProgressTimer(): void {
  clearProgressTimer();
  progressTimer = setInterval(() => {
    emitVisibleDelta("tick");
  }, TICK_INTERVAL_MS);
}

function scheduleFirstTick(): void {
  clearFirstTickTimer();
  firstTickTimer = setTimeout(() => {
    firstTickTimer = null;
    emitVisibleDelta("first_tick");
  }, FIRST_TICK_MS);
}

function flushEngagement(
  reason: EngagementFlushReason,
  opts?: { endSlice?: boolean },
): void {
  const ctx = current;
  if (!ctx) return;

  clearProgressTimer();
  clearFirstTickTimer();

  const durationMs = totalVisibleMs(ctx);
  emitEngagement(ctx, durationMs, reason);

  const endSlice = opts?.endSlice !== false;
  if (endSlice) {
    current = null;
  } else {
    current = resetVisibleAccumulation(ctx);
    startProgressTimer();
    scheduleFirstTick();
  }
}

function beginSlice(opts: EngagementOpts): void {
  lastEngagementOpts = opts;
  const sessionId = getSessionId();
  current = {
    surface: opts.surface,
    day: opts.day,
    path: opts.path,
    sliceId: makeSliceId(sessionId || "anon", opts),
    seq: 0,
    visibleSince: Date.now(),
    accumulatedVisibleMs: 0,
  };
  startProgressTimer();
  scheduleFirstTick();
}

function onVisibilityChange(): void {
  if (document.visibilityState === "hidden") {
    if (!current) return;
    current.accumulatedVisibleMs += visibleElapsed(current);
    current.visibleSince = Date.now();
    flushEngagement("hidden");
    return;
  }

  if (current) {
    current.visibleSince = Date.now();
    return;
  }

  if (lastEngagementOpts) {
    beginSlice(lastEngagementOpts);
  }
}

function ensureEngagementHooks(): void {
  if (typeof window === "undefined" || hooksInstalled) return;
  hooksInstalled = true;
  window.addEventListener("pagehide", () => flushEngagement("pagehide"));
  document.addEventListener("visibilitychange", onVisibilityChange);
}

/**
 * Track visible time on the current route / day focus.
 * Call when `surface`, `day`, or path changes — previous slice is flushed first.
 */
export function syncPageEngagement(opts: EngagementOpts): void {
  if (typeof window === "undefined") return;
  ensureEngagementHooks();

  const path = opts.path.slice(0, 256);
  const normalized = { surface: opts.surface, day: opts.day, path };
  const same =
    current &&
    current.path === path &&
    current.day === opts.day &&
    current.surface === opts.surface;

  if (same) return;

  flushEngagement("route_change");
  beginSlice(normalized);
}

/** Flush when selected day changes but path stays on /day/N. */
export function flushPageEngagementForDayChange(): void {
  flushEngagement("day_change");
}

/** Flush on React unmount (route away, strict mode remount). */
export function flushPageEngagementOnUnmount(): void {
  flushEngagement("unmount");
}
