import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { Button, SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { REPORT_REASON_MAX, type ReportTargetType } from '@/lib/domain';
import { Shape } from '@/features/shared';
import { OTHER_REASON, REPORT_REASONS, targetLabel, type ReportReason } from './reasons';
import { useModeration } from './useModeration';

/** 마이페이지's 로그아웃 confirm rises the same way. One motion for one kind of thing. */
const sheetRise = FadeInDown.duration(280)
  .easing(Easing.bezier(0.2, 0.9, 0.3, 1))
  .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

const PRESSED_OPACITY = 0.6;

/** What a 신고 or 차단 is aimed at. */
export interface ModerationTarget {
  type: ReportTargetType;
  /** Document id of the reported thing — the post, the tip, the photo. */
  id: string;
  /** Who made it. 차단 acts on this, never on `id`. */
  authorId: string;
  /**
   * Optional because the 갤러리 has none: `GalleryPhoto` carries `authorId` and
   * no nickname, and the contract does not denormalise one onto it — the grid
   * draws photos, not bylines. `authorName` below is the fallback, so the sheet
   * reads as a sentence either way rather than printing `undefined님`.
   */
  authorNickname?: string;
}

/** What the sheet calls someone it has no name for. */
const ANONYMOUS_AUTHOR = '이 사용자';

interface ModerationSheetProps {
  open: boolean;
  target: ModerationTarget;
  onClose: () => void;
  /**
   * Fired after a successful 차단, so the list that owns the row can react.
   *
   * Optional: the blocklist store already removes the author from every list
   * that filters on it, so most call sites need nothing here.
   */
  onBlocked?: (userId: string) => void;
}

type Stage = 'menu' | 'report' | 'block' | 'reported';

/**
 * 신고 / 차단 — the sheet App Store guideline 1.2 asks of every screen carrying
 * user-generated content.
 *
 * Built as a block rather than with the design system's `Dialog`, for the same
 * reason 마이페이지's 로그아웃 confirm is: `Dialog` still paints a white card,
 * which is wrong on every screen under direction `2b`.
 *
 * Wrapped in a `Modal` rather than positioned absolutely — which the 로그아웃
 * confirm gets away with and this cannot. That sheet is a child of the screen,
 * and `position: absolute` in React Native resolves against the parent view,
 * not the window; this one opens from a ⋯ inside a list row, so an absolute
 * overlay would dim and be clipped to a single post. The design system's
 * `BottomSheet` has the same problem — the non-modal `@gorhom` sheet fills its
 * container — and it rounds its top corners 20px, which `2b` does not do.
 *
 * The two actions are deliberately separate rather than one 신고하고 차단하기
 * button. They do different things — 신고 hands a document to a moderator, 차단
 * changes what this one user sees — and someone who just wants a spammer out of
 * their feed should not have to file a report to get it, nor should someone
 * reporting something serious be forced to block the author.
 *
 * The reason is written as its own Korean label, not a code. `reports` is
 * triaged by a person in the Firebase console, and a person reads 스팸 또는 광고
 * faster than `reason: 'spam'`.
 */
export function ModerationSheet({ open, target, onClose, onBlocked }: ModerationSheetProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { report, block } = useModeration();

  const [stage, setStage] = useState<Stage>('menu');
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [detail, setDetail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Every open starts at the menu. Without this, reopening the sheet on a
  // different post lands on the previous target's half-filled 신고 form.
  useEffect(() => {
    if (open) {
      // Not `goTo` — that is declared below the `if (!open) return null` guard,
      // so it does not exist on a render where the sheet is closed. This effect
      // already clears `error` two lines down anyway.
      setStage('menu');
      setReason(REPORT_REASONS[0]);
      setDetail('');
      setError(null);
    }
  }, [open, target.id]);

  if (!open) return null;

  const noun = targetLabel[target.type];
  const authorName = target.authorNickname ?? ANONYMOUS_AUTHOR;
  /**
   * Move between stages, and drop whatever the last one failed with.
   *
   * `error` is one field shared by 신고 and 차단, so a failed 신고 followed by
   * 뒤로 → 차단하기 would open the block confirmation already showing "잠시 후
   * 다시 시도해 주세요" — an error for something the user has not tried yet.
   * Every stage change goes through here for that reason.
   */
  const goTo = (next: Stage) => {
    setError(null);
    setStage(next);
  };
  const dismiss = () => {
    if (!busy) onClose();
  };

  const submitReport = async () => {
    // 기타 with nothing typed is a report a moderator cannot act on, so the
    // typed text becomes the reason rather than being appended to the label.
    const text = reason === OTHER_REASON ? detail.trim() : reason;
    if (text.length === 0 || busy) return;
    setBusy(true);
    setError(null);
    const message = await report({
      targetType: target.type,
      targetId: target.id,
      reason: text.slice(0, REPORT_REASON_MAX),
    });
    setBusy(false);
    if (message != null) return setError(message);
    goTo('reported');
  };

  const submitBlock = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    const message = await block(target.authorId, target.authorNickname);
    setBusy(false);
    if (message != null) return setError(message);
    onBlocked?.(target.authorId);
    onClose();
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={dismiss}>
      <View style={[styles.overlay, { backgroundColor: SdsColors.greyOpacity800 }]}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={dismiss}
          accessibilityRole="button"
          accessibilityLabel="닫기"
        />
        <Animated.View
          entering={sheetRise}
          style={[
            styles.sheet,
            { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 },
          ]}
        >
          {stage === 'menu' && (
            <>
              <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                {noun}
              </Txt>
              <Txt typography="t7" color={adaptive.grey600}>
                {authorName}님이 올린 {noun}이에요.
              </Txt>
              <View style={styles.menu}>
                <Pressable
                  onPress={() => goTo('report')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.menuRow,
                    { borderTopColor: adaptive.grey200, opacity: pressed ? PRESSED_OPACITY : 1 },
                  ]}
                >
                  <Txt typography="t6" fontWeight="medium" color={adaptive.grey900}>
                    {noun} 신고하기
                  </Txt>
                </Pressable>
                <Pressable
                  onPress={() => goTo('block')}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.menuRow,
                    { borderTopColor: adaptive.grey200, opacity: pressed ? PRESSED_OPACITY : 1 },
                  ]}
                >
                  <Txt typography="t6" fontWeight="medium" color={SdsColors.alert500}>
                    {authorName}님 차단하기
                  </Txt>
                </Pressable>
              </View>
              <Button size="large" style="weak" display="block" onPress={onClose}>
                닫기
              </Button>
            </>
          )}

          {stage === 'report' && (
            <>
              <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                {noun} 신고
              </Txt>
              <Txt typography="t7" color={adaptive.grey600}>
                신고 내용은 운영자만 확인하며, 신고한 사실은 상대방에게 알려지지 않아요.
              </Txt>
              <View style={styles.reasons}>
                {REPORT_REASONS.map((option) => {
                  const picked = reason === option;
                  return (
                    <Pressable
                      key={option}
                      onPress={() => setReason(option)}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: picked }}
                      style={({ pressed }) => [
                        styles.reason,
                        {
                          borderColor: picked ? token.accent.fillColor : adaptive.grey200,
                          opacity: pressed ? PRESSED_OPACITY : 1,
                        },
                      ]}
                    >
                      <Txt
                        typography="t7"
                        fontWeight={picked ? 'bold' : 'medium'}
                        color={picked ? token.accent.fillColor : adaptive.grey700}
                      >
                        {option}
                      </Txt>
                    </Pressable>
                  );
                })}
              </View>

              {reason === OTHER_REASON && (
                <TextInput
                  value={detail}
                  onChangeText={setDetail}
                  multiline
                  maxLength={REPORT_REASON_MAX}
                  placeholder="어떤 점이 문제인지 알려주세요"
                  placeholderTextColor={adaptive.grey400}
                  style={[styles.detail, { color: adaptive.grey900, borderColor: adaptive.grey200 }]}
                />
              )}

              {error != null && (
                <Txt typography="st13" color={SdsColors.alert500}>
                  {error}
                </Txt>
              )}

              <View style={styles.actions}>
                <Button
                  size="large"
                  style="weak"
                  display="block"
                  disabled={busy}
                  onPress={() => goTo('menu')}
                >
                  뒤로
                </Button>
                <Button
                  size="large"
                  type="primary"
                  display="block"
                  loading={busy}
                  disabled={reason === OTHER_REASON && detail.trim().length === 0}
                  onPress={() => void submitReport()}
                >
                  신고하기
                </Button>
              </View>
            </>
          )}

          {stage === 'block' && (
            <>
              <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                {authorName}님을 차단할까요?
              </Txt>
              <Txt typography="t7" color={adaptive.grey600}>
                차단하면 이 사용자의 게시글·촬영 팁·사진이 더 이상 보이지 않아요. 차단은
                마이페이지의 차단한 사용자에서 언제든 해제할 수 있어요.
              </Txt>

              {error != null && (
                <Txt typography="st13" color={SdsColors.alert500}>
                  {error}
                </Txt>
              )}

              <View style={styles.actions}>
                <Button
                  size="large"
                  style="weak"
                  display="block"
                  disabled={busy}
                  onPress={() => goTo('menu')}
                >
                  취소
                </Button>
                <Button
                  size="large"
                  type="primary"
                  display="block"
                  loading={busy}
                  onPress={() => void submitBlock()}
                >
                  차단하기
                </Button>
              </View>
            </>
          )}

          {stage === 'reported' && (
            <>
              <Txt typography="t4" fontWeight="bold" color={adaptive.grey900}>
                신고가 접수되었어요
              </Txt>
              <Txt typography="t7" color={adaptive.grey600}>
                운영자가 확인한 뒤 조치할게요. 이 사용자의 글을 더 보고 싶지 않다면 차단도 함께 할
                수 있어요.
              </Txt>
              <View style={styles.actions}>
                <Button size="large" style="weak" display="block" onPress={() => goTo('block')}>
                  차단도 하기
                </Button>
                <Button size="large" type="primary" display="block" onPress={onClose}>
                  확인
                </Button>
              </View>
            </>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
  menu: {
    marginTop: 6,
  },
  menuRow: {
    borderTopWidth: Shape.rowRule,
    paddingVertical: 16,
  },
  reasons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  reason: {
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  detail: {
    borderWidth: 1,
    minHeight: 72,
    paddingHorizontal: 12,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
});
