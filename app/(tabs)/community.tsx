import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function CommunityScreen() {
  return (
    <ScreenPlaceholder
      title="커뮤니티"
      node="33:1717"
      note="인증샷 자랑 피드"
      next={[{ label: '글쓰기', href: '/post/write' }]}
    />
  );
}
