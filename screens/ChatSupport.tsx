import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'support';
  timestamp: string;
};

const ChatSupportPage = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! How can I help you today?',
      sender: 'support',
      timestamp: new Date().toISOString(),
    },
  ]);
  const scrollViewRef = useRef<ScrollView>(null);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();

  // List of dummy keywords and their customized replies
  const keywordReplies = [
    {
      keywords: ['hello', 'hi', 'hey'],
      reply: 'Hi there! How can I assist you today?',
      hints: ['1.Issue', '2.Refund', '3.End Conversation'],
    },
    {
      keywords: ['issue', 'problem', 'error'],
      reply: 'I’m sorry to hear that you’re facing an issue. Could you please provide more details?',
      hints: ['refund', 'thank you', 'bye'],
    },
    {
      keywords: ['refund', 'return', 'cancel'],
      reply: 'For refunds or returns, please visit our refund policy page or contact our billing team.',
      hints: ['issue', 'thank you', 'bye'],
    },
    {
      keywords: ['thank you', 'thanks'],
      reply: 'You’re welcome! Let me know if you need further assistance.',
      hints: ['issue', 'refund', 'bye'],
    },
    {
      keywords: ['bye', 'goodbye'],
      reply: 'It was nice talking to you! Have a great day!',
      hints: [],
    },
  ];

  // Fallback reply if no keywords are matched
  const fallbackReply = 'It was nice talking to you! If you have more questions, feel free to ask.';

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const handleSend = () => {
    if (!message.trim()) return;

    // Add the user's message to the chat
    const newMessage: Message = {
      id: Date.now().toString(),
      content: message.trim(),
      sender: 'user',
      timestamp: new Date().toISOString(),
    };

    setMessages([...messages, newMessage]);
    setMessage('');

    // Simulate support response
    setTimeout(() => {
      const supportResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: getSupportReply(message.trim().toLowerCase()),
        sender: 'support',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, supportResponse]);
    }, 1000);
  };

  // Function to get a customized reply based on the user's message
  const getSupportReply = (message: string) => {
    for (const { keywords, reply, hints } of keywordReplies) {
      if (keywords.some(keyword => message.includes(keyword))) {
        if (hints.length > 0) {
          return `${reply} You can continue with: ${hints.join(', ')}.`;
        }
        return reply;
      }
    }
    return fallbackReply; // Fallback reply if no keywords are matched
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
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
            <Text style={styles.headerTitle}>Chat Support</Text>
            <Text style={styles.headerSubtitle}>
              We're here to help you 24/7
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.messageWrapper,
                  msg.sender === 'user' ? styles.userMessageWrapper : styles.supportMessageWrapper,
                ]}
              >
                <View
                  style={[
                    styles.message,
                    msg.sender === 'user' ? styles.userMessage : styles.supportMessage,
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    msg.sender === 'user' && styles.userMessageText
                  ]}>{msg.content}</Text>
                  <Text style={[
                    styles.timestamp,
                    msg.sender === 'user' && styles.userTimestamp
                  ]}>{formatTime(msg.timestamp)}</Text>
                </View>
              </View>
            ))}
          </ScrollView>

          <View style={styles.inputWrapper}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={message}
                onChangeText={setMessage}
                placeholder="Type your message..."
                placeholderTextColor="#94a3b8"
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !message.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSend}
                disabled={!message.trim()}
              >
                <MaterialIcons
                  name="send"
                  size={24}
                  color={message.trim() ? '#fff' : '#94a3b8'}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f6fa',
  },
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 30,
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 10,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
  },
  messagesContainer: {
    flex: 1,
    padding: 15,
  },
  messagesContent: {
    paddingBottom: 10,
  },
  messageWrapper: {
    marginVertical: 5,
    flexDirection: 'row',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  supportMessageWrapper: {
    justifyContent: 'flex-start',
  },
  message: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
    marginBottom: 5,
  },
  userMessage: {
    backgroundColor: '#4ecdc4',
    borderBottomRightRadius: 5,
  },
  supportMessage: {
    backgroundColor: '#f1f5f9',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
    color: '#1e293b',
  },
  userMessageText: {
    color: '#fff',
  },
  timestamp: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: '#e2e8f0',
  },
  inputWrapper: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    padding: 10,
    paddingBottom: Platform.OS === 'ios' ? 25 : 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 16,
    color: '#1e293b',
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    backgroundColor: '#4ecdc4',
    width: 45,
    height: 45,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
});

export default ChatSupportPage;