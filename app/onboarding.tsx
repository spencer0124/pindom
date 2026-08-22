import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Txt, useAdaptive, useTheme } from '@/design-system';
import { useSignIn, type AuthMode } from '@/features/auth';
import { Shape } from '@/features/shared';

/** 1a scatters a handful of glowing pins over the top of the landing. Fractions of the screen. */
const PINS = [
  { x: 0.18, y: 0.14 },
  { x: 0.62, y: 0.09 },
  { x: 0.8, y: 0.22 },
  { x: 0.36, y: 0.27 },
  { x: 0.55, y: 0.34 },
  { x: 0.12, y: 0.38 },
  { x: 0.72, y: 0.42 },
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

  const busy = state.status === 'busy';
  const canSubmit =
    email.trim().length > 0 && password.length > 0 && (mode === 'signIn' || nickname.trim().length > 0);

  const go = async () => {
    if (mode == null) return;
    const destination = await submit(mode, email, password, nickname);
    if (destination === 'home') router.replace('/' as never);
    if (destination === 'artist') router.replace('/artist/search' as never);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.background }]}>
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
          <Txt typography="t7" fontWeight="bold" color={token.accent.fillColor} style={styles.wordmark}>
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
                style={[styles.input, { color: adaptive.grey900, borderBottomColor: adaptive.grey200 }]}
              />
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
            style="weak"
            display="block"
            loading={busy && mode === 'signIn'}
            disabled={mode === 'signIn' ? !canSubmit : busy}
            onPress={() => (mode === 'signIn' ? void go() : setMode('signIn'))}
          >
            이메일로 로그인
          </Button>
          <Txt typography="st13" color={adaptive.grey500} textAlign="center">
            위치 권한과 카메라 권한이 필요합니다
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
  pins: {
    ...StyleSheet.absoluteFillObject,
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
    gap: 14,
  },
  wordmark: {
    letterSpacing: 5,
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
    marginTop: 6,
  },
});
