import type { User } from '../lib/domain';

export const mockUser: User = {
  id: 'user-demo',
  email: 'demo@pindom.app',
  nickname: '도민',
  avatarUrl: 'https://picsum.photos/seed/pindomuser/200/200',
  bio: '주말마다 촬영지 다니는 사람',
  followedArtistIds: ['artist-lumina', 'artist-echoline'],
  ticketBalance: 4,
  ticketsIssued: 6,
  placesVisited: 5,
  tier: 'club10',
  profileVisibility: 'public',
  locale: 'ko',
  createdAt: new Date('2026-06-01T10:00:00+09:00'),
};
