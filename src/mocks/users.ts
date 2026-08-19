import type { User } from '../lib/domain';

export const mockUser: User = {
  id: 'user-demo',
  email: 'demo@pindom.app',
  nickname: '도민',
  avatarUrl: 'https://picsum.photos/seed/pindomuser/200/200',
  ticketBalance: 4,
  ticketsIssued: 6,
  placesVisited: 5,
  createdAt: new Date('2026-06-01T10:00:00+09:00'),
};
