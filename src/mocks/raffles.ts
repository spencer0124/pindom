import type { Raffle, RaffleEntry } from '../lib/domain';

/**
 * 응모 fixtures. Deadlines are relative to load time so 마감 임박 on 홈 always
 * has something to show, whenever the demo runs.
 */
const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);

export const mockRaffles: Raffle[] = [
  {
    id: 'raffle-fansign',
    title: '팬사인회 응모권',
    prizeDescription: '9월 서울 팬사인회 입장 2인',
    imageUrl: 'https://picsum.photos/seed/raffle1/1200/800',
    ticketCost: 3,
    closesAt: hoursFromNow(18),
    entryCount: 842,
    capacity: 1000,
    status: 'open',
  },
  {
    id: 'raffle-album',
    title: '친필 사인 앨범',
    prizeDescription: '멤버 전원 사인 정규 3집',
    imageUrl: 'https://picsum.photos/seed/raffle2/1200/800',
    ticketCost: 2,
    closesAt: hoursFromNow(96),
    entryCount: 311,
    capacity: 500,
    status: 'open',
  },
  {
    id: 'raffle-concert',
    title: '단독 콘서트 티켓',
    prizeDescription: '10월 고척돔 지정석 1매',
    imageUrl: 'https://picsum.photos/seed/raffle3/1200/800',
    ticketCost: 8,
    closesAt: hoursFromNow(240),
    entryCount: 1290,
    status: 'open',
  },
  {
    id: 'raffle-demo',
    title: '혜화 테스트 굿즈',
    prizeDescription: '기능 확인용 혜화 굿즈 응모',
    imageUrl: 'https://picsum.photos/seed/raffle-demo/1200/800',
    ticketCost: 1,
    closesAt: hoursFromNow(720),
    entryCount: 0,
    capacity: 1000,
    status: 'open',
  },
  {
    id: 'raffle-closed',
    title: '포토카드 세트',
    prizeDescription: '미공개 컷 12종',
    imageUrl: 'https://picsum.photos/seed/raffle4/1200/800',
    ticketCost: 1,
    closesAt: hoursFromNow(-24),
    entryCount: 2044,
    capacity: 2000,
    status: 'closed',
  },
];

/** Matches the two spent fixture tickets so 응모 내역 is visible on first launch. */
export const mockRaffleEntries: RaffleEntry[] = [
  {
    id: 'entry-0001',
    userId: 'user-demo',
    raffleId: 'raffle-album',
    ticketIds: ['ticket-0001', 'ticket-0002'],
    ticketsSpent: 2,
    createdAt: new Date('2026-08-15T12:00:00+09:00'),
  },
];
