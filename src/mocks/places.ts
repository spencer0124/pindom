import type { Place } from '../lib/domain';

/**
 * 촬영지 fixtures.
 *
 * Real locations with approximate coordinates, chosen so the 지도 pins spread
 * across the country rather than clustering. Titles and descriptions are
 * placeholder copy, not cleared rights — replace before anything ships.
 */
export const mockPlaces: Place[] = [
  {
    id: 'place-jumunjin',
    name: '주문진 방파제',
    description:
      '바다를 등지고 서면 방파제 끝까지 한 프레임에 들어옵니다. 파도가 높은 날은 진입이 통제돼요.',
    address: '강원특별자치도 강릉시 주문진읍 해안로 1609',
    workTitle: '도깨비',
    lat: 37.8983,
    lng: 128.8306,
    radiusMeters: 50,
    coverImageUrl: 'https://picsum.photos/seed/jumunjin/1200/800',
    ticketCount: 1284,
    createdAt: new Date('2026-03-02T09:00:00+09:00'),
  },
  {
    id: 'place-gamcheon',
    name: '감천문화마을',
    description: '계단식 골목 전체가 배경입니다. 주민 거주 구역이라 촬영 소음에 주의하세요.',
    address: '부산광역시 사하구 감내2로 203',
    workTitle: '변호인',
    lat: 35.0975,
    lng: 129.0107,
    radiusMeters: 50,
    coverImageUrl: 'https://picsum.photos/seed/gamcheon/1200/800',
    ticketCount: 947,
    createdAt: new Date('2026-03-02T09:00:00+09:00'),
  },
  {
    id: 'place-namsan',
    name: 'N서울타워 전망대',
    description: '자물쇠 벽 앞이 인증샷 포인트. 해질녘 30분이 가장 붐빕니다.',
    address: '서울특별시 용산구 남산공원길 105',
    workTitle: '별에서 온 그대',
    lat: 37.5512,
    lng: 126.9882,
    radiusMeters: 50,
    coverImageUrl: 'https://picsum.photos/seed/namsan/1200/800',
    ticketCount: 2103,
    createdAt: new Date('2026-03-02T09:00:00+09:00'),
  },
  {
    id: 'place-cheonggye',
    name: '청계천 광통교',
    description: '다리 아래 물길을 따라 걷는 장면의 실제 위치입니다.',
    address: '서울특별시 종로구 관철동',
    workTitle: '미생',
    lat: 37.569,
    lng: 126.982,
    radiusMeters: 50,
    coverImageUrl: 'https://picsum.photos/seed/cheonggye/1200/800',
    ticketCount: 412,
    createdAt: new Date('2026-04-11T09:00:00+09:00'),
  },
  {
    id: 'place-eurwangni',
    name: '을왕리 해수욕장',
    description: '뮤직비디오 후반부 롱테이크가 촬영된 백사장 북쪽 끝입니다.',
    address: '인천광역시 중구 용유서로 302번길 16',
    workTitle: '밤편지 M/V',
    lat: 37.4463,
    lng: 126.3733,
    radiusMeters: 50,
    coverImageUrl: 'https://picsum.photos/seed/eurwangni/1200/800',
    ticketCount: 268,
    createdAt: new Date('2026-05-20T09:00:00+09:00'),
  },
];
