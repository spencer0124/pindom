import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ErrorPage, Loader, Txt, useAdaptive, useTheme } from '@/design-system';
import type { ProfileVisibility } from '@/lib/domain';
import { NICKNAME_MAX, useProfileEdit, type ProfileDraft } from '@/features/profile';
import { Rule, Shape } from '@/features/shared';

const VISIBILITY: { id: ProfileVisibility; label: string; desc: string }[] = [
  { id: 'public', label: '공개 프로필', desc: '다른 팬이 내 인증 촬영지와 티켓 수를 볼 수 있어요' },
  { id: 'private', label: '비공개 프로필', desc: '닉네임만 보이고 컬렉션은 나만 봅니다' },
];

/**
 * 프로필 편집 — the four fields the client may write.
 *
 * Built from prototype block `1a` for layout, copy and flow and `2b` for colour,
 * type and corners, matching `app/(tabs)/index.tsx`. The route screens.md
 * proposed; there is no Figma frame.
 *
 * 1a offers 사진 올리기 and 내 인증컷에서 고르기. The first needs an image picker
 * this build does not have; the second is the user's own ticket photos, which
 * are already uploaded and already theirs, so that is the avatar strip. 1a's
 * interest tags (드라마 OST · 예능) have no field; 내 아티스트 shows the followed
 * 최애 and 추가 goes to 최애 찾기.
 */
export default function ProfileEditScreen() {
  const adaptive = useAdaptive();
  const { token } = useTheme();
  const { state, reload, saving, save } = useProfileEdit();
  const [draft, setDraft] = useState<ProfileDraft | null>(null);

  useEffect(() => {
    if (state.status === 'ready' && draft == null) {
      const { user } = state;
      setDraft({
        nickname: user.nickname,
        bio: user.bio ?? '',
        avatarUrl: user.avatarUrl,
        profileVisibility: user.profileVisibility,
      });
    }
  }, [state, draft]);

  if (state.status === 'loading' || draft == null) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        {state.status === 'error' ? (
          <ErrorPage title="프로필을 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
        ) : (
          <Loader.Centered label="불러오는 중" />
        )}
      </SafeAreaView>
    );
  }
  if (state.status === 'error') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
        <ErrorPage title="프로필을 불러오지 못했어요" subtitle={state.message} onPressRightButton={reload} />
      </SafeAreaView>
    );
  }

  const { artists, shots } = state;
  const name = draft.nickname;
  const nameBad = name.trim().length === 0 || name.length > NICKNAME_MAX;
  const nameHint = nameBad
    ? name.trim()
      ? '12자 이내로 줄여주세요'
      : '닉네임을 입력해야 저장할 수 있어요'
    : '커뮤니티와 티켓에 표시되는 이름입니다 · 30일에 1회 변경 가능';

  const submit = async () => {
    if (nameBad || saving.busy) return;
    const ok = await save(draft);
    if (ok) router.back();
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: adaptive.greyBackground }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" style={styles.headerSide}>
          <Txt typography="t7" fontWeight="medium" color={adaptive.grey600}>
            취소
          </Txt>
        </Pressable>
        <Txt typography="t6" fontWeight="bold" color={adaptive.grey900}>
          프로필 편집
        </Txt>
        <Pressable
          onPress={() => void submit()}
          disabled={nameBad || saving.busy}
          accessibilityRole="button"
          style={[styles.headerSide, styles.headerRight]}
        >
          <Txt typography="t7" fontWeight="bold" color={nameBad ? adaptive.grey400 : token.accent.fillColor}>
            저장
          </Txt>
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.body}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.avatarBlock}>
            <View style={[styles.avatar, { backgroundColor: adaptive.background, borderColor: token.accent.fillColor }]}>
              {draft.avatarUrl != null ? (
                <Image source={{ uri: draft.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              ) : (
                <Txt typography="t3" fontWeight="bold" color={adaptive.grey600}>
                  {name.trim().slice(0, 1)}
                </Txt>
              )}
            </View>
            {shots.length > 0 && (
              <>
                <Txt typography="st13" fontWeight="medium" color={adaptive.grey600}>
                  내 인증컷에서 고르기
                </Txt>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.shots}>
                  {shots.map((shot) => {
                    const on = draft.avatarUrl === shot.photoUrl;
                    return (
                      <Pressable
                        key={shot.id}
                        onPress={() => setDraft({ ...draft, avatarUrl: shot.photoUrl })}
                        accessibilityRole="button"
                        accessibilityLabel={shot.placeName}
                        style={[styles.shot, { borderColor: on ? token.accent.fillColor : adaptive.grey200 }]}
                      >
                        <Image source={{ uri: shot.photoUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </>
            )}
          </View>

          <Rule />

          <View style={styles.field}>
            <View style={styles.fieldHead}>
              <Txt typography="st13" fontWeight="bold" color={adaptive.grey700}>
                닉네임
              </Txt>
              <Txt typography="st13" color={name.length > NICKNAME_MAX ? token.accent.fillColor : adaptive.grey500}>
                {name.length}/{NICKNAME_MAX}
              </Txt>
            </View>
            <TextInput
              value={name}
              onChangeText={(nickname) => setDraft({ ...draft, nickname })}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={adaptive.grey400}
              autoCorrect={false}
              autoCapitalize="none"
              style={[styles.input, { color: adaptive.grey900, borderBottomColor: adaptive.grey200 }]}
            />
            <Txt typography="st13" color={nameBad ? token.accent.fillColor : adaptive.grey500}>
              {nameHint}
            </Txt>
          </View>

          <View style={styles.field}>
            <Txt typography="st13" fontWeight="bold" color={adaptive.grey700}>
              한 줄 소개
            </Txt>
            <TextInput
              value={draft.bio}
              onChangeText={(bio) => setDraft({ ...draft, bio })}
              multiline
              placeholder="어떤 촬영지를 모으고 있나요?"
              placeholderTextColor={adaptive.grey400}
              style={[styles.input, styles.bio, { color: adaptive.grey900, borderBottomColor: adaptive.grey200 }]}
            />
          </View>

          <View style={styles.field}>
            <Txt typography="st13" fontWeight="bold" color={adaptive.grey700}>
              내 아티스트
            </Txt>
            <View style={styles.chips}>
              {artists.map((artist) => (
                <View key={artist.id} style={[styles.chip, { borderColor: token.accent.fillColor }]}>
                  <Txt typography="st13" fontWeight="bold" color={token.accent.fillColor}>
                    {artist.name}
                  </Txt>
                </View>
              ))}
              <Pressable
                onPress={() => router.push('/artist/search' as never)}
                accessibilityRole="button"
                style={[styles.chip, { borderColor: adaptive.grey200 }]}
              >
                <Txt typography="st13" fontWeight="bold" color={adaptive.grey600}>
                  + 추가
                </Txt>
              </Pressable>
            </View>
          </View>

          <View style={styles.field}>
            <Txt typography="st13" fontWeight="bold" color={adaptive.grey700}>
              공개 범위
            </Txt>
            {VISIBILITY.map((option) => {
              const on = draft.profileVisibility === option.id;
              return (
                <Pressable
                  key={option.id}
                  onPress={() => setDraft({ ...draft, profileVisibility: option.id })}
                  accessibilityRole="radio"
                  accessibilityLabel={option.label}
                  accessibilityState={{ selected: on }}
                  style={[
                    styles.option,
                    { borderColor: on ? token.accent.fillColor : adaptive.grey200 },
                    on && { backgroundColor: token.accent.dimColor },
                  ]}
                >
                  <View style={styles.optionCopy}>
                    <Txt typography="t7" fontWeight="bold" color={adaptive.grey900}>
                      {option.label}
                    </Txt>
                    <Txt typography="st13" color={adaptive.grey600}>
                      {option.desc}
                    </Txt>
                  </View>
                  <View style={[styles.radio, { borderColor: on ? token.accent.fillColor : adaptive.grey300 }]}>
                    {on && <View style={[styles.radioDot, { backgroundColor: token.accent.fillColor }]} />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {saving.message != null && (
            <Txt typography="st13" color={adaptive.grey600} style={styles.error}>
              {saving.message}
            </Txt>
          )}

          <View style={styles.save}>
            <Button size="large" type="primary" display="block" disabled={nameBad} loading={saving.busy} onPress={() => void submit()}>
              변경사항 저장
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  headerRight: {
    alignItems: 'flex-end',
  },
  body: {
    flex: 1,
  },
  content: {
    paddingBottom: 24,
  },
  avatarBlock: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 18,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shots: {
    paddingHorizontal: Shape.gutter,
    gap: 8,
  },
  shot: {
    width: 52,
    height: 52,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  field: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 18,
    gap: 8,
  },
  fieldHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    height: 44,
    fontSize: 16,
    borderBottomWidth: Shape.rowRule,
  },
  bio: {
    height: 72,
    paddingTop: 10,
    textAlignVertical: 'top',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: Shape.chipRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 14,
  },
  optionCopy: {
    flex: 1,
    gap: 3,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  error: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 12,
  },
  save: {
    paddingHorizontal: Shape.gutter,
    paddingTop: 24,
  },
});
