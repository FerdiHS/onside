import "server-only";

import { listMatchPrepFixtures } from "@/lib/mock-data";
import type { MatchSummary } from "@/lib/schemas";

export type FixtureFilters = {
  clubId?: string;
  competition?: string;
};

export function getUpcomingFixtures(filters: FixtureFilters = {}): MatchSummary[] {
  const clubId = filters.clubId?.trim().toLowerCase();
  const competition = filters.competition?.trim().toLowerCase();

  return listMatchPrepFixtures().filter((fixture) => {
    if (
      clubId &&
      fixture.home_club_id?.toLowerCase() !== clubId &&
      fixture.away_club_id?.toLowerCase() !== clubId
    ) {
      return false;
    }

    if (competition && fixture.competition?.trim().toLowerCase() !== competition) {
      return false;
    }

    return true;
  });
}
