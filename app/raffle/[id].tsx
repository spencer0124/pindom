import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function RaffleScreen() {
  return (
    <ScreenPlaceholder
      title="응모"
      node="33:1871"
      note="응모 화면. 잔여 티켓 충족 여부로 분기"
      next={[{ label: 'Yes → 응모 확정', href: '/raffle/done' }, { label: 'No → 컬렉션', href: '/tickets' }]}
    />
  );
}
