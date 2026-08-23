import { Redirect, Tabs } from 'expo-router';
import {
  ChatCircleIcon,
  HouseIcon,
  MapPinIcon,
  TicketIcon,
  UserIcon,
} from 'phosphor-react-native';
import { View } from 'react-native';
import { Loader, useAdaptive, useTheme, useTypographyTheme } from '@/design-system';
import { AssistantFab } from '@/features/assistant';
import { useSession } from '@/features/auth';

/**
 * Five-tab bar, ordered as the 홈 design shows it:
 *   지도 · 커뮤니티 · 홈 · 티켓 · 마이
 *
 * 홈 sits in the middle visually but is the initial route, which is why it is
 * declared first here — expo-router orders tabs by declaration, so `order` is
 * controlled by file/screen order and the middle position comes from putting
 * index third in the list below.
 *
 * Every icon is an outline; the active one is the accent *and* a heavier
 * stroke, which is how 1a marks it (`strokeWidth` 2.2 against 1.8). No tab is
 * filled permanently — the first build filled 홈, which made it look active
 * on every other tab.
 */
export default function TabsLayout() {
  const { token } = useTheme();
  const { typography } = useTypographyTheme();
  // Same keys as before, resolved against the root layout's `colorPreference`
  // instead of pinned to the light values — a white bar under the dark screens
  // is what reading `SdsColors` directly produced.
  const adaptive = useAdaptive();
  const { state } = useSession();

  // No session, no tabs: the flow starts at 온보딩, and every tabbed screen
  // assumes a signed-in user. The fixture path signs one in by default.
  if (state.status === 'loading') {
    return <Loader.Centered label="" />;
  }
  if (state.session == null) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <View style={{ flex: 1 }}>
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: token.accent.fillColor,
        tabBarInactiveTintColor: adaptive.grey500,
        tabBarStyle: {
          backgroundColor: adaptive.background,
          borderTopColor: adaptive.grey200,
        },
        // 1a's label is 10px; the nearest step on the typography map.
        tabBarLabelStyle: { fontSize: typography.st13.fontSize },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: '지도',
          tabBarIcon: ({ color, size, focused }) => (
            <MapPinIcon color={color} size={size} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ color, size, focused }) => (
            <ChatCircleIcon color={color} size={size} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <HouseIcon color={color} size={size} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: '티켓',
          tabBarIcon: ({ color, size, focused }) => (
            <TicketIcon color={color} size={size} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ color, size, focused }) => (
            <UserIcon color={color} size={size} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
    </Tabs>
      {/* The 2026-08-20 drop's floating assistant button, on every tab. */}
      <AssistantFab />
    </View>
  );
}
