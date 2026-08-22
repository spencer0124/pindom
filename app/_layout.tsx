import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { SDSProvider } from '@/design-system';

/**
 * Provider order matters:
 *   GestureHandlerRootView — must be the outermost native view, or the bottom
 *     sheet and every Pressable gesture silently stop responding.
 *   SafeAreaProvider — SDS components call useSafeAreaInsets(); without this
 *     they read zeroes and render under the notch.
 *   SDSProvider — supplies the theme seed that every accent-coloured component
 *     derives from. No `token` prop is passed, so it uses colorSeeds.primary
 *     (PINDOM brand purple). Passing one here would re-theme the whole app.
 */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SDSProvider colorPreference="dark">
          {/* `style` names the status bar *content*, not the background: on the `2b`
              ground the glyphs have to be light. Verified on device — under "dark"
              the clock and battery were near-invisible. */}
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onboarding" />
          </Stack>
        </SDSProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
