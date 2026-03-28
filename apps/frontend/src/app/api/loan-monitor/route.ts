export async function GET() {
  return Response.json({
    success: true,
    data: {
      players: [
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
      ],
    },
    meta: {
      source: "mock",
      completeness: "full",
      generatedAt: new Date().toISOString(),
    },
  });
}
