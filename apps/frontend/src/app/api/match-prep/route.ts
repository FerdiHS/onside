import { ZodError } from "zod";

import { getMockMatchPrep } from "@/lib/mock-data";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const response = getMockMatchPrep({
      matchId: searchParams.get("matchId"),
      mode: searchParams.get("mode") ?? undefined,
    });

    return Response.json(response);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        {
          success: false,
          error: {
            code: "BAD_REQUEST",
            message: "Invalid match prep request.",
            details: {
              issues: error.issues,
            },
          },
        },
        { status: 400 },
      );
    }

    return Response.json(
      {
        success: false,
        error: {
          code: "INTERNAL_ERROR",
          message: "Failed to load match prep data.",
        },
      },
      { status: 500 },
    );
  }
}
