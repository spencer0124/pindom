import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function RaffleDoneScreen() {
  return (
    <ScreenPlaceholder
      title="응모완료"
      node="33:1830"
      note="응모 완료"
      next={[{ label: '커뮤니티에 자랑하기', href: '/community' }]}
    />
  );
}
