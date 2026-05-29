import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen name="lost" options={{ headerShown: false }} />
      <Stack.Screen name="found" options={{ headerShown: false }} />
      <Stack.Screen name="notification" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="chat" options={{ headerShown: true }} />
    </Stack>
  );
} 