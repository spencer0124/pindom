import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function VisibilityScreen() {
  return (
    <ScreenPlaceholder
      title="공개설정"
      node="33:2120"
      note="공개 범위 선택"
      next={[{ label: '티켓 발행하기', href: '/capture/issued' }]}
    />
  );
}
