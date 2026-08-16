import { Tabs } from 'expo-router';
import {
  ChatCircleIcon,
  HouseIcon,
  MapPinIcon,
  TicketIcon,
  UserIcon,
} from 'phosphor-react-native';
import { SdsColors, useTheme } from '@/design-system';

/**
 * Five-tab bar, ordered as the 홈 design shows it:
 *   지도 · 커뮤니티 · 홈 · 티켓 · 마이
 *
 * 홈 sits in the middle visually but is the initial route, which is why it is
 * declared first here — expo-router orders tabs by declaration, so `order` is
 * controlled by file/screen order and the middle position comes from putting
 * index third in the list below.
 */
export default function TabsLayout() {
  const { token } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: token.accent.fillColor,
        tabBarInactiveTintColor: SdsColors.grey500,
        tabBarStyle: {
          backgroundColor: SdsColors.background,
          borderTopColor: SdsColors.grey200,
        },
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: '지도',
          tabBarIcon: ({ color, size }) => <MapPinIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="community"
        options={{
          title: '커뮤니티',
          tabBarIcon: ({ color, size }) => <ChatCircleIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: '홈',
          tabBarIcon: ({ color, size }) => <HouseIcon color={color} size={size} weight="fill" />,
        }}
      />
      <Tabs.Screen
        name="tickets"
        options={{
          title: '티켓',
          tabBarIcon: ({ color, size }) => <TicketIcon color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="my"
        options={{
          title: '마이',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
