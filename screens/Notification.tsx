import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../App';
import { supabase } from '../lib/supabase';

// Update the Notification type
type Notification = {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  related_items: {
    lost_item_id?: string;  // Changed from lost_id
    found_item_id?: string; // Changed from found_id
  };
  read: boolean;           // Changed from status
  created_at: string;
};

// Add this type at the top
type ChatRoom = {
  id: string;
  lost_user_id: string;
  found_user_id: string;
  lost_item_id: string;
  found_item_id: string;
  created_at: string;
};

const NotificationPage: React.FC = () => {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      Alert.alert('Error', 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      // Update local state to remove the deleted notification
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    }
  };

  const handleChatNow = async (notification: Notification) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        Alert.alert('Error', 'Please sign in to chat');
        return;
      }

      // First, fetch both lost and found item details to get the correct user IDs
      const { data: lostItem } = await supabase
        .from('lost')
        .select('user_id')
        .eq('id', notification.related_items.lost_item_id)
        .single();

      const { data: foundItem } = await supabase
        .from('found')
        .select('user_id')
        .eq('id', notification.related_items.found_item_id)
        .single();

      if (!lostItem || !foundItem) {
        throw new Error('Could not find item details');
      }

      // Check for existing room
      const { data: existingRooms } = await supabase
        .from('chat_rooms')
        .select('*')
        .or(`lost_item_id.eq.${notification.related_items.lost_item_id},found_item_id.eq.${notification.related_items.found_item_id}`);

      let roomId: string;

      if (existingRooms && existingRooms.length > 0) {
        console.log('Using existing room:', existingRooms[0].id);
        roomId = existingRooms[0].id;
      } else {
        // Create new chat room with correct user IDs
        const { data: newRoom, error: createError } = await supabase
          .from('chat_rooms')
          .upsert({
            lost_item_id: notification.related_items.lost_item_id,
            found_item_id: notification.related_items.found_item_id,
            lost_user_id: lostItem.user_id,    // Use actual lost item owner's ID
            found_user_id: foundItem.user_id    // Use actual found item owner's ID
          }, {
            onConflict: 'lost_item_id,found_item_id',
            ignoreDuplicates: true
          })
          .select()
          .single();

        if (createError) {
          console.error('Create room error:', createError);
          // Double check if room was created by someone else
          const { data: lastCheck } = await supabase
            .from('chat_rooms')
            .select('*')
            .or(`lost_item_id.eq.${notification.related_items.lost_item_id},found_item_id.eq.${notification.related_items.found_item_id}`);
          
          if (lastCheck && lastCheck.length > 0) {
            roomId = lastCheck[0].id;
          } else {
            throw createError;
          }
        } else {
          roomId = newRoom.id;
        }
      }

      // Verify that current user is part of this chat
      if (session.user.id !== lostItem.user_id && session.user.id !== foundItem.user_id) {
        Alert.alert('Error', 'You are not authorized to access this chat');
        return;
      }

      router.push({
        pathname: "/chat/[id]",
        params: { id: roomId }
      });

    } catch (error) {
      console.error('Chat error:', error);
      Alert.alert('Error', 'Failed to start chat');
    }
  };

  const renderNotification = (notification: Notification) => {
    // Check if current user is the finder or the person who lost the item
    const isLostItemOwner = notification.related_items.lost_item_id && 
      notification.message.includes("matches your lost");

    return (
      <TouchableOpacity 
        key={notification.id}
        style={[
          styles.notificationCard,
          !notification.read && styles.unreadCard
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: getNotificationColor(notification.type) }]}>
          <MaterialIcons name={getNotificationIcon(notification.type)} size={24} color="#fff" />
        </View>
        <View style={styles.notificationContent}>
          <View style={styles.notificationHeader}>
            <Text style={styles.notificationTitle}>{notification.title}</Text>
            <Text style={styles.notificationTime}>
              {formatTimestamp(notification.created_at)}
            </Text>
          </View>
          <View style={styles.messageContainer}>
            <Text style={styles.notificationMessage}>{notification.message}</Text>
            <TouchableOpacity 
              onPress={() => handleDeleteNotification(notification.id)}
              style={styles.deleteButton}
            >
              <MaterialIcons name="delete-outline" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </View>
          {notification.type === 'match' && (
            <TouchableOpacity 
              style={styles.chatButton}
              onPress={() => handleChatNow(notification)}
            >
              <LinearGradient
                colors={['#4ecdc4', '#45b7af']}
                style={styles.chatButtonGradient}
              >
                <MaterialIcons name="chat" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>
                  {isLostItemOwner ? 'Chat with Finder' : 'Chat with Owner'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
        {!notification.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'match':
        return '#4ecdc4';
      case 'update':
        return '#ff6b6b';
      case 'info':
        return '#ffd93d';
      case 'success':
        return '#6c5ce7';
      default:
        return '#4ecdc4';
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'match':
        return 'search';
      case 'update':
        return 'notifications-active';
      case 'info':
        return 'lightbulb';
      case 'success':
        return 'check-circle';
      default:
        return 'notifications';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={styles.header}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Activity Feed</Text>
            <Text style={styles.headerSubtitle}>
              Stay updated with your lost and found items
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {notifications.map(renderNotification)}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 24,
  },
  content: {
    padding: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    flex: 1,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  unreadCard: {
    backgroundColor: '#f8fafc',
    borderLeftWidth: 4,
    borderLeftColor: '#4ecdc4',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
    marginRight: 8,
  },
  notificationHeader: {
    marginBottom: 8,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationMessage: {
    flex: 1,
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
    marginRight: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ecdc4',
    marginLeft: 10,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  deleteButton: {
    padding: 6,
  },
  chatButton: {
    borderRadius: 6,
    overflow: 'hidden',
  },
  chatButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
    paddingHorizontal: 12,
    gap: 6,
  },
  chatButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
});

export default NotificationPage; 