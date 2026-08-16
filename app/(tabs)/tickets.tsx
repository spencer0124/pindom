import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function TicketsScreen() {
  return (
    <ScreenPlaceholder
      title="컬렉션"
      node="33:1961"
      note="발행한 티켓 컬렉션"
      next={[{ label: '응모하기', href: '/raffle/demo' }]}
    />
  );
}
