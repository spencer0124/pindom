import { Pressable, StyleSheet, View } from 'react-native';
import { Txt, useAdaptive, useTheme } from '@/design-system';

export const TOOLS = ['모자이크', '스티커', '자르기'] as const;
export type ToolId = (typeof TOOLS)[number];

export function ToolStrip({ tool, onPickTool }: { tool: ToolId; onPickTool: (tool: ToolId) => void }) {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  return (
    <View style={styles.row}>
      {TOOLS.map((option) => (
        <Pressable key={option} onPress={() => onPickTool(option)} accessibilityRole="button"
          accessibilityState={{ selected: option === tool }}
          style={[styles.tool, { borderColor: option === tool ? token.accent.fillColor : adaptive.grey200 }]}>
          <Txt typography="t7" fontWeight="bold" color={option === tool ? adaptive.grey900 : adaptive.grey600}>{option}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  tool: { flex: 1, minHeight: 44, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
