import { StyleSheet, View } from 'react-native';
import { useAdaptive } from '@/design-system';
import { Shape } from './shape';

interface RuleProps {
  /** `section` is the 2px divider between blocks; `row` the 1px one inside them. */
  weight?: 'section' | 'row';
  /** Inset the rule by the page gutter, for a divider between rows of one block. */
  inset?: boolean;
}

/**
 * The divider `2b` builds structure from.
 *
 * The direction has almost no fills and almost no rounding — a block is bounded
 * by a rule and separated by space, never by a card with a radius and a shadow.
 * That makes this the most-used component in the app, which is why it is here
 * and not copied into each screen.
 */
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
    marginVertical: 18,
  },
  row: {
    borderTopWidth: Shape.rowRule,
  },
});
