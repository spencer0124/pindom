import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, ErrorPage, Loader, SdsColors, SdsSpacing, Txt, useAdaptive, useTheme } from '@/design-system';
import { ASSISTANT_FAB_CLEARANCE } from '@/features/assistant';
import { useBlocklist } from '@/features/moderation';
import { localeLabel, useMyPage } from '@/features/profile';
import { ExternalLinks } from '@/lib/links';
import { Rule, Shape } from '@/features/shared';
import { tierView } from '@/features/tickets';

/**
 * 마이페이지 — who you are, what you have collected, and the way into the
 * three small screens.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1597` is the
 * earlier frame.
 *
 * 1a's 화면 테마 row is not here: ADR 0004 and 0006 make every screen dark as a
 * property of the build, not a preference. 인증 이의신청 has nothing in the
 * contract behind it and is not drawn. The 로그아웃 confirm is a block on this
 * screen rather than the design-system Dialog, which still paints a white
 * card. Signing out sends the app to 온보딩, which is where the tab gate would
 * send it anyway.
 *
 * 차단한 사용자 and 회원 탈퇴 are not 1a's either — both are App Store review
 * requirements (guideline 1.2 and 5.1.1(v)). 탈퇴 sits below 로그아웃 rather
 * than inside a submenu because 5.1.1(v) asks for account deletion to be
 * *findable*; burying it is the thing the guideline exists to stop. It shares
 * 로그아웃's confirm block, which is why `confirming` names an action instead of
 * being a boolean.
 *
 * Motion is 1a's: the confirm rises 14px over 280ms on its own curve while the
 * dim behind it is instant, and nothing animates on close. Rows dim to .6
 * while pressed — the touch mapping of 1a's hover (fidelity decision 28).
 */

/** 1a's `fadeUp .28s cubic-bezier(.2,.9,.3,1)` on the 로그아웃 confirm. */
const sheetRise = FadeInDown.duration(280)
  .easing(Easing.bezier(0.2, 0.9, 0.3, 1))
  .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

const PRESSED_OPACITY = 0.6;

export default function MyScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { state, reload, refresh, signOut, deleteAccount } = useMyPage();
  const blockedUserIds = useBlocklist();
  const [confirming, setConfirming] = useState<'logout' | 'delete' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [leaveError, setLeaveError] = useState<string | null>(null);

  const focused = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (focused.current) void refresh();
      focused.current = true;
    }, [refresh]),
  );

  if (state.status === 'loading') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
        <Loader.Centered label="불러오는 중" />
      </SafeAreaView>
    );
  }
  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
        <ErrorPage title="마이페이지를 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      </SafeAreaView>
    );
  }

  const { user, vaultCount, permissionsGranted } = state.data;
  const tier = tierView(user);
  const version = Constants.expoConfig?.version ?? '';

  const logout = async () => {
    setLeaving(true);
    const ok = await signOut();
    setLeaving(false);
    if (ok) {
      setConfirming(null);
      router.replace('/onboarding' as never);
    }
  };

  /**
   * 회원 탈퇴. Routes to 온보딩 on success, exactly as 로그아웃 does — the
   * repository has already cleared the local session by then, so every screen
   * behind this one would be reading against a dead token.
   */
  const leave = async () => {
    setLeaving(true);
    setLeaveError(null);
    const message = await deleteAccount();
    setLeaving(false);
    if (message != null) return setLeaveError(message);
    setConfirming(null);
    router.replace('/onboarding' as never);
  };

  const menu: { label: string; value?: string; go: () => void }[] = [
    { label: '프로필 설정', value: user.nickname, go: () => router.push('/profile' as never) },
    { label: '응모 내역 / 당첨 확인', go: () => router.push('/raffle/history' as never) },
    { label: '비공개 보관함', value: `${vaultCount}장`, go: () => router.push('/vault' as never) },
    { label: '내 커뮤니티 글', go: () => router.push('/my-posts' as never) },
    {
      label: '차단한 사용자',
      value: blockedUserIds.length > 0 ? `${blockedUserIds.length}명` : undefined,
      go: () => router.push('/blocked' as never),
    },
    {
      label: '위치·카메라 권한',
      value: permissionsGranted ? '허용' : undefined,
      go: () => void Linking.openSettings(),
    },
    { label: '언어 설정', value: localeLabel(user.locale), go: () => router.push('/language' as never) },
    // The last three exist for App Store review. 응모 공식 규정 is linked from
    // 응모 as well, but a tester on a fresh account has no tickets and cannot
    // reach that screen — guideline 5.3.2 wants the rules findable, not
    // findable-if-you-have-earned-your-way-in. 문의하기 is guideline 5.1.1(v)'s
    // support page, which is also where account deletion is documented.
    { label: '응모 공식 규정', go: () => router.push('/raffle/rules' as never) },
    { label: '문의하기', go: () => void Linking.openURL(ExternalLinks.support) },
    // 온보딩의 동의 체크박스가 가리키는 것과 같은 화면. 동의는 한 번이지만 약관은
    // 계속 읽을 수 있어야 하고, 가입한 뒤에는 온보딩으로 돌아갈 길이 없다.
    { label: '이용약관', go: () => router.push('/terms' as never) },
    { label: '개인정보처리방침', go: () => void Linking.openURL(ExternalLinks.privacy) },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: adaptive.background, borderColor: adaptive.grey200 }]}>
            {user.avatarUrl != null ? (
              <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <Txt typography="t4" fontWeight="bold" color={adaptive.grey600}>
                {user.nickname.slice(0, 1)}
              </Txt>
            )}
          </View>
          <View style={styles.who}>
            <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>
              {user.nickname}
            </Txt>
            <Badge
              size="small"
              fontWeight="semiBold"
              color={token.accent.fillColor}
              backgroundColor={token.accent.dimColor}
              style={styles.tier}
            >
              {tier.label}
            </Badge>
          </View>
          <Button size="tiny" style="weak" onPress={() => router.push('/profile' as never)}>
            프로필 편집
          </Button>
        </View>

        <Rule />

        <View style={styles.stats}>
          {[
            { k: '방문 인증', v: String(user.ticketsIssued) },
            { k: '지역', v: `${user.placesVisited}곳` },
            { k: '보유 티켓', v: `${user.ticketBalance}장` },
          ].map((stat, index) => (
            <View
              key={stat.k}
              style={[styles.stat, index > 0 && { borderLeftWidth: Shape.rowRule, borderLeftColor: adaptive.grey200 }]}
            >
              <Txt typography="st13" color={adaptive.grey500}>
                {stat.k}
              </Txt>
              <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                {stat.v}
              </Txt>
            </View>
          ))}
        </View>

        <Rule />

        <View>
          {menu.map((item) => (
            <Pressable
              key={item.label}
              onPress={item.go}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: adaptive.grey200, opacity: pressed ? PRESSED_OPACITY : 1 },
              ]}
            >
              <Txt typography="t6" fontWeight="medium" color={adaptive.grey900} style={styles.rowLabel}>
                {item.label}
              </Txt>
              {item.value != null && (
                <Txt typography="t7" color={adaptive.grey500}>
                  {item.value}
                </Txt>
              )}
              <Txt typography="t6" color={adaptive.grey400}>
                ›
              </Txt>
            </Pressable>
          ))}
          <Pressable
            onPress={() => setConfirming('logout')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.logout, { opacity: pressed ? PRESSED_OPACITY : 1 }]}
          >
            <Txt typography="t6" fontWeight="medium" color={SdsColors.alert500}>
              로그아웃
            </Txt>
          </Pressable>
          <Pressable
            onPress={() => {
              setLeaveError(null);
              setConfirming('delete');
            }}
            accessibilityRole="button"
            style={({ pressed }) => [styles.leave, { opacity: pressed ? PRESSED_OPACITY : 1 }]}
          >
            {/* Quieter than 로그아웃 on purpose. The guideline asks that deletion
                be findable, not that it compete with the action almost everyone
                actually wants. */}
            <Txt typography="t7" color={adaptive.grey500}>
              회원 탈퇴
            </Txt>
          </Pressable>
          <Txt typography="st13" color={adaptive.grey400} style={styles.footer}>
            {user.nickname} · {user.email}
            {version ? ` · v${version}` : ''}
          </Txt>
        </View>
      </ScrollView>

      {confirming != null && (
        <View style={[styles.overlay, { backgroundColor: SdsColors.greyOpacity800 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !leaving && setConfirming(null)} />
          <Animated.View
            entering={sheetRise}
            style={[styles.sheet, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}
          >
            {confirming === 'logout' ? (
              <>
                <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                  로그아웃할까요?
                </Txt>
                <Txt typography="t7" color={adaptive.grey600}>
                  모은 티켓 {user.ticketBalance}장과 비공개 보관함은 계정에 남아 있어요. 다시 로그인하면 그대로 이어집니다.
                </Txt>
                <View style={styles.sheetActions}>
                  <Button size="large" style="weak" display="block" disabled={leaving} onPress={() => setConfirming(null)}>
                    머무르기
                  </Button>
                  <Button size="large" type="primary" display="block" loading={leaving} onPress={() => void logout()}>
                    로그아웃
                  </Button>
                </View>
              </>
            ) : (
              <>
                <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                  정말 탈퇴할까요?
                </Txt>
                {/* The numbers are the point. 로그아웃 keeps these and 탈퇴 does
                    not, and the difference is the whole decision — a generic
                    "모든 데이터가 삭제됩니다" makes the user guess what they have. */}
                <Txt typography="t7" color={adaptive.grey600}>
                  방문 인증 {user.ticketsIssued}회, 보유 티켓 {user.ticketBalance}장, 비공개 보관함 {vaultCount}장과 작성한 글·촬영 팁·사진이 모두 삭제됩니다. 삭제된 계정과 기록은 되돌릴 수 없어요.
                </Txt>
                {leaveError != null && (
                  <Txt typography="st13" color={SdsColors.alert500}>
                    {leaveError}
                  </Txt>
                )}
                <View style={styles.sheetActions}>
                  <Button size="large" style="weak" display="block" disabled={leaving} onPress={() => setConfirming(null)}>
                    유지하기
                  </Button>
                  <Button size="large" type="primary" display="block" loading={leaving} onPress={() => void leave()}>
                    탈퇴하기
                  </Button>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  content: {
    paddingBottom: ASSISTANT_FAB_CLEARANCE + SdsSpacing.base,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: Shape.gutter,
    paddingTop: 10,
    paddingBottom: 18,
  },
  avatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  who: {
    flex: 1,
    alignItems: 'flex-start',
    gap: 4,
  },
  tier: {
    borderRadius: Shape.chipRadius,
  },
  stats: {
    flexDirection: 'row',
    paddingVertical: 14,
  },
  stat: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    gap: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 15,
    borderBottomWidth: Shape.rowRule,
  },
  rowLabel: {
    flex: 1,
  },
  logout: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 18,
    paddingBottom: 8,
  },
  leave: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 2,
    paddingBottom: 14,
  },
  footer: {
    paddingHorizontal: Shape.gutter,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: Shape.sectionRule,
    paddingHorizontal: Shape.gutter,
    paddingTop: 20,
    paddingBottom: 28,
    gap: 10,
  },
  sheetActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
