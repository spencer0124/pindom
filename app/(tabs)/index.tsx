import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function HomeScreen() {
  return (
    <ScreenPlaceholder
      title="홈"
      node="33:2617"
      note="보유 티켓·마감 임박 응모·추천 촬영지"
      next={[{ label: '촬영지 찾기 → 지도', href: '/map' }, { label: '응모하러 가기', href: '/raffle/demo' }]}
    />
  );
}
