import { NextResponse } from "next/server";
import { ARCHIVED_MESSAGE } from "@/lib/archived";
import { loadPublicPatternForDay } from "@/lib/day-store";

export async function GET(
  _request: Request,
  ctx: { params: Promise<{ n: string }> },
) {
  const { n } = await ctx.params;
  const day = Number.parseInt(n, 10);
  if (!Number.isFinite(day) || day < 1 || day > 31) {
    return NextResponse.json({ error: "Invalid day" }, { status: 400 });
  }

  try {
    const code = await loadPublicPatternForDay(day);
    return NextResponse.json(
      { day, code },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300" } },
    );
  } catch {
    return NextResponse.json({ error: "Pattern unavailable" }, { status: 503 });
  }
}

export async function POST() {
  return NextResponse.json({ error: ARCHIVED_MESSAGE }, { status: 403 });
}
