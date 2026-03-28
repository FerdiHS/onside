export async function GET() {
  return Response.json({
    success: true,
    data: {
      players: [
        {
          name: "Cole Palmer",
          team: "Chelsea",
          position: "Attacking Midfielder",
          strengths: [
            "Receives well between the lines",
            "Creates chances under pressure",
            "Composed final-third decision making",
          ],
          analysis:
            "Palmer looks like Chelsea's clearest attacking reference point, combining chance creation with calm ball retention in central spaces.",
        },
        {
          name: "Kobbie Mainoo",
          team: "Manchester United",
          position: "Central Midfielder",
          strengths: [
            "Press resistance in tight areas",
            "Progressive carries through midfield",
            "Good awareness when covering transitions",
          ],
          analysis:
            "Mainoo offers balance to United's midfield with tidy progression and growing control when matches become stretched.",
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
