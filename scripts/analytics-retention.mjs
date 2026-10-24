#!/usr/bin/env node
/**
 * One-off retention for frozen analytics.
 * Deletes analytics_events older than 90 days. Safe to run more than once:
 * a second run only removes rows that have since aged past the cutoff.
 * Not part of the build. Do not run against production from CI.
 */
import { loadEnvLocal } from "./load-env-local.mjs";

loadEnvLocal();

import { neon } from "@neondatabase/serverless";

const url =
  process.env.DATABASE_URL ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL;

if (!url) {
  console.error("[analytics-retention] DATABASE_URL required.");
  process.exit(1);
}

const sql = neon(url);
const rows = await sql`
  WITH deleted AS (
    DELETE FROM analytics_events
    WHERE created_at < now() - interval '90 days'
    RETURNING 1
  )
  SELECT count(*)::int AS deleted FROM deleted
`;

const deleted = rows[0]?.deleted ?? 0;
console.log(
  `[analytics-retention] deleted ${deleted} analytics_events older than 90 days.`,
);
