import React from 'react';
import { Stack } from 'expo-router';
import WorkingPage from '@/screens/Working';

export default function Working() {
  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false
        }} 
      />
      <WorkingPage />
    </>
  );
}
