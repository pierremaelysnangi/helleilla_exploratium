import { NextResponse } from "next/server";
import { buildDocument } from "@/lib/api/openapi";

export const dynamic = "force-static";

export function GET() {
  return NextResponse.json(buildDocument(), {
    headers: { "cache-control": "public, max-age=3600" },
  });
}
