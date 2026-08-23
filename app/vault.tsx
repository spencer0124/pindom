import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorPage, Loader, TextButton, Txt, useAdaptive, useTheme } from '@/design-system';
import { useVault } from '@/features/profile';
import { Rule, Shape } from '@/features/shared';

/**
 * 보관함 — the private tickets, and 공개 전환.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. The route screens.md
 * proposed; there is no Figma frame.
 *
 * The same tickets as 컬렉션, the other visibility — `tickets.listVault` is the
 * same query with `visibility == 'private'`. 1a's 공개 전환 · 가능 line is the
 * one action here: each tile can be made public, which moves it to 컬렉션 and,
 * server-side, into the place's gallery.
 *
 * The tickets are 1a's two-column grid of 3:4 photos — a vault reads as photos,
 * not as settings rows — laid out the way `TicketGrid` lays out 컬렉션. The
 * 비공개 chip sits on the photo, the caption carries the place and the serial
 * line, and 공개 전환 is a text button in that caption (fidelity decision 26).
 * The typography map has no monospaced face, so the serial line is set in
 * tabular figures, as the ticket itself is.
 */

/** 1a's tile photo is 3:4. */
const PHOTO_ASPECT = 3 / 4;

export default function VaultScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { state, reload, makePublic } = useVault();

  const count = state.status === 'ready' ? state.tickets.length : null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            ‹ 마이
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          비공개 보관함
        </Txt>
        <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor} style={[styles.headerSide, styles.headerRight]}>
          {count != null ? `${count}장` : ''}
        </Txt>
      </View>

      {state.status === 'loading' ? (
        <Loader.Centered label="불러오는 중" />
      ) : state.status === 'error' ? (
        <ErrorPage title="보관함을 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.intro}>
            <Txt typography="t5" fontWeight="bold" color={adaptive.grey900}>
              여기 있는 사진은 나만 봅니다
            </Txt>
            <Txt typography="st13" color={adaptive.grey600}>
              촬영 후 ‘비공개 저장’을 고른 컷이 모입니다. 장소 갤러리·커뮤니티에 노출되지 않고, 티켓과 응모 자격은 공개 여부와 무관하게 그대로 유지됩니다.
            </Txt>
          </View>

          <View style={[styles.stats, { borderColor: adaptive.grey200 }]}>
            {[
              { k: '보관 중', v: `${state.tickets.length}장` },
              { k: '연결된 티켓', v: `${state.tickets.length}장` },
              { k: '공개 전환', v: '가능', accent: true },
            ].map((stat, index) => (
              <View
                key={stat.k}
                style={[styles.stat, index > 0 && { borderLeftWidth: Shape.rowRule, borderLeftColor: adaptive.grey200 }]}
              >
                <Txt typography="st13" color={adaptive.grey500}>
                  {stat.k}
                </Txt>
                <Txt typography="t6" fontWeight="bold" color={stat.accent ? token.accent.fillColor : adaptive.grey900}>
                  {stat.v}
                </Txt>
              </View>
            ))}
          </View>

          <Rule />

          {state.tickets.length === 0 ? (
            <View style={styles.empty}>
              <Txt typography="t6" color={adaptive.grey600} textAlign="center">
                비공개로 저장한 컷이 아직 없어요
              </Txt>
            </View>
          ) : (
            <View style={styles.grid}>
              {state.tickets.map((ticket) => (
                <View key={ticket.id} style={[styles.tile, { borderColor: adaptive.grey200 }]}>
                  <View style={[styles.photo, { backgroundColor: adaptive.background }]}>
                    <Image source={{ uri: ticket.photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                    <View style={[styles.badge, { backgroundColor: adaptive.background }]}>
                      <Txt typography="st13" fontWeight="semiBold" color={adaptive.grey900}>
                        비공개
                      </Txt>
                    </View>
                  </View>
                  <View style={styles.caption}>
                    <View style={styles.copy}>
                      <Txt typography="t7" fontWeight="bold" color={adaptive.grey900} numberOfLines={1}>
                        {ticket.placeName}
                      </Txt>
                      <Txt
                        typography="st13"
                        color={adaptive.grey500}
                        style={styles.serial}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.8}
                      >
                        {ticket.serial} · {formatShort(ticket.issuedAt)}
                      </Txt>
                    </View>
                    <TextButton
                      typography="st13"
                      fontWeight="bold"
                      color={token.accent.fillColor}
                      onPress={() => void makePublic(ticket.id)}
                    >
                      공개 전환
                    </TextButton>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/** 08.12 — the month and day 1a prints beside the serial. */
function formatShort(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
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
  headerRight: {
    textAlign: 'right',
  },
  content: {
    paddingBottom: 24,
  },
  intro: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  stats: {
    flexDirection: 'row',
    marginHorizontal: Shape.gutter,
    marginBottom: 16,
    borderWidth: 1,
    paddingVertical: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 12,
    gap: 4,
  },
  empty: {
    paddingVertical: 40,
    paddingHorizontal: Shape.gutter,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Shape.gutter,
    paddingTop: 14,
  },
  tile: {
    // Two across with the 10px gap between; an odd last tile keeps its width.
    width: '48.5%',
    borderWidth: Shape.rowRule,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: PHOTO_ASPECT,
  },
  badge: {
    position: 'absolute',
    left: 8,
    top: 8,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: Shape.chipRadius,
    opacity: 0.94,
  },
  caption: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: 10,
  },
  copy: {
    flex: 1,
    gap: 3,
  },
  serial: {
    fontVariant: ['tabular-nums'],
  },
});
