import type { Raffle, RaffleEntry } from '../lib/domain';

/**
 * 응모 fixtures. Deadlines are relative to load time so 마감 임박 on 홈 always
 * has something to show, whenever the demo runs.
 */
const hoursFromNow = (h: number) => new Date(Date.now() + h * 60 * 60 * 1000);

export const mockRaffles: Raffle[] = [
  {
    "id": "raffle-mj-concert",
    "title": "MJ 콘서트 티켓",
    "prizeDescription": "MJ 콘서트 티켓",
    "imageUrl": "",
    "ticketCost": 10,
    "order": 0,
    "entryCount": 0,
    "status": "open"
  },
  {
    "id": "raffle-hj-fansign",
    "title": "HJ 팬사인회 티켓",
    "prizeDescription": "HJ 팬사인회 티켓",
    "imageUrl": "",
    "ticketCost": 8,
    "order": 1,
    "entryCount": 0,
    "status": "open"
  },
  {
    "id": "raffle-jw-cd",
    "title": "JW 사인 CD",
    "prizeDescription": "JW 사인 CD",
    "imageUrl": "",
    "ticketCost": 5,
    "order": 2,
    "entryCount": 0,
    "status": "open"
  },
  {
    "id": "raffle-sy-album",
    "title": "SY 3집 앨범",
    "prizeDescription": "SY 3집 앨범",
    "imageUrl": "",
    "ticketCost": 3,
    "order": 3,
    "entryCount": 0,
    "status": "open"
  },
  {
    "id": "raffle-mj-photocard",
    "title": "MJ 포토카드",
    "prizeDescription": "MJ 포토카드",
    "imageUrl": "",
    "ticketCost": 1,
    "order": 4,
    "entryCount": 0,
    "status": "open"
  }
].map((raffle) => ({ ...raffle, status: 'open' as const, closesAt: hoursFromNow(240) }));

// Keep the title of an already-spent fixture entry; closed prizes never appear in the active catalog.
mockRaffles.push({ id: 'raffle-album', title: '친필 사인 앨범', prizeDescription: '기존 응모 기록',
  imageUrl: '', ticketCost: 2, closesAt: hoursFromNow(-24), entryCount: 1, status: 'closed' });

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
