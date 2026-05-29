import { Stack, useRouter } from 'expo-router';
import { Linking } from 'react-native';
import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Alert } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  useEffect(() => {
    // Handle deep links when the app is already open
    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Handle deep links when the app is opened from a URL
    Linking.getInitialURL().then(url => {
      if (url) {
        handleDeepLink({ url });
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleDeepLink = async ({ url }: { url: string }) => {
    console.log('Received deep link URL:', url);
    
    try {
      // Handle email confirmation URLs
      if (url.includes('#access_token=')) {
        const params = new URLSearchParams(url.split('#')[1]);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        if (accessToken && refreshToken) {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;

          if (data.session) {
            Alert.alert(
              'Success',
              'Email confirmed successfully!',
              [
                {
                  text: 'OK',
                  onPress: () => router.replace('/')
                }
              ]
            );
          }
        }
      }
    } catch (error: any) {
      console.error('Deep link error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to confirm email. Please try again.'
      );
    }
  };

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(screens)" options={{ headerShown: false }} />
    </Stack>
  );
}
