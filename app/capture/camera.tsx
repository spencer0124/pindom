import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function CameraScreen() {
  return (
    <ScreenPlaceholder
      title="LIVE 카메라"
      node="33:2230"
      note="현장 촬영 전용 카메라"
      next={[{ label: '촬영완료 → 편집', href: '/capture/edit' }]}
    />
  );
}
