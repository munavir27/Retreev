import React from 'react';
import { Stack } from 'expo-router';
import NotificationPage from '@/screens/Notification';

export default function Notification() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      <NotificationPage />
    </>
  );
} 