import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
} from '@expo-google-fonts/figtree';
import { useFonts } from 'expo-font';
import { Slot, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '../lib/auth';
import { OnboardingProvider, useOnboarding } from '../lib/onboarding';
import { StoreProvider } from '../lib/store';
import { c, SELECTION } from '../theme/tokens';

/** Sends you to onboarding, sign-in or the app, depending on what is known. */
function Gate() {
  const { ready, session, configured } = useAuth();
  const { seen } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();

  const group = segments[0] as string | undefined;

  useEffect(() => {
    if (!configured) {
      if (group !== 'setup') router.replace('/setup');
      return;
    }
    if (!ready || seen === null) return;

    if (!session) {
      if (!seen) {
        if (group !== 'onboarding') router.replace('/onboarding');
      } else if (group !== 'sign-in' && group !== 'onboarding') {
        router.replace('/sign-in');
      }
      return;
    }
    if (group !== '(main)') router.replace('/today');
  }, [configured, ready, seen, session, group, router]);

  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    // Caprasimo with the Polish letters composed in; see scripts/build-display-font.mjs
    JotDisplay: require('../assets/fonts/JotDisplay-Regular.ttf'),
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });

  // A browser has a selection colour of its own, and it is not the one the held
  // blocks are drawn in. `::selection` cannot be written as an inline style, so
  // it goes in as a rule of its own.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const rule = document.createElement('style');
    rule.textContent = `::selection{background:${SELECTION.bg};color:${SELECTION.fg}}`;
    document.head.appendChild(rule);
    return () => rule.remove();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={c.accent} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <AuthProvider>
        <StoreProvider>
          <OnboardingProvider>
            <View style={{ flex: 1, backgroundColor: c.bg }}>
              <Gate />
              <Slot />
            </View>
          </OnboardingProvider>
        </StoreProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
