import MatchPrep from '../../pages/MatchPrep';

export default async function Page({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const resolvedParams = await params;
  return <MatchPrep key={resolvedParams.matchId} params={resolvedParams} />;
}
