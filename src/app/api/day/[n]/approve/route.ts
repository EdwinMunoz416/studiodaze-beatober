import { NextResponse } from "next/server";
import { ARCHIVED_MESSAGE } from "@/lib/archived";

export async function POST() {
  return NextResponse.json({ error: ARCHIVED_MESSAGE }, { status: 403 });
}
