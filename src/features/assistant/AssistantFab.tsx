import { router } from 'expo-router';
import { ChatCircleDotsIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet } from 'react-native';
import { useTheme } from '@/design-system';
import { Shape } from '@/features/shared';

const DISC = 52;
const BOTTOM = 96;
export const ASSISTANT_FAB_CLEARANCE = BOTTOM + DISC;

/** A quiet, recognizable chat affordance leaves the animated moment to tickets. */
export function AssistantFab() {
  const { token } = useTheme();
  return (
    <Pressable onPress={() => router.push('/chat' as never)} accessibilityRole="button" accessibilityLabel="핀덤 AI에게 물어보기"
      style={({ pressed }) => [styles.fab, { backgroundColor: pressed ? token.accent.fillPressedColor : token.accent.fillColor }]}>
      <ChatCircleDotsIcon size={26} color={token.accent.onFillColor} weight="regular" />
    </Pressable>
  );
}
const styles = StyleSheet.create({
  fab: { position: 'absolute', right: Shape.gutter, bottom: BOTTOM, width: DISC, height: DISC, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
