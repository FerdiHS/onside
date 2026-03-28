import type { NextRequest } from "next/server";

import {
  getLiveLoanMonitorRunStatus,
  isTinyFishConfigured,
  startLiveLoanMonitorRun,
  TinyFishUpstreamError,
} from "@/lib/tinyfish";

const mockPlayers = [
  {
    id: "jimmy-jay-morgan",
    name: "Jimmy-Jay Morgan",
    loanClub: "Gillingham",
    position: "Forward",
    performance: {
      appearances: 12,
      goals: 4,
      assists: 2,
    },
    developmentNotes: [
      "More confident receiving under pressure",
      "Work rate without the ball has improved",
    ],
    status: "rising",
  },
  {
    id: "cesare-casadei",
    name: "Cesare Casadei",
    loanClub: "Leicester City",
    position: "Midfielder",
    performance: {
      appearances: 18,
      goals: 3,
      assists: 1,
    },
    developmentNotes: [
      "Maintaining solid availability",
      "Still adapting to mixed midfield responsibilities",
    ],
    status: "stable",
  },
];

export async function GET(request: NextRequest) {
  const runId = request.nextUrl.searchParams.get("runId")?.trim();

  if (!isTinyFishConfigured()) {
    return Response.json({
      success: true,
      data: {
        players: mockPlayers,
      },
      meta: {
        source: "mock",
        completeness: "full",
        generatedAt: new Date().toISOString(),
      },
    });
  }

  try {
    if (!runId) {
      const started = await startLiveLoanMonitorRun();

      return Response.json(
        {
          success: false,
          status: "pending",
          runId: started.runId,
          meta: {
            source: "tinyfish",
            generatedAt: new Date().toISOString(),
          },
        },
        {
          status: 202,
        },
      );
    }

    const result = await getLiveLoanMonitorRunStatus(runId);

    if (result.kind === "pending") {
      return Response.json(
        {
          success: false,
          status: "pending",
          runId: result.runId,
          meta: {
            source: "tinyfish",
            generatedAt: new Date().toISOString(),
          },
        },
        { status: 202 },
      );
    }

    if (result.kind === "failure") {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: {
            code: "TINYFISH_FAILED",
            message: result.message,
            ...(result.details ? { details: result.details } : {}),
          },
          meta: {
            source: "tinyfish",
            generatedAt: new Date().toISOString(),
          },
        },
        { status: 502 },
      );
    }

    return Response.json({
      success: true,
      data: {
        players: result.players,
      },
      meta: {
        source: "tinyfish",
        completeness: "full",
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof TinyFishUpstreamError) {
      return Response.json(
        {
          success: false,
          status: "failed",
          error: {
            code: "TINYFISH_FAILED",
            message: error.message,
            ...(error.details ? { details: error.details } : {}),
          },
          meta: {
            source: "tinyfish",
            generatedAt: new Date().toISOString(),
          },
        },
        { status: 502 },
      );
    }

    return Response.json(
      {
        success: false,
        status: "failed",
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load loan monitor data.",
        },
        meta: {
          source: "tinyfish",
          generatedAt: new Date().toISOString(),
        },
      },
      { status: 500 },
    );
  }
}
