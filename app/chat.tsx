import React from 'react';
import ChatRoomScreen from '../screens/ChatRoom';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function ChatPage() {
  const { roomId } = useLocalSearchParams();
  console.log("Chat page received roomId:", roomId); // Debug log

  if (!roomId || typeof roomId !== 'string') {
    console.log("Invalid roomId:", roomId); // Debug log
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
      <ChatRoomScreen roomId={roomId} />
    </>
  );
} 