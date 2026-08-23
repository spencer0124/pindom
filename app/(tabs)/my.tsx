import Constants from 'expo-constants';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Badge, Button, ErrorPage, Loader, SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { localeLabel, useMyPage } from '@/features/profile';
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
  const { state, reload, refresh, signOut } = useMyPage();
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState(false);

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
      setConfirming(false);
      router.replace('/onboarding' as never);
    }
  };

  const menu: { label: string; value?: string; go: () => void }[] = [
    { label: '프로필 설정', value: user.nickname, go: () => router.push('/profile' as never) },
    { label: '응모 내역 / 당첨 확인', go: () => router.navigate('/tickets' as never) },
    { label: '비공개 보관함', value: `${vaultCount}장`, go: () => router.push('/vault' as never) },
    { label: '내 커뮤니티 글', go: () => router.navigate('/community' as never) },
    {
      label: '위치·카메라 권한',
      value: permissionsGranted ? '허용' : undefined,
      go: () => void Linking.openSettings(),
    },
    { label: '언어 설정', value: localeLabel(user.locale), go: () => router.push('/language' as never) },
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
            onPress={() => setConfirming(true)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.logout, { opacity: pressed ? PRESSED_OPACITY : 1 }]}
          >
            <Txt typography="t6" fontWeight="medium" color={SdsColors.alert500}>
              로그아웃
            </Txt>
          </Pressable>
          <Txt typography="st13" color={adaptive.grey400} style={styles.footer}>
            {user.nickname} · {user.email}
            {version ? ` · v${version}` : ''}
          </Txt>
        </View>
      </ScrollView>

      {confirming && (
        <View style={[styles.overlay, { backgroundColor: SdsColors.greyOpacity800 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => !leaving && setConfirming(false)} />
          <Animated.View
            entering={sheetRise}
            style={[styles.sheet, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}
          >
            <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
              로그아웃할까요?
            </Txt>
            <Txt typography="t7" color={adaptive.grey600}>
              모은 티켓 {user.ticketBalance}장과 비공개 보관함은 계정에 남아 있어요. 다시 로그인하면 그대로 이어집니다.
            </Txt>
            <View style={styles.sheetActions}>
              <Button size="large" style="weak" display="block" disabled={leaving} onPress={() => setConfirming(false)}>
                머무르기
              </Button>
              <Button size="large" type="primary" display="block" loading={leaving} onPress={() => void logout()}>
                로그아웃
              </Button>
            </View>
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
    paddingBottom: 32,
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
