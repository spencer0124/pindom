import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function IssuedScreen() {
  return (
    <ScreenPlaceholder
      title="티켓 발행"
      node="33:2072"
      note="티켓 발행 완료"
      next={[{ label: '컬렉션에서 보기', href: '/tickets' }]}
    />
  );
}
