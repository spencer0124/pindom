import { DotsThreeIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { SdsColors, useAdaptive } from '@/design-system';
import { Shape } from '@/features/shared';
import { ModerationSheet, type ModerationTarget } from './ModerationSheet';
import { useModerationStore } from './state';
import { useBlocklist } from './useModeration';

const ICON = 18;
const PRESSED_OPACITY = 0.6;

interface ModerationButtonProps {
  target: ModerationTarget;
  /**
   * `overlay` sits on top of an image and needs its own ground to stay legible;
   * `inline` is the bare glyph a text row carries.
   */
  variant?: 'inline' | 'overlay';
  onBlocked?: (userId: string) => void;
}

/**
 * The ⋯ that opens 신고 / 차단, and the sheet behind it.
 *
 * The state lives here rather than on each screen so a call site is one element
 * — 커뮤니티's feed, 촬영 팁's rows and the 갤러리's cells each just drop this in.
 * Guideline 1.2 wants the control on the content itself rather than filed away
 * in a settings screen, and a component that costs one line is the version that
 * actually ends up on all three.
 *
 * `hitSlop` is generous because the glyph is small and sits at the edge of a row
 * that may itself be tappable — on 커뮤니티 the row does nothing, but a 갤러리
 * cell is a photo.
 *
 * Draws nothing on the user's own content. 차단 refuses a self-block at the
 * repository boundary, so the row would offer an action that always fails; and
 * a 신고 filed against yourself is a document a moderator has to read and
 * discard.
 */
export function ModerationButton({ target, variant = 'inline', onBlocked }: ModerationButtonProps) {
  const adaptive = useAdaptive();
  const [open, setOpen] = useState(false);
  // Mounting this is also what loads the blocklist, so a screen that renders
  // the ⋯ never has to remember to ask for it separately.
  useBlocklist();
  const myUserId = useModerationStore((s) => s.userId);

  if (myUserId != null && myUserId === target.authorId) return null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="신고 또는 차단"
        hitSlop={10}
        style={({ pressed }) => [
          styles.button,
          variant === 'overlay' && [styles.overlay, { backgroundColor: SdsColors.greyOpacity800 }],
          pressed && { opacity: PRESSED_OPACITY },
        ]}
      >
        {/* `grey900` is the brightest ink in the adaptive ladder, which is what
            an overlay on a photo needs; `grey500` is the metadata tone every
            other glyph on a row uses. Neither is a raw hex. */}
        <DotsThreeIcon
          size={ICON}
          color={variant === 'overlay' ? adaptive.grey900 : adaptive.grey500}
          weight="bold"
        />
      </Pressable>

      {/* Mounted only while open: the sheet contains a `Modal`, and one per row
          of a long feed is a cost the list should not carry when nothing is
          being reported. */}
      {open && (
        <ModerationSheet
          open
          target={target}
          onClose={() => setOpen(false)}
          onBlocked={onBlocked}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 26,
    height: 26,
  },
  overlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    borderRadius: Shape.chipRadius,
  },
});
