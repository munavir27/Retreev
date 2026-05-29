import React from 'react';
import ChatRoomScreen from '../../screens/ChatRoom';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function ChatPage() {
  const { id } = useLocalSearchParams();  // Changed from roomId to id
  console.log("Chat page received id:", id);

  if (!id || typeof id !== 'string') {
    console.log("Invalid chat id:", id);
    return <Text>Invalid chat room</Text>;
  }

  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Chat',
          headerShown: true,
        }} 
      />
      <ChatRoomScreen roomId={id} />
    </>
  );
} 