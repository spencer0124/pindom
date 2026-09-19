/** expo-camera 17 iOS selects AVCaptureDevice.localizedName, not deviceType.
 * Always pass back the exact discovered value. Never guess a physical lens
 * from the order (the native module sorts names, including virtual cameras). */
export function lensKind(name: string): 'normal' | 'ultraWide' | null {
  if (/^(builtInWideAngleCamera|(?:back|rear)(?: wide(?: angle)?)? camera|후면(?: 와이드| 광각)? 카메라)$/i.test(name)) return 'normal';
  if (/^(builtInUltraWideCamera|(?:back|rear) ultra[ -]?wide camera|후면 (?:울트라 와이드|초광각) 카메라)$/i.test(name)) return 'ultraWide';
  return null;
}

export function cameraLensOptions(names: string[]) {
  const unique = [...new Set(names)];
  const visible = preferredLens(unique) ? unique.filter((name) => lensKind(name) != null) : unique;
  return visible.map((id) => ({
    id,
    label: lensKind(id) === 'normal' ? '일반 1×' : lensKind(id) === 'ultraWide' ? '광각 0.5×' : id,
  }));
}

export function preferredLens(names: string[]): string | undefined {
  return names.find((name) => lensKind(name) === 'normal');
}
