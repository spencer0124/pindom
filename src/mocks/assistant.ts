import type { AssistantAsk, AssistantReply } from '../lib/domain';
import { mockCourses } from './courses';

/**
 * Pindom AI fixtures — one canned answer per chip on the empty chat, and a
 * fallback. The real answers are the backend's model; these only have to be
 * shaped like them: plain text, no markdown, a route answer carrying a course.
 *
 * Matching is on the words the chips put in the question, so typing a
 * question by hand that mentions 동선 or 맛집 lands on the same answer.
 */
export function mockAssistantReply(input: AssistantAsk): AssistantReply {
  const q = input.message;
  const course =
    mockCourses.find((c) => c.artistId === input.artistId) ?? mockCourses[0];

  if (/동선|코스|1박/.test(q)) {
    return {
      text:
        `${course.name}로 잡아볼게요. ${course.description}.\n` +
        `· 1일차 오전에 첫 촬영지에서 인증하고, 점심은 근처에서\n` +
        `· 오후에 다음 촬영지로 이동해 해 질 무렵 원본 컷 각도로 촬영\n` +
        `· 이동 순서는 지도에서 코스 보기로 확인할 수 있어요`,
      courseId: course.id,
    };
  }
  if (/맛집|밥집|카페|먹/.test(q)) {
    return {
      text:
        '아침 일찍 여는 곳은 촬영지 반경 1km 안에 보통 두세 곳 있어요.\n' +
        '· 해장국집은 대개 6시 전후로 열어요\n' +
        '· 카페는 8시 이후가 안전해요\n' +
        '정확한 영업시간은 앱의 장소 정보에서 확인해 주세요.',
    };
  }
  if (/시간|사람 적은|인증하고/.test(q)) {
    return {
      text:
        '해 뜨고 한 시간 안이 가장 비어 있어요. 주말은 10시 이후부터 붐비기 시작합니다.\n' +
        '· 원본 컷 색감은 해 지기 30분 전이 가장 비슷해요\n' +
        '· GPS 정확도는 건물 사이보다 트인 곳에서 좋습니다',
    };
  }
  if (/티켓|응모|팬사인회/.test(q)) {
    return {
      text:
        '같은 지역 촬영지를 하루에 묶어서 도는 게 가장 빨라요.\n' +
        '· 한 촬영지는 30일에 한 번만 발행돼요\n' +
        '· 지역 코스로 묶으면 하루에 2~3장까지 가능합니다\n' +
        '· 20장을 채우면 팬사인회·굿즈 응모가 열려요',
    };
  }
  return {
    text: '촬영지 동선, 근처 맛집, 촬영하기 좋은 시간대, 티켓 모으는 법을 도와드릴 수 있어요. 무엇이 궁금하세요?',
  };
}
