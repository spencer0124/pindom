import { Redirect, Tabs } from 'expo-router';
import {
  ChatCircleIcon,
  HouseIcon,
  TicketIcon,
  UserIcon,
} from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';
import { Loader, useAdaptive, useTheme, useTypographyTheme } from '@/design-system';
import { PindomMark } from '@/features/shared';
import { AssistantFab } from '@/features/assistant';
import { useSession } from '@/features/auth';

/** Five stable destinations; the active icon carries rose color and a filled shape. */
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
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        // 1a's label is 10px; the nearest step on the typography map.
        tabBarLabelStyle: { fontSize: typography.st12.fontSize, fontWeight: '600', marginBottom: 4 },
        tabBarItemStyle: { paddingTop: 6 },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: '지도',
          tabBarIcon: ({ color, size, focused }) => (
            <PindomMark color={color} size={size + 2} filled={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ color, size, focused }) => (
            <ChatCircleIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size, focused }) => (
            <HouseIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: '티켓',
          tabBarIcon: ({ color, size, focused }) => (
            <TicketIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ color, size, focused }) => (
            <UserIcon color={color} size={size} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
    </Tabs>
      {/* The 2026-08-20 drop's floating assistant button, on every tab. */}
      <AssistantFab />
    </View>
  );
}
