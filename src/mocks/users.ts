import type { PublicProfile, User } from '../lib/domain';

export const mockUser: User = {
  id: 'user-demo',
  email: 'demo@pindom.app',
  nickname: '도민',
  avatarUrl: 'https://picsum.photos/seed/pindomuser/200/200',
  bio: '주말마다 촬영지 다니는 사람',
  followedArtistIds: ['artist-lumina', 'artist-echoline'],
  blockedUserIds: [],
  ticketBalance: 4,
  ticketsIssued: 6,
  placesVisited: 5,
  tier: 'club10',
  profileVisibility: 'public',
  locale: 'ko',
  createdAt: new Date('2026-06-01T10:00:00+09:00'),
};

/** Public author fixtures so the community → profile flow shows real copy. */
export const mockPublicProfiles: PublicProfile[] = [
  {
    userId: 'user-yuna',
    nickname: '유나',
    bio: '주말마다 촬영지를 찾아다녀요',
    avatarUrl: 'https://picsum.photos/seed/yuna/200/200',
    ticketsIssued: 24,
    placesVisited: 8,
    tier: 'club20',
  },
  {
    userId: 'user-minseo',
    nickname: '민서',
    bio: '해질녘 인증을 좋아해요',
    avatarUrl: 'https://picsum.photos/seed/minseo/200/200',
    ticketsIssued: 12,
    placesVisited: 6,
    tier: 'club10',
  },
  {
    userId: 'user-hana',
    nickname: '하나',
    bio: '사진보다 장소의 분위기를 모아요',
    avatarUrl: 'https://picsum.photos/seed/hana/200/200',
    ticketsIssued: 9,
    placesVisited: 5,
    tier: 'club10',
  },
  {
    userId: 'user-jihoon',
    nickname: '지훈',
    bio: '실패해도 다시 도전하는 중',
    ticketsIssued: 31,
    placesVisited: 12,
    tier: 'clubGo',
  },
  {
    userId: 'user-seojun',
    nickname: '서준',
    bio: '부산부터 전국 성지순례 중',
    ticketsIssued: 22,
    placesVisited: 9,
    tier: 'club20',
  },
];
