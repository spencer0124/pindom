import { ScreenPlaceholder } from '@/components/ScreenPlaceholder';

export default function WritePostScreen() {
  return (
    <ScreenPlaceholder
      title="글쓰기"
      node="33:1686"
      note="커뮤니티 글 작성"
      next={[{ label: '등록', href: '/community' }]}
    />
  );
}
