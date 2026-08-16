import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function PlaceDetailScreen() {
  return (
    <ScreenPlaceholder
      title="장소/상세"
      node="33:2381"
      note="촬영지 상세. GPS 인증 시작 지점"
      next={[{ label: 'GPS 인증하기', href: '/verify/gps' }]}
    />
  );
}
