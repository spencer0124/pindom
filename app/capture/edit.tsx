import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdaptive } from '@/design-system';
import { useCaptureStore } from '@/features/capture';
import { PhotoEditor } from '@/features/capture/PhotoEditor';

export default function EditScreen() {
  const adaptive = useAdaptive();
  const place = useCaptureStore((s) => s.place);
  const grant = useCaptureStore((s) => s.grant);
  const photoUri = useCaptureStore((s) => s.photoUri);
  const setComposed = useCaptureStore((s) => s.setComposed);
  useFocusEffect(useCallback(() => {
    if (!photoUri || !place) router.replace('/map' as never);
  }, [photoUri, place]));
  if (!place || !photoUri) return null;
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: adaptive.greyBackground }]}>
      <PhotoEditor key={photoUri} uri={photoUri} placeName={place.name} testMode={grant?.testMode} onBack={() => router.back()}
        onNext={(uri) => { setComposed(uri); router.push('/capture/visibility' as never); }} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ root: { flex: 1 } });
