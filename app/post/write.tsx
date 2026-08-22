import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Txt, useAdaptive, useTheme } from '@/design-system';
import { useWritePost } from '@/features/community';
import { Shape } from '@/features/shared';

/**
 * 글쓰기 — a post, with or without a pin.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1686` is the
 * earlier frame.
 *
 * The board comes from 커뮤니티 as a route param; a post always belongs to one.
 * The pin is 1a's: tap to attach the most recently verified 촬영지, which is the
 * newest ticket, and the post carries its `placeId` and `ticketId`. The
 * composer is a raw TextInput for the reason 촬영 팁's is — `TextField` still
 * reads light-mode ink.
 */
export default function WritePostScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { latest, state, submit } = useWritePost(boardId ?? null);

  const [draft, setDraft] = useState('');
  const [attachPin, setAttachPin] = useState(false);

  const busy = state.status === 'busy';
  const canSubmit = draft.trim().length > 0 && !busy;
  const canPin = latest != null;

  const post = async () => {
    if (!canSubmit) return;
    const ok = await submit(draft, attachPin && canPin);
    if (ok) router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerSide}>
            <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
              취소
            </Txt>
          </Pressable>
          <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
            글쓰기
          </Txt>
          <Pressable
            onPress={() => void post()}
            disabled={!canSubmit}
            accessibilityRole="button"
            style={[styles.headerSide, styles.headerRight]}
          >
            <Txt
              typography="t7"
              fontWeight="bold"
              color={canSubmit ? token.accent.fillColor : adaptive.grey400}
            >
              등록
            </Txt>
          </Pressable>
        </View>

        <TextInput
          value={draft}
          onChangeText={setDraft}
          multiline
          autoFocus
          placeholder="어디 다녀왔는지 자랑해도 됨"
          placeholderTextColor={adaptive.grey400}
          style={[styles.input, { color: adaptive.grey900, borderColor: adaptive.grey200 }]}
        />

        <Pressable
          onPress={() => canPin && setAttachPin((on) => !on)}
          disabled={!canPin}
          accessibilityRole="switch"
          accessibilityState={{ checked: attachPin, disabled: !canPin }}
          style={[
            styles.pin,
            attachPin
              ? { borderColor: token.accent.fillColor, backgroundColor: token.accent.dimColor }
              : { borderColor: adaptive.grey200 },
          ]}
        >
          <Txt typography="t5" fontWeight="bold" color={attachPin ? token.accent.fillColor : adaptive.grey400}>
            ⌖
          </Txt>
          <View style={styles.pinCopy}>
            <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
              {attachPin && latest != null ? `핀 첨부됨 · ${latest.placeName}` : '핀 첨부 안 함'}
            </Txt>
            <Txt typography="st13" color={adaptive.grey600}>
              {!canPin
                ? '인증한 촬영지가 아직 없어요'
                : attachPin
                  ? '탭하면 첨부를 해제합니다'
                  : '탭하면 최근 인증한 촬영지를 첨부합니다'}
            </Txt>
          </View>
        </Pressable>

        {state.status === 'error' && (
          <Txt typography="st13" color={adaptive.grey600}>
            {state.message}
          </Txt>
        )}

        <View style={[styles.note, { borderTopColor: adaptive.grey200 }]}>
          <Txt typography="st13" color={adaptive.grey600}>
            핀을 첨부하면 다른 팬들이 지도에서 바로 그 촬영지로 이동할 수 있습니다.
          </Txt>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: Shape.gutter,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  headerSide: {
    width: 48,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  input: {
    height: 150,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  pinCopy: {
    flex: 1,
    gap: 3,
  },
  note: {
    marginTop: 'auto',
    borderTopWidth: Shape.rowRule,
    paddingTop: 12,
    paddingBottom: 8,
  },
});
