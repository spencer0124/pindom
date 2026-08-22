import { View, StyleSheet } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { Shape, sectionLabel } from './shape';

interface SectionHeaderProps {
  /** Korean, from prototype block 1a. The copy axis is 1a's, not 2b's. */
  title: string;
  /**
   * A figure appended to the title in the accent — 지도 writes the number of
   * 촬영지 this way, and 장소/상세 the number of 촬영 팁. It sits inside the
   * label rather than beside it because 1a sets it as part of the same line.
   *
   * A zero is dropped rather than printed: the block underneath already says
   * 아직 팁이 없어요, and "촬영 팁 0" above it says the same thing twice.
   */
  count?: number;
  /** The right-hand affordance — 전체 보기, 거리순. */
  right?: string;
  /** Off for a header that is already inside a padded block. */
  inset?: boolean;
}

/**
 * A section label.
 *
 * 2b paints these in the accent and tracks them out; that is the one place the
 * acid appears besides the single most important number on screen, so the
 * restraint is the point. The words themselves stay Korean — 2b's mockup writes
 * them in English, but copy comes from 1a and Korean UI copy is final.
 */
export function SectionHeader({ title, count, right, inset = true }: SectionHeaderProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={[styles.row, inset && { paddingHorizontal: Shape.gutter }]}>
      <Txt
        typography="t7"
        fontWeight="bold"
        color={token.accent.fillColor}
        style={sectionLabel}
      >
        {count != null && count > 0 ? `${title} ${count}` : title}
      </Txt>
      {right != null && (
        <Txt typography="t7" color={adaptive.grey400} style={sectionLabel}>
          {right}
        </Txt>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
});
