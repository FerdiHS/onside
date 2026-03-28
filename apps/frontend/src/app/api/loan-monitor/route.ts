import { createFailureResponse, createMeta, failureStatusCode } from "@/lib/schemas";
import { getLiveLoanMonitor, isTinyFishConfigured, TinyFishUpstreamError } from "@/lib/tinyfish";

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

export async function GET() {
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
    const result = await getLiveLoanMonitor();

    if (result.kind === "failure") {
      const failure = createFailureResponse(
        result.code,
        result.message,
        createMeta("live", "partial"),
        result.details,
      );

      return Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      });
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
      const failure = createFailureResponse(
        "UPSTREAM_FAILURE",
        error.message,
        createMeta("live", "partial"),
        error.details,
      );

      return Response.json(failure, {
        status: failureStatusCode(failure.error.code),
      });
    }

    const failure = createFailureResponse(
      "INTERNAL_ERROR",
      "Failed to load loan monitor data.",
      createMeta("live", "partial"),
    );

    return Response.json(failure, {
      status: failureStatusCode(failure.error.code),
    });
  }
}
