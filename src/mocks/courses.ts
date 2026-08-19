import type { Course } from '../lib/domain';

/** 코스 fixtures — ordered itineraries shown on 홈. */
export const mockCourses: Course[] = [
  {
    id: 'course-gangneung',
    artistId: 'artist-lumina',
    name: '강릉 바다 코스',
    description: '방파제에서 시작해 해안도로를 따라 걷는 반나절 코스',
    placeIds: ['place-jumunjin', 'place-eurwangni'],
    placeCount: 2,
  },
  {
    id: 'course-seoul-night',
    artistId: 'artist-lumina',
    name: '서울 야경 코스',
    description: '해질녘에 출발해 남산에서 마무리하는 저녁 코스',
    placeIds: ['place-cheonggye', 'place-namsan'],
    placeCount: 2,
  },
];
