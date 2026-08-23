import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Button, Txt, useAdaptive, useTheme } from '@/design-system';
import type { Review } from '@/lib/domain';
import { formatTimeAgo, Rule, Shape, tierLabel } from '@/features/shared';

/**
 * The three tips 1a offers as chips on the composer.
 *
 * A fixed set rather than free entry, because the value of a tip here is
 * comparability — "which pose, which angle, what time of day" is the question
 * the section asks, and three chips ask it without a taxonomy.
 */
const TIP_TAGS = ['포즈', '각도', '시간대'] as const;
type TipTag = (typeof TIP_TAGS)[number];

/**
 * Collection tier, in the prototype's own words.
 *
 * `1a` badges a review 인증 방문 instead, but nothing on the review document says
 * its author verified *this* place — the contract stores `authorTier` and calls
 * it "denormalised, rendered as a badge". Building the prototype's label would
 * mean inventing a field, so the badge says what the data actually knows.
 */

interface ReviewListProps {
  reviews: Review[];
  /** Pinned by the screen so every row is measured against one instant. */
  now: Date;
  onSubmit: (text: string, tags: string[]) => Promise<boolean>;
}

/**
 * 촬영 팁 — what fans who went first left behind, and the form to add one.
 *
 * The composer is a raw `TextInput` rather than the design system's `TextField`
 * on purpose: `TextField` is single-line by shape and still hardcodes
 * `SdsColors.grey900` for its ink, which renders near-black on this ground. It
 * is one of the twenty components docs/reference/design-tokens.md lists as not
 * yet converted.
 *
 * The composer always has exactly one tag selected — 1a starts on 포즈, a tap
 * moves the selection, nothing deselects, and a submit keeps it. A tip is
 * never posted untagged. The toggle reads 팁 남기기 open or closed, as 1a's
 * does; the open state is signalled by the chip's selected treatment.
 */
export function ReviewList({ reviews, now, onSubmit }: ReviewListProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [tag, setTag] = useState<TipTag>('포즈');
  const [posting, setPosting] = useState(false);

  const submit = async () => {
    const text = draft.trim();
    if (text.length === 0 || posting) return;
    setPosting(true);
    const ok = await onSubmit(text, [tag]);
    setPosting(false);
    if (ok) {
      setDraft('');
      setOpen(false);
    }
  };

  return (
    <View style={styles.block}>
      <View style={styles.intro}>
        <Txt typography="t7" color={adaptive.grey600}>
          먼저 다녀온 팬들이 남긴 포즈·시간대 꿀팁
        </Txt>
        <Pressable
          onPress={() => setOpen((was) => !was)}
          accessibilityRole="button"
          accessibilityState={{ expanded: open }}
          hitSlop={6}
          style={[
            styles.writeButton,
            { borderColor: open ? token.accent.fillColor : adaptive.grey200 },
          ]}
        >
          <Txt
            typography="t7"
            fontWeight="bold"
            color={open ? token.accent.fillColor : adaptive.grey900}
          >
            팁 남기기
          </Txt>
        </Pressable>
      </View>

      {open && (
        <View style={[styles.composer, { borderColor: adaptive.grey200 }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="어떤 포즈·각도·시간대가 좋았는지 알려주기"
            placeholderTextColor={adaptive.grey400}
            style={[styles.input, { color: adaptive.grey900 }]}
          />
          <View style={styles.tagRow}>
            {TIP_TAGS.map((option) => {
              const picked = tag === option;
              return (
                <Pressable
                  key={option}
                  onPress={() => setTag(option)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: picked }}
                  style={[
                    styles.tag,
                    {
                      backgroundColor: picked ? token.accent.fillColor : 'transparent',
                      borderColor: picked ? token.accent.fillColor : adaptive.grey200,
                    },
                  ]}
                >
                  <Txt
                    typography="t7"
                    fontWeight="bold"
                    color={picked ? token.accent.onFillColor : adaptive.grey600}
                  >
                    {option}
                  </Txt>
                </Pressable>
              );
            })}
            <View style={styles.submit}>
              <Button
                size="tiny"
                type="primary"
                loading={posting}
                disabled={draft.trim().length === 0}
                onPress={submit}
              >
                등록
              </Button>
            </View>
          </View>
        </View>
      )}

      {reviews.length === 0 ? (
        <Txt typography="t6" color={adaptive.grey600} style={styles.empty}>
          아직 팁이 없어요. 첫 번째로 남겨보세요.
        </Txt>
      ) : (
        reviews.map((review, index) => (
          <View key={review.id}>
            {index > 0 && <Rule weight="row" />}
            <View style={styles.review}>
              <View style={styles.byline}>
                <View style={[styles.avatar, { backgroundColor: adaptive.grey100 }]} />
                <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
                  {review.authorNickname}
                </Txt>
                <View style={[styles.tier, { borderColor: token.accent.fillColor }]}>
                  <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor}>
                    {tierLabel[review.authorTier]}
                  </Txt>
                </View>
                <Txt typography="t7" color={adaptive.grey400} style={styles.time}>
                  {formatTimeAgo(review.createdAt, now)}
                </Txt>
              </View>

              <Txt typography="t6" color={adaptive.grey800}>
                {review.text}
              </Txt>

              <View style={styles.footer}>
                {review.tags.map((each) => (
                  <View
                    key={each}
                    style={[styles.chip, { backgroundColor: adaptive.grey100 }]}
                  >
                    <Txt typography="t7" color={adaptive.grey600}>
                      {each}
                    </Txt>
                  </View>
                ))}
                {/* A figure, not a control. `likeCount` is written only by a
                    Cloud Function and no repository method offers to change it,
                    so a tappable heart here would be a button that does
                    nothing. See the backend contract's write-ownership table. */}
                <Txt typography="t7" color={adaptive.grey500} style={styles.likes}>
                  ♡ 도움됐어요 {review.likeCount}
                </Txt>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: {
    gap: 2,
  },
  intro: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingBottom: 12,
  },
  writeButton: {
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Shape.chipRadius,
  },
  composer: {
    borderWidth: 1,
    marginHorizontal: Shape.gutter,
    marginBottom: 14,
    padding: 12,
    gap: 10,
  },
  input: {
    minHeight: 64,
    fontSize: 14,
    lineHeight: 22,
    padding: 0,
    textAlignVertical: 'top',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tag: {
    borderWidth: 1,
    borderRadius: Shape.chipRadius,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  submit: {
    marginLeft: 'auto',
  },
  review: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
    gap: 8,
  },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: Shape.chipRadius,
  },
  tier: {
    borderWidth: 1,
    borderRadius: Shape.chipRadius,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  time: {
    marginLeft: 'auto',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Shape.chipRadius,
  },
  likes: {
    marginLeft: 'auto',
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
});
