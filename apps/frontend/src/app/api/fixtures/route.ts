import type { NextRequest } from "next/server";

import { getUpcomingFixtures } from "@/lib/fixtures";
import { createMeta, type FixturesResponse } from "@/lib/schemas";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const clubId = request.nextUrl.searchParams.get("clubId")?.trim();
  const competition = request.nextUrl.searchParams.get("competition")?.trim();

  const response: FixturesResponse = {
    success: true,
    data: getUpcomingFixtures({
      clubId,
      competition,
    }),
    meta: createMeta("mock", "full"),
  };

  return Response.json(response);
}
