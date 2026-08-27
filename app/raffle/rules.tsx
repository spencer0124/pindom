import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt, useAdaptive } from '@/design-system';
import { Rule, Shape, sectionLabel } from '@/features/shared';

/**
 * The one sentence App Store guideline 5.3.2 requires, verbatim in substance.
 *
 * "Official rules must be presented in the app and make clear that Apple is
 * not a sponsor or involved in the activity in any way." It is a constant so
 * that it cannot be reworded into something weaker by an edit to the layout
 * below, and so that a reviewer looking for it in this repo finds one hit.
 */
const APPLE_DISCLAIMER =
  '본 응모·추첨은 PINDOM이 단독으로 주최·운영합니다. Apple Inc.는 본 응모·추첨의 후원자가 아니며, 주최·운영·경품 제공 등 어떠한 방식으로도 관여하지 않습니다.';

interface Section {
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    title: '주최 및 운영',
    body: [
      'PINDOM(이하 "운영팀")이 본 응모·추첨을 단독으로 주최하고 운영합니다.',
      APPLE_DISCLAIMER,
    ],
  },
  {
    title: '참가 자격',
    body: [
      'PINDOM 계정으로 로그인한 이용자는 누구나 참가할 수 있습니다.',
      '만 14세 미만은 법정대리인의 동의가 필요합니다.',
    ],
  },
  {
    title: '응모권(티켓) 취득 방법',
    body: [
      '티켓은 촬영지에 실제로 방문해 GPS 인증에 성공하면 발행됩니다.',
      '티켓은 판매하지 않습니다. 앱 내 결제나 현금 구매로 티켓을 얻는 방법은 없으며, 응모에는 어떠한 비용도 들지 않습니다.',
    ],
  },
  {
    title: '응모 방법',
    body: [
      '응모 화면에서 경품을 고르고 표시된 수량만큼 티켓을 사용하면 응모가 완료됩니다.',
      '사용한 티켓은 즉시 차감되며, 응모를 취소하거나 티켓을 돌려받을 수 없습니다.',
      '한 사람이 같은 경품에 여러 번 응모할 수 있으며, 응모할 때마다 표시된 수량만큼 티켓이 차감됩니다.',
    ],
  },
  {
    title: '응모 기간',
    body: [
      '경품마다 마감 시각이 다르며, 각 경품 카드에 남은 시간이 표시됩니다.',
      '마감 시각이 지나면 응모가 접수되지 않습니다. 마감 직전에 접수된 응모는 서버 시각을 기준으로 판정합니다.',
    ],
  },
  {
    title: '당첨자 선정 및 발표',
    body: [
      '마감 후 접수된 응모 중에서 무작위로 당첨자를 선정합니다.',
      // Email, and nothing else. The app has no list of past entries — 컬렉션
      // draws the balance, the tier gauge and the ticket tiles, and no
      // repository method returns a user's entries — and `PINDOM.entitlements`
      // is an empty dict, so the build cannot send a push either. These are
      // the operative rules of a real draw now; a channel that does not exist
      // is not a channel that can be promised.
      '당첨자에게는 마감 후 가입하신 이메일 주소로 개별 안내드립니다.',
      '당첨자 정보가 사실과 다르거나 안내 후 7일 안에 회신이 없는 경우 당첨이 취소될 수 있습니다.',
    ],
  },
  {
    title: '경품 수령',
    body: [
      '경품은 양도·교환·현금 환급이 되지 않습니다.',
      '경품 수령에 필요한 세금과 부대 비용이 있는 경우 관련 법령에 따릅니다.',
    ],
  },
  {
    title: '유의사항',
    body: [
      '위치 정보를 조작하는 등 부정한 방법으로 티켓을 얻은 사실이 확인되면 응모와 당첨이 무효 처리되고 계정 이용이 제한될 수 있습니다.',
      '운영팀은 불가피한 사정이 있는 경우 사전 고지 후 경품을 동등한 가치의 다른 경품으로 대체하거나 응모를 중단할 수 있습니다.',
    ],
  },
];

/**
 * 응모 공식 규정 — the screen App Store guideline 5.3.2 requires.
 *
 * 5.3.2 asks for two things and this screen exists for both: the official rules
 * of the promotion presented *inside the app*, and an unambiguous statement
 * that Apple neither sponsors nor is involved in it. A link to a web page would
 * not satisfy the first, which is why this is a route and not a URL on 응모.
 *
 * Reachable from two places on purpose — the 응모 footer, where the decision to
 * spend tickets is made, and 마이페이지, which is reachable without owning a
 * single ticket. An App Review tester on a fresh account cannot get to 응모, so
 * a rules screen linked only from there is a rules screen they will report as
 * missing.
 *
 * Plain sections rather than an accordion: rules that have to be opened one at
 * a time are rules a reviewer has to hunt through, and there is not enough text
 * here to justify the interaction.
 *
 * **These are the rules of a real prize draw, decided 2026-08-27.** An earlier
 * draft carried a "시연용 예시" banner and rules that only applied once a real
 * draw began; the draw is real and PINDOM sponsors it, so the banner is gone
 * and every clause below is in force now. That also settles guideline 5.3.4,
 * which requires the app's developer to be the sponsor — PINDOM is, and the
 * 주최 및 운영 section says so. The App Review notes must **not** describe this
 * flow as demonstration-only. See
 * docs/plans/2026-08-27-apple-review-app-items.md.
 */
export default function RaffleRulesScreen() {
  const adaptive = useAdaptive();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.headerSide}
        >
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            ‹ 뒤로
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          응모 공식 규정
        </Txt>
        <View style={styles.headerSide} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {SECTIONS.map((section, index) => (
          <View key={section.title}>
            {index > 0 && <Rule weight="row" />}
            <View style={styles.section}>
              <Txt
                typography="st13"
                fontWeight="bold"
                color={adaptive.grey500}
                style={sectionLabel}
              >
                {section.title}
              </Txt>
              {section.body.map((line) => (
                <Txt key={line} typography="t6" color={adaptive.grey800}>
                  {line}
                </Txt>
              ))}
            </View>
          </View>
        ))}

        <Rule />

        <View style={styles.section}>
          <Txt typography="st13" fontWeight="bold" color={adaptive.grey500} style={sectionLabel}>
            문의
          </Txt>
          <Txt typography="t6" color={adaptive.grey800}>
            응모와 경품에 관한 문의는 마이페이지 &gt; 문의하기의 지원 페이지로 보내주세요.
          </Txt>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  headerSide: {
    width: 48,
  },
  content: {
    paddingBottom: 32,
  },
  section: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 16,
    gap: 8,
  },
});
