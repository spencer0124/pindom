import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function GpsVerifyScreen() {
  return (
    <ScreenPlaceholder
      title="GPS인증"
      node="33:2330"
      note="반경 50m + 속도 검증 (서버가 판정)"
      next={[{ label: 'Yes → LIVE 카메라', href: '/capture/camera' }, { label: 'No → 인증 실패', href: '/verify/failed' }]}
    />
  );
}
