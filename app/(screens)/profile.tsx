import React from 'react';
import { Stack } from 'expo-router';
import ProfilePage from '@/screens/Profile';

export default function Profile() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      <ProfilePage />
    </>
  );
} 