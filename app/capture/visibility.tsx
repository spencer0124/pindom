import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Switch, Txt, useAdaptive } from '@/design-system';
import { useCaptureStore, useIssueTicket } from '@/features/capture';
import { Rule, Shape } from '@/features/shared';

/**
 * 공개설정 — public or private, then mint.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:2120` is the
 * earlier frame.
 *
 * Two things 1a draws are not here, both recorded in the Capture checklist:
 * the caption field (이 컷에 대한 한 줄) has no field in the contract to land
 * in, and the serial in 발행될 티켓 is minted by the server, so it cannot be
 * printed before the button is pressed. The thumbnail is the composed print
 * — exactly what the ticket will carry. The blocks keep 1a's order even with
 * the caption gone: thumb, toggle, 발행될 티켓, then the CTA (fidelity
 * decision 3).
 */
export default function VisibilityScreen() {
  const adaptive = useAdaptive();

  const place = useCaptureStore((s) => s.place);
  const composedUri = useCaptureStore((s) => s.composedUri);
  const visibility = useCaptureStore((s) => s.visibility);
  const setVisibility = useCaptureStore((s) => s.setVisibility);
  const { state, issue } = useIssueTicket();

  useEffect(() => {
    if (composedUri == null || place == null) router.replace('/map' as never);
  }, [composedUri, place]);

  const onIssue = useCallback(async () => {
    const ticket = await issue();
    if (ticket != null) {
      router.replace({ pathname: '/capture/issued', params: { ticketId: ticket.id } } as never);
    }
  }, [issue]);

  if (place == null || composedUri == null) return null;

  const isPublic = visibility === 'public';
  const busy = state.status === 'uploading' || state.status === 'issuing';

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            ‹ 편집
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          공개 설정
        </Txt>
        <View style={styles.headerSide} />
      </View>

      <View style={styles.preview}>
        <View style={[styles.thumb, { backgroundColor: adaptive.background }]}>
          <Image source={{ uri: composedUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
      </View>

      <Rule />

      <Pressable
        onPress={() => setVisibility(isPublic ? 'private' : 'public')}
        accessibilityRole="switch"
        accessibilityState={{ checked: isPublic }}
        style={styles.toggle}
      >
        <View style={styles.toggleCopy}>
          <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
            {isPublic ? '공개로 게시' : '비공개 저장만'}
          </Txt>
          <Txt typography="t7" color={adaptive.grey600}>
            {isPublic
              ? '장소 갤러리와 커뮤니티 피드에 노출됩니다'
              : '나만 보관합니다 — 티켓은 그대로 발행돼요'}
          </Txt>
        </View>
        <Switch checked={isPublic} onCheckedChange={(on) => setVisibility(on ? 'public' : 'private')} />
      </Pressable>

      <Rule />

      <View style={styles.issueNote}>
        <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
          발행될 티켓
        </Txt>
        <Txt typography="t7" color={adaptive.grey600}>
          {place.name} · 공개 여부와 무관하게 티켓은 발행되고, 지도의 핀이 유색으로 바뀝니다.
        </Txt>
      </View>

      <View style={styles.footer}>
        {state.status === 'error' && (
          <Txt typography="t7" color={adaptive.grey600} textAlign="center">
            {state.message}
          </Txt>
        )}
        <Button size="large" type="primary" display="block" loading={busy} onPress={onIssue}>
          티켓 발행하기
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
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
    width: 64,
  },
  preview: {
    paddingHorizontal: Shape.gutter,
    paddingVertical: 18,
  },
  thumb: {
    width: 92,
    height: 118,
    overflow: 'hidden',
  },
  issueNote: {
    gap: 8,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 16,
  },
  toggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: Shape.gutter,
    paddingVertical: 16,
  },
  toggleCopy: {
    flex: 1,
    gap: 3,
  },
  footer: {
    marginTop: 'auto',
    paddingHorizontal: Shape.gutter,
    paddingBottom: 8,
    gap: 10,
  },
});
