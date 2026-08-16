import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function MapScreen() {
  return (
    <ScreenPlaceholder
      title="지도"
      node="33:2460"
      note="촬영지 핀 지도. 핀 선택 → 장소 상세"
      next={[{ label: '촬영지 핀 선택 → 장소/상세', href: '/place/demo' }]}
    />
  );
}
