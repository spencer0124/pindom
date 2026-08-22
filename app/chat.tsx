import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, SdsColors, Txt, useAdaptive, useTheme } from '@/design-system';
import { useAssistant } from '@/features/assistant';
import { Shape } from '@/features/shared';

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
 * (docs/reference/external-apis.md). The four chips are 1a's questions,
 * phrased for the selected 최애 and their nearest 촬영지; the 지도에서 코스 보기
 * card appears when an answer carried a course.
 */
export default function ChatScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { artist, messages, courseId, loading, chips, ask, clear } = useAssistant();
  const [draft, setDraft] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const list = useRef<ScrollView>(null);

  useEffect(() => {
    list.current?.scrollToEnd({ animated: true });
  }, [messages.length, loading]);

  const send = () => {
    const text = draft;
    setDraft('');
    void ask(text);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="닫기" style={styles.headerSide}>
          <Txt typography="t5" color={adaptive.grey600}>
            ‹
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          Pindom AI
        </Txt>
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="메뉴"
          style={[styles.headerSide, styles.headerRight]}
        >
          <Txt typography="t5" color={adaptive.grey600}>
            ⋯
          </Txt>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView ref={list} contentContainerStyle={styles.thread} keyboardShouldPersistTaps="handled">
          {messages.length === 0 && (
            <View style={styles.empty}>
              <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor} style={styles.wordmark}>
                PINDOM AI
              </Txt>
              <Txt typography="t3" fontWeight="bold" color={adaptive.grey900}>
                무엇을 도와드릴까요?
              </Txt>
              <View style={styles.chips}>
                {chips.map((chip) => (
                  <Pressable
                    key={chip.label}
                    onPress={() => void ask(chip.question)}
                    accessibilityRole="button"
                    style={[styles.chip, { borderColor: adaptive.grey200 }]}
                  >
                    <Txt typography="t7" fontWeight="medium" color={adaptive.grey900}>
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
              </View>
            );
          })}

          {courseId != null && !loading && (
            <Pressable
              onPress={() => router.push({ pathname: '/course', params: { courseId } } as never)}
              accessibilityRole="button"
              style={[styles.courseCard, { borderColor: token.accent.fillColor, backgroundColor: token.accent.dimColor }]}
            >
              <View style={styles.courseCopy}>
                <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
                  지도에서 코스 보기
                </Txt>
                <Txt typography="st13" color={adaptive.grey600}>
                  {artist != null ? `${artist.name} 성지순례 코스` : '성지순례 코스'}
                </Txt>
              </View>
              <Txt typography="t6" color={token.accent.fillColor}>
                ›
              </Txt>
            </Pressable>
          )}

          {loading && (
            <View style={styles.bubbleRow}>
              <View style={[styles.bubble, { backgroundColor: adaptive.background, borderColor: adaptive.grey200, borderWidth: 1 }]}>
                <Txt typography="t7" color={adaptive.grey600}>
                  답변을 찾고 있어요
                </Txt>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.composer, { borderTopColor: adaptive.grey200, backgroundColor: adaptive.background }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            multiline
            placeholder="메시지를 입력해주세요"
            placeholderTextColor={adaptive.grey400}
            style={[styles.input, { color: adaptive.grey900 }]}
          />
          <Button size="medium" disabled={draft.trim().length === 0 || loading} onPress={send}>
            보내기
          </Button>
        </View>
      </KeyboardAvoidingView>

      {menuOpen && (
        <View style={[styles.overlay, { backgroundColor: SdsColors.greyOpacity800 }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <View style={[styles.sheet, { backgroundColor: adaptive.background, borderTopColor: adaptive.grey200 }]}>
            {[
              {
                label: '초기화',
                desc: '지금 대화를 지우고 처음부터',
                act: () => {
                  clear();
                  setMenuOpen(false);
                },
              },
              {
                label: '답변 언어 바꾸기',
                desc: '현재 한국어',
                act: () => {
                  setMenuOpen(false);
                  router.push('/language' as never);
                },
              },
              // 답변 신고하기 is the backend's flow (external-apis.md); 1a's
              // row closes the menu and so does this one, until it exists.
              { label: '답변 신고하기', desc: '틀린 정보나 부적절한 답변', act: () => setMenuOpen(false) },
            ].map((item) => (
              <Pressable
                key={item.label}
                onPress={item.act}
                accessibilityRole="button"
                style={[styles.menuRow, { borderBottomColor: adaptive.grey200 }]}
              >
                <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
                  {item.label}
                </Txt>
                <Txt typography="st13" color={adaptive.grey600}>
                  {item.desc}
                </Txt>
              </Pressable>
            ))}
            <Pressable onPress={() => setMenuOpen(false)} accessibilityRole="button" style={styles.menuCancel}>
              <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
                취소
              </Txt>
            </Pressable>
          </View>
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
  headerSide: {
    width: 40,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  body: {
    flex: 1,
  },
  thread: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 12,
    gap: 10,
  },
  empty: {
    paddingTop: 48,
    paddingBottom: 24,
    gap: 10,
  },
  wordmark: {
    letterSpacing: 3,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  chip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bubbleRow: {
    flexDirection: 'row',
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
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
    fontSize: 15,
    lineHeight: 22,
    paddingVertical: 8,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopWidth: Shape.sectionRule,
    paddingBottom: 24,
  },
  menuRow: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 14,
    gap: 3,
    borderBottomWidth: Shape.rowRule,
  },
  menuCancel: {
    alignSelf: 'center',
    paddingTop: 14,
  },
});
