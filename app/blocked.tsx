import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SdsColors, Txt, useAdaptive } from '@/design-system';
import { useModeration } from '@/features/moderation';
import { Rule, Shape } from '@/features/shared';

/** What a row says when the block predates this device, or came from a 갤러리 photo. */
const UNKNOWN_AUTHOR = '알 수 없는 사용자';

/**
 * 차단한 사용자 — the list, and the way back out of it.
 *
 * Exists because the 차단 sheet promises it: "마이페이지의 차단한 사용자에서
 * 언제든 해제할 수 있어요". A block with no visible undo is a setting the user
 * cannot inspect, and App Store guideline 1.2 asks for a blocking mechanism
 * rather than a one-way door.
 *
 * **The nicknames are remembered, not fetched.** The backend contract closes
 * `users` reads to everyone but the document's owner, so there is no query that
 * turns a blocked uid into a name — the app keeps the name that was on the
 * content at the moment of blocking. A row whose name is missing (blocked from
 * a 갤러리 photo, which carries no nickname; or blocked on another device) says
 * so rather than printing a raw uid, which would be both ugly and a small
 * identifier leak into a screenshot.
 */
export default function BlockedUsersScreen() {
  const adaptive = useAdaptive();
  const { blockedUserIds, blockedNames, unblock } = useModeration();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const release = async (userId: string) => {
    setBusyId(userId);
    setError(null);
    const message = await unblock(userId);
    setBusyId(null);
    if (message != null) setError(message);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          style={styles.headerSide}
        >
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            ‹ 마이
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          차단한 사용자
        </Txt>
        <View style={styles.headerSide} />
      </View>

      <Txt typography="st13" color={adaptive.grey600} style={styles.note}>
        차단한 사용자의 게시글·촬영 팁·사진은 앱에서 보이지 않습니다. 차단을 해제하면 다시
        보입니다.
      </Txt>

      {error != null && (
        <Txt typography="st13" color={SdsColors.alert500} style={styles.note}>
          {error}
        </Txt>
      )}

      <Rule />

      {blockedUserIds.length === 0 ? (
        <Txt typography="t6" color={adaptive.grey600} style={styles.empty}>
          차단한 사용자가 없어요.
        </Txt>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {blockedUserIds.map((userId) => (
            <View
              key={userId}
              style={[styles.row, { borderBottomColor: adaptive.grey200 }]}
            >
              <Txt
                typography="t6"
                fontWeight="medium"
                color={adaptive.grey900}
                style={styles.name}
                numberOfLines={1}
              >
                {blockedNames[userId] ?? UNKNOWN_AUTHOR}
              </Txt>
              <Button
                size="tiny"
                style="weak"
                loading={busyId === userId}
                disabled={busyId != null && busyId !== userId}
                onPress={() => void release(userId)}
              >
                차단 해제
              </Button>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  headerSide: {
    width: 48,
  },
  note: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 8,
    paddingBottom: 16,
  },
  list: {
    paddingBottom: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
    borderBottomWidth: Shape.rowRule,
  },
  name: {
    flex: 1,
  },
  empty: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 40,
  },
});
