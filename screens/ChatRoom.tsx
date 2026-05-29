import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base-64';
import ImageView from 'react-native-image-viewing';

type MessageType = 'text' | 'image';

type Message = {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  type: MessageType;
  metadata?: {
    width?: number;
    height?: number;
    fileSize?: number;
  };
};

// Update the props type
type ChatRoomProps = {
  roomId: string;  // This will now be "lost_item_id_found_item_id"
};

// Instead of extending FileSystem.FileInfo, create a new interface
interface FileInfoWithSize {
  exists: boolean;
  uri: string;
  size?: number;
  isDirectory: boolean;
}

const ChatRoom: React.FC<ChatRoomProps> = ({ roomId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    // Get current user
    supabase.auth.getUser().then(({ data: { user } }) => {
      setCurrentUserId(user?.id || null);
    });

    // Add console logs for debugging
    console.log('Chat room ID:', roomId);
    
    fetchMessages();
    const cleanup = subscribeToMessages();
    return () => {
      cleanup();
    };
  }, [roomId]);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Sorry, we need camera roll permissions to share images!');
      }
    })();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);  // Add loading state
      
      // Clear existing messages first
      setMessages([]);

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('chat_room_id', roomId)
        .order('created_at', { ascending: true })
        .throwOnError();  // This will throw if there's an error

      if (error) throw error;

      // Add console log to debug
      console.log('Fetched messages:', data);

      // Update messages state with fresh data
      setMessages(data || []);

    } catch (error) {
      console.error('Error fetching messages:', error);
      Alert.alert('Error', 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    try {
      const { error } = await supabase.from('messages').insert({
        chat_room_id: roomId,
        content: newMessage.trim(),
        sender_id: currentUserId,
        type: 'text',
        metadata: {}
      });

      if (error) throw error;
      setNewMessage('');
      inputRef.current?.clear();
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    }
  };

  const subscribeToMessages = () => {
    console.log('Setting up real-time subscription for room:', roomId);
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_room_id=eq.${roomId}`,
        },
        (payload) => {
          console.log('New message received:', payload.new);
          setMessages((currentMessages) => {
            if (!currentMessages.some(msg => msg.id === payload.new.id)) {
              return [...currentMessages, payload.new as Message];
            }
            return currentMessages;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('Message deleted:', payload.old);
          if (payload.old && payload.old.chat_room_id === roomId) {
            setMessages((currentMessages) => 
              currentMessages.filter(msg => msg.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const isOwnMessage = (senderId: string) => currentUserId === senderId;

  const uploadAndSendImage = async (imageAsset: ImagePicker.ImagePickerAsset) => {
    if (!currentUserId) return;
    
    try {
      setIsUploading(true);
      console.log('Starting image upload, URI:', imageAsset.uri);

      // Generate filename
      const fileExt = imageAsset.uri.split('.').pop()?.toLowerCase() || 'jpeg';
      const mimeType = fileExt === 'jpg' ? 'jpeg' : fileExt;
      const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(imageAsset.uri, {
        encoding: 'base64'
      });

      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat-images')
        .upload(fileName, decode(base64), {
          contentType: `image/${mimeType}`
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('chat-images')
        .getPublicUrl(fileName);

      // Create message with image URL
      const { error: messageError } = await supabase.from('messages').insert({
        chat_room_id: roomId,
        sender_id: currentUserId,
        content: publicUrl,
        type: 'image',
        metadata: {
          width: imageAsset.width,
          height: imageAsset.height
        }
      });

      if (messageError) throw messageError;

    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleImagePick = async () => {
    try {
      // Request permissions first
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Please allow access to your photo library to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7, // Reduced quality for better performance
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets[0]) {
        // Check file size
        const fileInfo = await FileSystem.getInfoAsync(result.assets[0].uri) as FileInfoWithSize;
        const fileSize = fileInfo.size || 0;
        const maxSize = 5 * 1024 * 1024; // 5MB

        if (fileSize > maxSize) {
          Alert.alert('File Too Large', 'Please select an image smaller than 5MB');
          return;
        }

        await uploadAndSendImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleImagePress = (imageUrl: string) => {
    setSelectedImageUrl(imageUrl);
    setImageViewerVisible(true);
  };

  // Add this component for image loading
  const ImageWithLoading: React.FC<{
    uri: string;
    style: any;
    onPress: () => void;
  }> = ({ uri, style, onPress }) => {
    const [loading, setLoading] = useState(true);

    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9}>
        <Image
          source={{ uri }}
          style={style}
          resizeMode="cover"
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
        />
        {loading && (
          <View style={[style, styles.imageLoadingContainer]}>
            <ActivityIndicator size="small" color="#4ecdc4" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Add this function to handle message deletion
  const handleDeleteMessage = async (messageId: string, senderId: string) => {
    // Only allow users to delete their own messages
    if (senderId !== currentUserId) return;

    try {
      console.log('Attempting to delete message:', messageId);
      
      // First verify the message exists
      const { data: messageExists } = await supabase
        .from('messages')
        .select('id')
        .eq('id', messageId)
        .single();

      console.log('Message exists check:', messageExists);

      // Delete the message
      const { error, data } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .select();  // Add this to get deletion confirmation

      if (error) {
        console.error('Error deleting message:', error);
        throw error;
      } else {
        console.log('Delete operation response:', data);
        console.log('Message successfully deleted from database');
        
        // Update local state only after successful deletion
        setMessages(prevMessages => 
          prevMessages.filter(message => message.id !== messageId)
        );
      }
    } catch (error) {
      console.error('Error in delete operation:', error);
      Alert.alert('Error', 'Failed to delete message');
    }
  };

  // Modify the renderMessage function to include delete option
  const renderMessage = ({ item }: { item: Message }) => {
    const isOwn = isOwnMessage(item.sender_id);
    const screenWidth = Dimensions.get('window').width;
    const maxImageWidth = screenWidth * 0.6;

    return (
      <TouchableOpacity
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.otherMessage,
          styles.pressable
        ]}
        onLongPress={() => {
          if (isOwn) {
            Alert.alert(
              'Delete Message',
              'Do you want to delete this message?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Delete', 
                  onPress: () => handleDeleteMessage(item.id, item.sender_id),
                  style: 'destructive'
                }
              ]
            );
          }
        }}
      >
        {item.type === 'image' ? (
          <View>
            <ImageWithLoading
              uri={item.content}
              style={[
                styles.messageImage,
                { maxWidth: maxImageWidth }
              ]}
              onPress={() => handleImagePress(item.content)}
            />
            <Text style={styles.messageTime}>
              {new Date(item.created_at).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              })}
            </Text>
          </View>
        ) : (
          <Text style={[
            styles.messageText,
            isOwn ? styles.ownMessageText : styles.otherMessageText
          ]}>
            {item.content}
          </Text>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4ecdc4" />
        </View>
      )}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        contentContainerStyle={styles.messagesList}
      />

      <ImageView
        images={[{ uri: selectedImageUrl || '' }]}
        imageIndex={0}
        visible={imageViewerVisible}
        onRequestClose={() => setImageViewerVisible(false)}
        swipeToCloseEnabled={true}
        doubleTapToZoomEnabled={true}
        HeaderComponent={({ imageIndex }) => (
          <View style={styles.imageViewerHeader}>
            <TouchableOpacity
              onPress={() => setImageViewerVisible(false)}
              style={styles.closeButton}
            >
              <MaterialIcons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
        FooterComponent={({ imageIndex }) => (
          <View style={styles.imageViewerFooter}>
            <Text style={styles.imageViewerText}>
              {new Date().toLocaleDateString()}
            </Text>
          </View>
        )}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={styles.inputWrapper}
      >
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.mediaButton} 
            onPress={handleImagePick}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#4ecdc4" />
            ) : (
              <MaterialIcons name="image" size={24} color="#4ecdc4" />
            )}
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity 
            style={[
              styles.sendButton, 
              (!newMessage.trim() && !isUploading) && styles.sendButtonDisabled
            ]} 
            onPress={sendMessage}
            disabled={!newMessage.trim() && !isUploading}
          >
            <MaterialIcons 
              name="send" 
              size={24} 
              color={newMessage.trim() ? "#fff" : "#A0AEC0"} 
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  messagesList: {
    paddingVertical: 15,
    paddingHorizontal: 10,
  },
  messageContainer: {
    padding: 10,
    marginVertical: 5,
    marginHorizontal: 10,
    maxWidth: '80%',
    borderRadius: 15,
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#4ecdc4',
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
  },
  messageText: {
    fontSize: 16,
    marginBottom: 5,
  },
  ownMessageText: {
    color: '#fff',
  },
  otherMessageText: {
    color: '#2c3e50',
  },
  messageTime: {
    fontSize: 12,
    color: '#94a3b8',
    alignSelf: 'flex-end',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    marginHorizontal: 10,
    padding: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4ecdc4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E2E8F0',
  },
  mediaButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 10,
    marginBottom: 5,
    backgroundColor: '#f0f0f0', // Placeholder color while loading
  },
  imageViewerHeader: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageViewerFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageViewerText: {
    color: '#fff',
    fontSize: 14,
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
  },
  pressable: {
    opacity: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    zIndex: 1,
  },
});

export default ChatRoom; 