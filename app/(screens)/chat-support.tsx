import React from 'react';
import { Stack } from 'expo-router';
import ChatSupportPage from '@/screens/ChatSupport';

export default function ChatSupport() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      <ChatSupportPage />
    </>
  );
} 