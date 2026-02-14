import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Colors } from '../src/constants/colors';
import { useAuthStore } from '../src/stores/authStore';

export default function AuthCallback() {
  const router = useRouter();
  const { login } = useAuthStore();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processAuth = async () => {
      try {
        // Get session_id from URL hash (fragment)
        let sessionId: string | null = null;
        
        if (typeof window !== 'undefined') {
          const hash = window.location.hash;
          if (hash.includes('session_id=')) {
            const params = new URLSearchParams(hash.substring(1));
            sessionId = params.get('session_id');
          }
        }

        if (!sessionId) {
          console.error('No session_id found');
          router.replace('/(tabs)/profile');
          return;
        }

        await login(sessionId);
        
        // Clear the hash and redirect
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', window.location.pathname);
        }
        
        router.replace('/(tabs)');
      } catch (error) {
        console.error('Auth callback error:', error);
        router.replace('/(tabs)/profile');
      }
    };

    processAuth();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Loggar in...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
