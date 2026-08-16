import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function EditScreen() {
  return (
    <ScreenPlaceholder
      title="편집"
      node="33:2166"
      note="촬영본 편집"
      next={[{ label: '다음 → 공개설정', href: '/capture/visibility' }]}
    />
  );
}
