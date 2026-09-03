import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Checkbox, Txt, useAdaptive, useTheme } from '@/design-system';
import { useSignIn, type AuthMode } from '@/features/auth';
import { Shape } from '@/features/shared';
import { wordmark } from '@/features/shared/shape';

/**
 * 1a scatters the first 최애's six map pins over the top of the landing — the
 * same points 지도 draws for 강릉 · 서울 · 전주 · 여수 · 부산 · 제주, so the scatter
 * is a Korea silhouette. Fractions of the pin band, not of the screen.
 */
const PINS = [
  { x: 0.604, y: 0.142 },
  { x: 0.385, y: 0.191 },
  { x: 0.405, y: 0.451 },
  { x: 0.474, y: 0.607 },
  { x: 0.625, y: 0.553 },
  { x: 0.38, y: 0.784 },
];

/**
 * 온보딩 — the landing, with 시작화면 folded in.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. Figma `33:2801` is the
 * earlier 시작화면; docs/reference/screens.md says this screen absorbs it and
 * its email sign-in, and `app/login.tsx` goes with it.
 *
 * 1a's two buttons both go home. Here 시작하기 opens the form in sign-up mode
 * and 이메일로 로그인 in sign-in mode, and both land on 최애 찾기 when the account
 * follows nobody yet — the flowchart's 온보딩 → 최애 찾기 → 홈 — or on 홈 when it
 * does. The form is a raw TextInput set for the reason 촬영 팁's composer is:
 * `TextField` still reads light-mode ink.
 */
export default function OnboardingScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { state, submit } = useSignIn();

  const [mode, setMode] = useState<AuthMode | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  // 가입에만 건다. 1.2 가 요구하는 것은 계정을 만드는 시점의 동의이고,
  // 로그인하는 사람은 그 계정을 만들 때 이미 동의한 사람이다.
  const [agreed, setAgreed] = useState(false);

  const busy = state.status === 'busy';
  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    (mode === 'signIn' || (nickname.trim().length > 0 && agreed));

  const go = async () => {
    if (mode == null) return;
    const destination = await submit(mode, email, password, nickname);
    if (destination === 'home') router.replace('/' as never);
    if (destination === 'artist') router.replace('/artist/search' as never);
  };

  return (
    <SafeAreaView edges={['bottom']} style={[styles.safe, { backgroundColor: adaptive.background }]}>
      {/* The band is measured from the top of the screen, status bar included, as 1a's is. */}
      <View style={styles.pins} pointerEvents="none">
        {PINS.map((pin, index) => (
          <View
            key={index}
            style={[
              styles.pin,
              { left: `${pin.x * 100}%`, top: `${pin.y * 100}%`, backgroundColor: token.accent.fillColor },
            ]}
          />
        ))}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.body}
      >
        <View style={styles.copy}>
          <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor} style={wordmark}>
            PINDOM
          </Txt>
          <Txt typography="t1" fontWeight="bold" color={adaptive.grey900}>
            최애와 함께한{'\n'}그 순간을 pin
          </Txt>
          <Txt typography="t6" color={adaptive.grey600}>
            서울을 벗어나 마주하는 최애의 진짜 촬영지
          </Txt>
        </View>

        {mode != null && (
          <View style={[styles.form, { borderTopColor: adaptive.grey200 }]}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="이메일"
              placeholderTextColor={adaptive.grey400}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={[styles.input, { color: adaptive.grey900, borderBottomColor: adaptive.grey200 }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="비밀번호"
              placeholderTextColor={adaptive.grey400}
              secureTextEntry
              autoComplete={mode === 'signIn' ? 'password' : 'new-password'}
              style={[styles.input, { color: adaptive.grey900, borderBottomColor: adaptive.grey200 }]}
            />
            {mode === 'signUp' && (
              <TextInput
                value={nickname}
                onChangeText={setNickname}
                placeholder="닉네임"
                placeholderTextColor={adaptive.grey400}
                maxLength={12}
                // A name is not a word, and it is stored as typed — rules compare
                // `authorNickname` against this exact string. 프로필 편집 already
                // carries both; this field was the half that was missed.
                autoCorrect={false}
                autoCapitalize="none"
                style={[styles.input, { color: adaptive.grey900, borderBottomColor: adaptive.grey200 }]}
              />
            )}
            {mode === 'signUp' && (
              <View style={styles.agree}>
                <Checkbox.Line checked={agreed} onCheckedChange={setAgreed} style={styles.agreeLine}>
                  <Txt typography="st13" color={adaptive.grey700}>
                    이용약관에 동의합니다
                  </Txt>
                </Checkbox.Line>
                <Pressable
                  onPress={() => router.push('/terms' as never)}
                  accessibilityRole="button"
                  hitSlop={8}
                >
                  <Txt typography="st13" fontWeight="medium" color={token.accent.fillColor}>
                    약관 보기
                  </Txt>
                </Pressable>
              </View>
            )}
            {state.status === 'error' && (
              <Txt typography="st13" color={adaptive.grey600}>
                {state.message}
              </Txt>
            )}
          </View>
        )}

        <View style={styles.actions}>
          <Button
            size="large"
            type="primary"
            display="block"
            loading={busy && mode === 'signUp'}
            disabled={mode === 'signUp' ? !canSubmit : busy}
            onPress={() => (mode === 'signUp' ? void go() : setMode('signUp'))}
          >
            시작하기 · Start collecting
          </Button>
          <Button
            size="large"
            style="outline"
            display="block"
            loading={busy && mode === 'signIn'}
            disabled={mode === 'signIn' ? !canSubmit : busy}
            onPress={() => (mode === 'signIn' ? void go() : setMode('signIn'))}
          >
            이메일로 로그인
          </Button>
          <Txt typography="st13" color={adaptive.grey500} textAlign="center" style={styles.note}>
            위치 권한과 카메라 권한이 필요합니다
          </Txt>
          {/* 1.2 asks that the terms be presented before registering *or* logging
              in, so this row is outside the sign-up branch: someone who only ever
              taps 이메일로 로그인 still has the agreement in front of them. */}
          <Pressable
            onPress={() => router.push('/terms' as never)}
            accessibilityRole="button"
            hitSlop={8}
          >
            <Txt typography="st13" color={adaptive.grey500} textAlign="center">
              계속하면 <Txt typography="st13" fontWeight="medium" color={adaptive.grey700}>이용약관</Txt>에 동의하는 것으로 봅니다
            </Txt>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  pins: {
    position: 'absolute',
    top: 96,
    left: 0,
    right: 0,
    height: 300,
    opacity: 0.9,
  },
  pin: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  body: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
    paddingBottom: 16,
    gap: 18,
  },
  copy: {
    gap: 18,
  },
  form: {
    borderTopWidth: Shape.rowRule,
    paddingTop: 6,
    gap: 4,
  },
  input: {
    height: 48,
    fontSize: 16,
    borderBottomWidth: Shape.rowRule,
  },
  actions: {
    gap: 10,
    marginTop: 14,
  },
  note: {
    marginTop: 6,
  },
  agree: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  // Checkbox.Line 의 라벨이 flex:1 이라 스타일 없이 두면 줄 전체를 채워
  // 약관 보기가 화면 밖으로 밀린다 — 남는 폭만 차지하게 묶는다.
  agreeLine: {
    flex: 1,
    marginRight: 12,
  },
});
