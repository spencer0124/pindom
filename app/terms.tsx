import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt, useAdaptive } from '@/design-system';
import { Rule, Shape, sectionLabel } from '@/features/shared';

/**
 * The sentence App Store guideline 1.2 requires, verbatim in substance.
 *
 * 1.2 asks that users agree to terms which "make it clear that there is no
 * tolerance for objectionable content or abusive users". It is a constant for
 * the same reason `APPLE_DISCLAIMER` in 응모 공식 규정 is one: so that it cannot
 * be softened by an edit to the layout below, and so that a reviewer — or the
 * next person to touch this screen — finds exactly one hit for it in the repo.
 *
 * Do not reword this into something conditional. "원칙적으로", "가능합니다" and
 * "검토 후" all weaken it into a policy Apple reads as tolerance.
 */
const NO_TOLERANCE =
  'PINDOM은 불쾌감을 주는 콘텐츠와 다른 이용자를 괴롭히는 행위에 대해 무관용 원칙을 적용합니다. 아래 금지 행위가 확인되면 해당 콘텐츠는 삭제되고 계정은 경고 없이 영구 이용 정지될 수 있습니다.';

interface Section {
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    title: '약관의 적용',
    body: [
      '본 약관은 PINDOM(이하 "서비스")을 이용하는 모든 이용자에게 적용됩니다. 회원가입 시 본 약관에 동의한 것으로 봅니다.',
      '서비스는 촬영지 방문을 GPS로 인증하고, 그 자리에서 찍은 사진으로 티켓을 발행하는 앱입니다. 이용자는 게시글, 촬영 팁, 사진, 닉네임 등 콘텐츠를 직접 작성해 다른 이용자에게 공개할 수 있습니다.',
    ],
  },
  {
    title: '금지되는 콘텐츠와 행위',
    body: [
      NO_TOLERANCE,
      '욕설, 혐오 표현, 차별적 발언, 성적으로 노골적인 내용, 폭력적이거나 잔혹한 묘사를 담은 콘텐츠를 올릴 수 없습니다.',
      '다른 이용자를 괴롭히거나 위협하거나 따라다니는 행위, 특정인을 향한 모욕과 명예훼손을 할 수 없습니다.',
      '타인의 개인정보를 동의 없이 올리거나, 타인을 사칭하거나, 저작권 등 타인의 권리를 침해하는 콘텐츠를 올릴 수 없습니다.',
      '스팸, 광고, 도배, 불법적인 재화나 서비스의 거래를 목적으로 서비스를 이용할 수 없습니다.',
      '위치 정보를 조작하거나 자동화 도구를 사용해 인증과 티켓 발행을 우회할 수 없습니다.',
    ],
  },
  {
    title: '신고와 차단',
    body: [
      '모든 게시글, 촬영 팁, 갤러리 사진에는 ⋯ 버튼이 있습니다. 여기서 해당 콘텐츠를 신고하거나 작성자를 차단할 수 있습니다.',
      '차단한 이용자의 게시글, 촬영 팁, 사진은 앱에서 더 이상 보이지 않습니다. 차단 목록은 마이페이지 > 차단한 사용자에서 확인하고 해제할 수 있습니다.',
      '신고에는 별도의 자격이 필요하지 않으며, 신고했다는 사실은 신고 대상에게 알려지지 않습니다.',
    ],
  },
  {
    title: '운영팀의 조치',
    body: [
      '접수된 신고는 24시간 안에 검토합니다. 위반이 확인되면 콘텐츠를 삭제하고, 사안에 따라 계정 이용을 정지하거나 영구 탈퇴 처리합니다.',
      '게시글과 리뷰는 작성·수정 시점에 서버에서 금칙어 검사를 거치며, 걸리면 자동으로 삭제됩니다.',
      '반복 위반, 또는 한 번으로도 중대한 위반에 해당하는 경우 사전 통보 없이 계정을 영구 정지할 수 있습니다.',
    ],
  },
  {
    title: '계정',
    body: [
      '이용자는 본인의 계정과 비밀번호를 관리할 책임이 있으며, 계정으로 이루어진 활동에 대해 책임을 집니다.',
      '이용자는 언제든 마이페이지 > 회원 탈퇴에서 계정을 삭제할 수 있습니다. 탈퇴하면 계정과 작성한 데이터가 즉시 삭제됩니다.',
    ],
  },
  {
    title: '위치 정보와 사진',
    body: [
      '위치 정보는 촬영지 도착 여부를 확인하는 동안에만 사용하며, 앱을 사용하지 않는 동안에는 수집하지 않습니다.',
      '촬영한 사진은 티켓과 함께 저장되며, 이용자가 공개로 설정한 경우에만 다른 이용자에게 보입니다.',
      '자세한 내용은 개인정보처리방침을 따릅니다.',
    ],
  },
  {
    title: '면책과 변경',
    body: [
      '서비스는 천재지변, 서버 장애 등 불가피한 사유로 일시 중단될 수 있습니다.',
      '약관이 변경되는 경우 앱 안에서 공지하며, 변경된 약관은 공지한 시점부터 적용됩니다.',
    ],
  },
];

/**
 * 이용약관 — the EULA App Store guideline 1.2 requires.
 *
 * 1.2 lists four precautions for an app with user-generated content: a terms
 * agreement, a way to flag content, a way to block users, and a commitment to
 * act on reports. Build 4 shipped the last three and this screen is the first,
 * which is the single item the 2026-09-02 rejection named. See
 * docs/plans/2026-09-02-apple-review-eula.md.
 *
 * **A route, not a URL.** 개인정보처리방침 and 문의하기 are published Notion pages
 * because a reviewer opens them from the store record; this one is a screen for
 * the same reason 응모 공식 규정 is. The agreement has to be reachable *before*
 * an account exists, and a user who has not signed in yet is a user the web
 * links are not in front of — 마이페이지 does not exist for them.
 *
 * Reachable from 온보딩, where the checkbox is, and from 마이페이지 afterwards, so
 * that agreeing once does not put the text out of reach.
 *
 * The layout deliberately matches 응모 공식 규정: plain sections, no accordion.
 * Terms a reviewer has to expand one at a time are terms they report as hidden.
 */
export default function TermsScreen() {
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
          이용약관
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
            약관과 신고 처리에 관한 문의는 마이페이지 &gt; 문의하기의 지원 페이지로 보내주세요.
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
