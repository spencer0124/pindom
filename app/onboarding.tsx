import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function OnboardingScreen() {
  return (
    <ScreenPlaceholder
      title="온보딩"
      node="-"
      note="첫 진입. 시작하기 / 로그인으로"
      next={[{ label: '시작하기 / 로그인', href: '/login' }]}
    />
  );
}
