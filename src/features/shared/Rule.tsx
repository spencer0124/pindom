import { StyleSheet, View } from 'react-native';
import { useAdaptive } from '@/design-system';
import { Shape } from './shape';

interface RuleProps {
  /** `section` separates blocks with space; `row` adds a subtle divider. */
  weight?: 'section' | 'row';
  /** Inset the rule by the page gutter, for a divider between rows of one block. */
  inset?: boolean;
}

/** Section spacing and quiet row dividers; grouping no longer needs heavy rules. */
export function Rule({ weight = 'section', inset = false }: RuleProps) {
  const adaptive = useAdaptive();

  return (
    <View
      style={[
        weight === 'section' ? styles.section : styles.row,
        { borderTopColor: adaptive.grey200 },
        inset && { marginHorizontal: Shape.gutter },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  section: {
    borderTopWidth: Shape.sectionRule,
    marginVertical: 14,
  },
  row: {
    borderTopWidth: Shape.rowRule,
  },
});
