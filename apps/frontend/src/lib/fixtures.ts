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
  const now = Date.now();

  return listMatchPrepFixtures().filter((fixture) => {
    if (!isUpcomingFixture(fixture, now)) {
      return false;
    }

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

function isUpcomingFixture(fixture: MatchSummary, now: number): boolean {
  if (!fixture.kickoff_time) {
    return false;
  }

  const kickoff = Date.parse(fixture.kickoff_time);
  if (Number.isNaN(kickoff)) {
    return false;
  }

  return kickoff >= now;
}
