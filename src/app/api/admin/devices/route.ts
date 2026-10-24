import { NextResponse } from "next/server";
import { ARCHIVED_MESSAGE } from "@/lib/archived";
import { isAdminSession } from "@/lib/admin-auth";
import { listDevices } from "@/lib/device-registry";
import { dbConfigured } from "@/lib/db";

export async function GET() {
  if (!(await isAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!dbConfigured()) {
    return NextResponse.json({ error: "DATABASE_URL not configured" }, { status: 503 });
  }
  const devices = await listDevices();
  return NextResponse.json({ devices });
}

export async function POST() {
  return NextResponse.json({ error: ARCHIVED_MESSAGE }, { status: 403 });
}

export async function DELETE() {
  return NextResponse.json({ error: ARCHIVED_MESSAGE }, { status: 403 });
}
