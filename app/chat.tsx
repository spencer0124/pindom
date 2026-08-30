import { router } from 'expo-router';
import { DotsThreeIcon, XIcon } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Button,
  colorSeeds,
  IconButton,
  SdsColors,
  toFontWeightStyle,
  Txt,
  useAdaptive,
  useTheme,
  useTypographyTheme,
} from '@/design-system';
import { AnswerMap, ThinkingRow, useAssistant } from '@/features/assistant';
import { Shape } from '@/features/shared';
import { wordmark } from '@/features/shared/shape';

/** 1a's header glyphs: 19px strokes in a 28px box. */
const HEADER_GLYPH = 19;
/** 1a's thread: `padding:20px 20px 6px; gap:12px`; the hero's chips start 26px under the headline. */
const THREAD_TOP = 20;
const THREAD_BOTTOM = 6;
const THREAD_GAP = 12;
const QUESTIONS_TOP = 26;
/** Each question is a full-width row, `padding:14px 0`. */
const QUESTION_PAD_Y = 14;
/** The ⋯ sheet's rows: `padding:15px 14px`; 취소 sits 6px under them. */
const MENU_ROW_PAD_Y = 15;
const MENU_ROW_PAD_X = 14;
const CANCEL_TOP = 6;
/** Rows dim to this while pressed — the app-wide mapping of 1a's hover (fidelity decision 28). */
const PRESSED_OPACITY = 0.6;

/** `fadeUp .26s cubic-bezier(.2,.9,.3,1)` on the ⋯ sheet: 14px up from below. */
const sheetRise = FadeInDown.duration(260)
  .easing(Easing.bezier(0.2, 0.9, 0.3, 1))
  .withInitialValues({ opacity: 0, transform: [{ translateY: 14 }] });

/**
 * Pindom AI — ask, read the answer, open the route it drew.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. The route screens.md
 * proposed; there is no Figma frame.
 *
 * This screen submits a message through the repository and renders the
 * reply. It holds no key, builds no prompt and names no provider — the
 * prototype's own model call is scaffolding, not design
 * (docs/reference/external-apis.md). The four questions are 1a's, phrased
 * for the selected 최애 and their nearest 촬영지, listed at the foot of the
 * empty thread directly above the composer; the 지도에서 코스 보기 card appears
 * when an answer carried a course and stays while the next one loads.
 *
 * 1a's header is a close glyph and the ⋯ menu with no title (fidelity
 * decision 21). Its pink aurora behind the empty state is ornament and is not
 * drawn (decision 18); its inert mic button is not drawn either (decision 19).
 */
export default function ChatScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { typography } = useTypographyTheme();
  const { messages, courseId, course, loading, chips, ask, clear } = useAssistant();
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const list = useRef<ScrollView>(null);

  useEffect(() => {
    list.current?.scrollToEnd({ animated: true });
  }, [messages.length, loading]);

  const canSend = draft.trim().length > 0 && !loading;
  const send = () => {
    if (!canSend) return;
    const text = draft;
    setDraft('');
    void ask(text);
  };

  const menu = [
    {
      label: '초기화',
      desc: '지금 대화를 지우고 처음부터',
      color: adaptive.grey900,
      act: () => {
        clear();
        setMenuOpen(false);
      },
    },
    {
      label: '답변 언어 바꾸기',
      desc: '현재 한국어',
      color: adaptive.grey900,
      act: () => {
        setMenuOpen(false);
        router.push('/language' as never);
      },
    },
    // 답변 신고하기 is the backend's flow (external-apis.md); 1a's row closes
    // the menu and so does this one, until it exists. It wears the alert
    // colour, as 1a's does (fidelity A-05).
    { label: '답변 신고하기', desc: '틀린 정보나 부적절한 답변', color: colorSeeds.warning, act: () => setMenuOpen(false) },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <IconButton
          icon={<XIcon size={HEADER_GLYPH} color={adaptive.grey900} />}
          iconSize={HEADER_GLYPH}
          label="닫기"
          onPress={() => router.back()}
        />
        <IconButton
          icon={<DotsThreeIcon size={HEADER_GLYPH} weight="bold" color={adaptive.grey900} />}
          iconSize={HEADER_GLYPH}
          label="메뉴"
          onPress={() => setMenuOpen(true)}
        />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView
          ref={list}
          contentContainerStyle={[styles.thread, messages.length === 0 && styles.threadEmpty]}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={styles.hero}>
              <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor} style={wordmark}>
                PINDOM AI
              </Txt>
              <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>
                무엇을 도와드릴까요?
              </Txt>
              <View style={styles.questions}>
                {chips.map((chip) => (
                  <Pressable
                    key={chip.label}
                    onPress={() => void ask(chip.question)}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.question, { opacity: pressed ? PRESSED_OPACITY : 1 }]}
                  >
                    <Txt typography="st10" fontWeight="medium" color={adaptive.grey900}>
                      {chip.label}
                    </Txt>
                  </Pressable>
                ))}
              </View>
            </View>
          )}

          {messages.map((message, index) => {
            const mine = message.role === 'user';
            return (
              <View key={index} style={[styles.bubbleRow, mine && styles.bubbleRowMine]}>
                <View
                  style={[
                    styles.bubble,
                    mine
                      ? { backgroundColor: token.accent.fillColor }
                      : { backgroundColor: adaptive.background, borderColor: adaptive.grey200, borderWidth: 1 },
                  ]}
                >
                  <Txt typography="t6" color={mine ? token.accent.onFillColor : adaptive.grey900}>
                    {message.text}
                  </Txt>
                </View>
                {/* An answer that named places draws them, under the words that
                    describe them — full width, because a map in a bubble is a
                    postage stamp. */}
                {message.map != null && <AnswerMap map={message.map} />}
              </View>
            );
          })}

          {courseId != null && (
            <Pressable
              onPress={() => router.push({ pathname: '/course', params: { courseId } } as never)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.courseCard,
                {
                  borderColor: token.accent.fillColor,
                  backgroundColor: token.accent.dimColor,
                  opacity: pressed ? PRESSED_OPACITY : 1,
                },
              ]}
            >
              <View style={styles.courseCopy}>
                <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
                  지도에서 코스 보기
                </Txt>
                {course != null && (
                  <Txt typography="st13" color={adaptive.grey600}>
                    {course.placeCount}곳 · {course.name}
                  </Txt>
                )}
              </View>
              <Txt typography="t6" color={token.accent.fillColor}>
                ›
              </Txt>
            </Pressable>
          )}

          {loading && <ThinkingRow />}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: adaptive.grey200, backgroundColor: adaptive.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            returnKeyType="send"
            submitBehavior="submit"
            onSubmitEditing={send}
            placeholder="메시지를 입력해주세요"
            placeholderTextColor={adaptive.grey400}
            style={[styles.input, typography.t6, toFontWeightStyle('regular'), { color: adaptive.grey900 }]}
          />
          <Button size="medium" disabled={!canSend} onPress={send}>
            보내기
          </Button>
        </View>
      </KeyboardAvoidingView>

      {menuOpen && (
        <View style={[styles.overlay, { backgroundColor: SdsColors.greyOpacity800 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} accessibilityLabel="닫기" />
          <Animated.View
            entering={sheetRise}
            style={[styles.sheet, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}
          >
            {menu.map((item) => (
              <Pressable
                key={item.label}
                onPress={item.act}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.menuRow,
                  { borderBottomColor: adaptive.grey200, opacity: pressed ? PRESSED_OPACITY : 1 },
                ]}
              >
                <Txt typography="t6" fontWeight="bold" color={item.color}>
                  {item.label}
                </Txt>
                <Txt typography="st13" color={adaptive.grey600}>
                  {item.desc}
                </Txt>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setMenuOpen(false)}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.menuCancel,
                { backgroundColor: adaptive.greyBackground, opacity: pressed ? PRESSED_OPACITY : 1 },
              ]}
            >
              <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
                취소
              </Txt>
            </Pressable>
          </Animated.View>
        </View>
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
    paddingVertical: 8,
  },
  body: {
    flex: 1,
  },
  thread: {
    paddingHorizontal: Shape.gutter,
    paddingTop: THREAD_TOP,
    paddingBottom: THREAD_BOTTOM,
    gap: THREAD_GAP,
  },
  // 1a's `justify-content: flex-end` while the thread is empty: the hero sits
  // at the foot, directly above the composer.
  threadEmpty: {
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  hero: {
    gap: 10,
  },
  questions: {
    marginTop: QUESTIONS_TOP,
  },
  question: {
    paddingVertical: QUESTION_PAD_Y,
    alignItems: 'flex-start',
  },
  // A column, not a row: an answer can carry a map under its bubble, and the
  // two stack. `alignItems` is what still pushes the user's bubble right.
  bubbleRow: {
    alignItems: 'flex-start',
    gap: 8,
  },
  bubbleRowMine: {
    alignItems: 'flex-end',
  },
  bubble: {
    maxWidth: '84%',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  courseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  courseCopy: {
    flex: 1,
    gap: 3,
  },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    borderTopWidth: Shape.sectionRule,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 10,
  },
  input: {
    flex: 1,
    maxHeight: 120,
    minHeight: 40,
    paddingVertical: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: Shape.sectionRule,
    paddingHorizontal: Shape.gutter,
    paddingBottom: 24,
  },
  menuRow: {
    paddingHorizontal: MENU_ROW_PAD_X,
    paddingVertical: MENU_ROW_PAD_Y,
    gap: 2,
    borderBottomWidth: Shape.rowRule,
  },
  menuCancel: {
    marginTop: CANCEL_TOP,
    paddingVertical: MENU_ROW_PAD_Y,
    alignItems: 'center',
  },
});
