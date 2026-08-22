import { View, StyleSheet } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { HomeShape, sectionLabel } from './homeStyles';

interface SectionHeaderProps {
  /** Korean, from prototype block 1a. The copy axis is 1a's, not 2b's. */
  title: string;
  /** The right-hand affordance — 전체 보기, 거리순. */
  right?: string;
}

/**
 * A 홈 section label.
 *
 * 2b paints these in the accent and tracks them out; that is the one place the
 * acid appears besides the single most important number on screen, so the
 * restraint is the point. The words themselves stay Korean — 2b's mockup writes
 * them in English, but copy comes from 1a and Korean UI copy is final.
 */
export function SectionHeader({ title, right }: SectionHeaderProps) {
  const adaptive = useAdaptive();
  const { token } = useTheme();

  return (
    <View style={styles.row}>
      <Txt
        typography="t7"
        fontWeight="bold"
        color={token.accent.fillColor}
        style={sectionLabel}
      >
        {title}
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
    paddingHorizontal: HomeShape.gutter,
    paddingBottom: 12,
  },
});
