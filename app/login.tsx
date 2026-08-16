import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function LoginScreen() {
  return (
    <ScreenPlaceholder
      title="시작화면"
      node="33:2801"
      note="로그인 · 회원가입"
      next={[{ label: '홈으로', href: '/' }]}
    />
  );
}
