import MatchPrep from '../../pages/MatchPrep';

export default function Page({
  params,
}: {
  params: { matchId: string };
}) {
  return <MatchPrep params={params} />;
}