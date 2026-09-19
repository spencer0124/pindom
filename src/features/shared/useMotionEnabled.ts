import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, AppState } from 'react-native';

/** Decorative motion only while visible, foregrounded and allowed by the OS. */
export function useMotionEnabled() {
  const focused = useIsFocused();
  const [active, setActive] = useState(AppState.currentState === 'active');
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted && !changed) setReduced(value);
    }).catch(() => { /* Keep the static treatment if accessibility is unavailable. */ });
    const motion = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      setReduced(value);
    });
    const app = AppState.addEventListener('change', (value) => setActive(value === 'active'));
    return () => { mounted = false; motion.remove(); app.remove(); };
  }, []);
  return focused && active && !reduced;
}
