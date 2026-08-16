import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function VerifyFailedScreen() {
  return (
    <ScreenPlaceholder
      title="인증 실패"
      node="33:2293"
      note="인증 실패/거부. 재인증 또는 지도 복귀"
      next={[{ label: '다시 인증', href: '/verify/gps' }, { label: '지도로 돌아가기', href: '/map' }]}
    />
  );
}
