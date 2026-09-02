import { router, useLocalSearchParams } from 'expo-router';
import { MapPinIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { toFontWeightStyle, Txt, useAdaptive, useTheme, useTypographyTheme } from '@/design-system';
import { useWritePost } from '@/features/community';
import { Shape } from '@/features/shared';
import type { Ticket } from '@/lib/domain';

/** 1a's 18px map-pin outline; its colour is the on/off signal. */
const PIN_ICON = 18;
/** Rows dim while pressed; the prototype's hover has no touch equivalent. */
const PRESSED_OPACITY = 0.6;

/**
 * 글쓰기 — a post, with or without a pin.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:1686` is the
 * earlier frame.
 *
 * The board comes from 커뮤니티 as a route param; a post always belongs to one.
 * The pin is 1a's: the screen opens with the 촬영지 of the newest **public**
 * ticket already attached, a list below lets the user pick another, and a tap
 * on the pin row detaches it; the post carries the picked ticket's `placeId`
 * and `ticketId` unless the user tapped it off. 보관함 tickets are
 * not offered — see `useWritePost` — so the copy names the public list rather
 * than saying 인증한, which would be a promise this screen does not keep. The
 * toggle waits for the ticket read so its first frame is the attached state,
 * never a "no ticket" line that the next frame contradicts. The composer is a
 * raw TextInput for the reason 촬영 팁's is — `TextField` still reads
 * light-mode ink.
 */
export default function WritePostScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();
  const { boardId } = useLocalSearchParams<{ boardId: string }>();
  const { tickets, state, submit } = useWritePost(boardId ?? null);

  const [draft, setDraft] = useState('');
  // 1a opens with `attachPin: true`; the effective state also needs a ticket.
  const [attachPin, setAttachPin] = useState(true);
  // undefined means "not chosen yet" — the newest public ticket stands in.
  const [picked, setPicked] = useState<Ticket | null | undefined>(undefined);

  const busy = state.status === 'busy';
  const canSubmit = draft.trim().length > 0 && !busy;
  const canPin = (tickets?.length ?? 0) > 0;
  // The ticket the post will carry — null when there is none or it was tapped off.
  const pinned = attachPin ? (picked === undefined ? (tickets?.[0] ?? null) : picked) : null;
  const on = pinned != null;

  const post = async () => {
    if (!canSubmit) return;
    const ok = await submit(draft, pinned);
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
          allowFontScaling={false}
          placeholder="어디 다녀왔는지 자랑해도 됨"
          placeholderTextColor={adaptive.grey400}
          style={[
            styles.input,
            typography.t6,
            toFontWeightStyle('regular'),
            { color: adaptive.grey900, borderColor: adaptive.grey200 },
          ]}
        />

        {tickets !== undefined && (
          <Pressable
            onPress={() => canPin && setAttachPin((value) => !value)}
            disabled={!canPin}
            accessibilityRole="switch"
            accessibilityState={{ checked: on, disabled: !canPin }}
            style={({ pressed }) => [
              styles.pin,
              on
                ? { borderColor: token.accent.fillColor, backgroundColor: token.accent.dimColor }
                : { borderColor: adaptive.grey200 },
              pressed && styles.pressed,
            ]}
          >
            <MapPinIcon
              size={PIN_ICON}
              color={on ? token.accent.fillColor : adaptive.grey400}
              weight="regular"
            />
            <View style={styles.pinCopy}>
              <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
                {pinned != null ? `핀 첨부됨 · ${pinned.placeName}` : '핀 첨부 안 함'}
              </Txt>
              <Txt typography="st13" color={adaptive.grey600}>
                {!canPin
                  ? '공개한 티켓이 아직 없어요'
                  : on
                    ? '탭하면 첨부를 해제합니다'
                    : '탭하면 최근 공개 티켓의 촬영지를 첨부합니다'}
              </Txt>
            </View>
          </Pressable>
        )}

        {on && (tickets?.length ?? 0) > 1 && (
          <View style={styles.picker}>
            {tickets?.map((ticket) => (
              <Pressable
                key={ticket.id}
                onPress={() => {
                  setAttachPin(true);
                  setPicked(ticket);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: ticket.id === pinned?.id }}
                style={({ pressed }) => [styles.pickerRow, pressed && styles.pressed]}
              >
                <Txt
                  typography="t7"
                  fontWeight={ticket.id === pinned?.id ? 'bold' : 'regular'}
                  color={ticket.id === pinned?.id ? token.accent.fillColor : adaptive.grey900}
                >
                  {ticket.placeName}
                </Txt>
                <Txt typography="st13" color={adaptive.grey600}>
                  {formatShort(ticket.issuedAt)}
                </Txt>
              </Pressable>
            ))}
          </View>
        )}

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

function formatShort(date: Date): string {
  return `${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
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
  // Type comes from the typography map at render (`t6`, the small body).
  input: {
    height: 150,
    borderWidth: 1,
    padding: 14,
    textAlignVertical: 'top',
    includeFontPadding: false,
  },
  pin: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  picker: {
    gap: 2,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: Shape.gutter,
  },
  pinCopy: {
    flex: 1,
    gap: 3,
  },
  pressed: {
    opacity: PRESSED_OPACITY,
  },
  note: {
    marginTop: 'auto',
    borderTopWidth: Shape.rowRule,
    paddingTop: 12,
    paddingBottom: 8,
  },
});
