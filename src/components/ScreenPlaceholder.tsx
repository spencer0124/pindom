import { router } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SdsColors, Txt } from '@/design-system';

export interface ScreenPlaceholderProps {
  /** Screen name as it appears in the Figma file, e.g. "GPS인증". */
  title: string;
  /** The Figma node id this screen is built from, e.g. "33:2330". */
  node?: string;
  /** What this screen does, one line, taken from the flowchart. */
  note?: string;
  /** Outgoing routes, mirroring the flowchart's arrows. */
  next?: { label: string; href: string }[];
}

/**
 * Temporary stand-in for a screen that has not been implemented yet.
 *
 * It deliberately renders the Figma node id and the flowchart's outgoing
 * transitions: that turns the route skeleton into a walkable prototype, so the
 * navigation graph can be checked against the flowchart before any pixel work
 * starts. Replace each of these with the real screen, one node at a time.
 */
export function ScreenPlaceholder({ title, node, note, next }: ScreenPlaceholderProps) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Txt typography="t2" fontWeight="bold" color={SdsColors.grey900}>
          {title}
        </Txt>
        {node != null && (
          <Txt typography="t7" color={SdsColors.grey500}>
            Figma {node}
          </Txt>
        )}
        {note != null && (
          <Txt typography="t6" color={SdsColors.grey600} style={styles.note}>
            {note}
          </Txt>
        )}

        {next != null && next.length > 0 && (
          <View style={styles.actions}>
            {next.map((n) => (
              <Button
                key={n.href}
                size="medium"
                type="primary"
                onPress={() => router.push(n.href as never)}
              >
                {n.label}
              </Button>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: SdsColors.greyBackground,
  },
  content: {
    padding: 20,
    gap: 8,
  },
  note: {
    marginTop: 4,
  },
  actions: {
    marginTop: 24,
    gap: 12,
  },
});
