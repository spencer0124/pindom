import type { Tier } from './user';

export interface PublicProfile {
  userId: string;
  nickname: string;
  bio: string;
  avatarUrl?: string;
  ticketsIssued: number;
  placesVisited: number;
  tier: Tier;
}
