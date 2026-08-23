import { Image } from 'expo-image';
import { MapPinIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import type { Post } from '@/lib/domain';
import { formatTimeAgo, Shape, tierLabel } from '@/features/shared';

/** 1a's 15px map-pin outline — the same glyph the 지도 tab draws. */
const PIN_ICON = 15;
/** Rows dim while pressed; the prototype's hover has no touch equivalent. */
const PRESSED_OPACITY = 0.6;

interface PostRowProps {
  post: Post;
  now: Date;
  onOpenPlace: (placeId: string) => void;
}

/**
 * One post: who, when, which club; the text; the pin if there is one; the
 * counts.
 *
 * 1a's row exactly — and 1a draws no photo, so `imageUrls` is not rendered
 * here though the contract carries it; the Community checklist records that.
 * The pin is the one thing on the row that goes somewhere: 지도에서 보기 opens
 * the 촬영지. ♡ is a figure, not a control — nothing in the contract writes
 * `likeCount` from the client.
 */
export function PostRow({ post, now, onOpenPlace }: PostRowProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.row, { borderTopColor: adaptive.grey200 }]}>
      <View style={styles.head}>
        <View style={[styles.avatar, { backgroundColor: adaptive.background, borderColor: adaptive.grey200 }]}>
          {post.authorAvatarUrl != null && (
            <Image source={{ uri: post.authorAvatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
          )}
        </View>
        <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
          {post.authorNickname}
        </Txt>
        <Txt typography="st13" color={adaptive.grey500}>
          {formatTimeAgo(post.createdAt, now)}
        </Txt>
        <View style={[styles.tier, { borderColor: token.accent.fillColor }]}>
          <Txt typography="st13" fontWeight="bold" color={token.accent.fillColor}>
            {tierLabel[post.authorTier]}
          </Txt>
        </View>
      </View>

      <Txt typography="t6" color={adaptive.grey900}>
        {post.body}
      </Txt>

      {post.placeId != null && post.placeName != null && (
        <Pressable
          onPress={() => onOpenPlace(post.placeId!)}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.pin,
            { borderColor: adaptive.grey200 },
            pressed && styles.pressed,
          ]}
        >
          <MapPinIcon size={PIN_ICON} color={token.accent.fillColor} weight="regular" />
          <Txt typography="st13" fontWeight="bold" color={adaptive.grey900} style={styles.pinName}>
            {post.placeName}
          </Txt>
          <Txt typography="st13" color={adaptive.grey500}>
            지도에서 보기
          </Txt>
        </Pressable>
      )}

      <View style={styles.counts}>
        <Txt typography="st13" fontWeight="medium" color={adaptive.grey500}>
          ♡ {post.likeCount}
        </Txt>
        <Txt typography="st13" fontWeight="medium" color={adaptive.grey500}>
          답글 {post.commentCount}
        </Txt>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderTopWidth: Shape.rowRule,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
    gap: 10,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // The same author wears the same square on 촬영 팁 (2b: radius is for chips
  // only).
  avatar: {
    width: 30,
    height: 30,
    borderRadius: Shape.chipRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tier: {
    marginLeft: 'auto',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  pinName: {
    flex: 1,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
  counts: {
    flexDirection: 'row',
    gap: 16,
  },
});
