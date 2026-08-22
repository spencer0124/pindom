import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';
import { Txt, useTheme } from '@/design-system';

/**
 * The floating Pindom AI button the 2026-08-20 drop put on the five tabbed
 * screens — the only way into `chat`. One component, mounted once over the
 * tab navigator, so it sits in the same place on every tab.
 *
 * Round: the one other rounded thing besides chips, because a floating
 * button is a chip that floats.
 */
export function AssistantFab() {
  const { token } = useTheme();
  return (
    <Pressable
      onPress={() => router.push('/chat' as never)}
      accessibilityRole="button"
      accessibilityLabel="Pindom AI"
      style={[styles.fab, { backgroundColor: token.accent.fillColor }]}
    >
      <Txt typography="t7" fontWeight="bold" color={token.accent.onFillColor}>
        AI
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 18,
    bottom: 96,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
