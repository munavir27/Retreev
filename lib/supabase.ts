import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

console.log('Initializing Supabase with URL:', supabaseUrl);
console.log('Platform:', Platform.OS);

// Custom storage implementation for web
const webStorage = {
  getItem: (key: string) => {
    console.log('Web storage - Getting item:', key);
    return localStorage.getItem(key);
  },
  setItem: (key: string, value: string) => {
    console.log('Web storage - Setting item:', key);
    localStorage.setItem(key, value);
  },
  removeItem: (key: string) => {
    console.log('Web storage - Removing item:', key);
    localStorage.removeItem(key);
  },
};

// Custom storage implementation for native
const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    console.log('Secure storage - Getting item:', key);
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    console.log('Secure storage - Setting item:', key);
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    console.log('Secure storage - Removing item:', key);
    await SecureStore.deleteItemAsync(key);
  },
};

const storage = Platform.OS === 'web' ? webStorage : ExpoSecureStoreAdapter;
console.log('Using storage adapter for platform:', Platform.OS);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});