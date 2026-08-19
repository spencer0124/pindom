import type { GalleryPhoto, Review } from '../lib/domain';

const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000);

/** 리뷰 fixtures for 장소/상세. Keyed by place so the repository can filter cheaply. */
export const mockReviews: Review[] = [
  {
    id: 'review-001',
    placeId: 'place-jumunjin',
    authorId: 'user-yuna',
    authorNickname: '유나',
    authorTier: 'club20',
    text: '파도 높은 날은 진입 통제돼요. 가기 전에 꼭 확인하세요.',
    tags: ['파도주의', '주차가능'],
    likeCount: 62,
    createdAt: daysAgo(3),
  },
  {
    id: 'review-002',
    placeId: 'place-jumunjin',
    authorId: 'user-jihoon',
    authorNickname: '지훈',
    authorTier: 'club10',
    text: '해 뜨기 직전이 제일 예뻐요. 사람도 없고.',
    tags: ['새벽추천'],
    likeCount: 18,
    createdAt: daysAgo(11),
  },
  {
    id: 'review-003',
    placeId: 'place-namsan',
    authorId: 'user-minseo',
    authorNickname: '민서',
    authorTier: 'clubGo',
    text: '자물쇠 벽 앞 줄이 길어요. 평일 낮 추천합니다.',
    tags: ['혼잡', '평일추천'],
    likeCount: 94,
    createdAt: daysAgo(6),
  },
];

/** 갤러리 fixtures — public ticket photos surfaced on 장소/상세. */
export const mockGallery: GalleryPhoto[] = [
  {
    id: 'gallery-001',
    placeId: 'place-jumunjin',
    ticketId: 'ticket-0006',
    authorId: 'user-demo',
    photoUrl: 'https://picsum.photos/seed/ticket6/600/800',
    createdAt: daysAgo(5),
  },
  {
    id: 'gallery-002',
    placeId: 'place-jumunjin',
    ticketId: 'ticket-0001',
    authorId: 'user-demo',
    photoUrl: 'https://picsum.photos/seed/ticket1/600/800',
    createdAt: daysAgo(70),
  },
  {
    id: 'gallery-003',
    placeId: 'place-namsan',
    ticketId: 'ticket-0005',
    authorId: 'user-demo',
    photoUrl: 'https://picsum.photos/seed/ticket5/600/800',
    createdAt: daysAgo(10),
  },
];
