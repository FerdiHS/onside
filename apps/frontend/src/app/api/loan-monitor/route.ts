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
          performance:
            "Playing regular minutes and showing sharper movement in the penalty area.",
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
          performance:
            "Steady involvement across midfield with useful physical presence and late box runs.",
          developmentNotes: [
            "Maintaining solid availability",
            "Still adapting to mixed midfield responsibilities",
          ],
          status: "stable",
        },
      ],
    },
    meta: {
      mode: "mock",
      completeness: "full",
      generatedAt: new Date().toISOString(),
    },
  });
}
