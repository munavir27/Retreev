import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const ProfilePage = () => {
  const router = useRouter();
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    lostItems: 0,
    foundItems: 0
  });

  useEffect(() => {
    fetchUserProfile();
    fetchUserStats();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserDetails({
          email: user.email,
          id: user.id,
          created_at: new Date(user.created_at).toLocaleDateString(),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch lost items count
        const { count: lostCount } = await supabase
          .from('lost')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        // Fetch found items count
        const { count: foundCount } = await supabase
          .from('found')
          .select('*', { count: 'exact' })
          .eq('user_id', user.id);

        setStats({
          lostItems: lostCount || 0,
          foundItems: foundCount || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  const handleEditProfile = () => {
    router.push('/(screens)/EditProfile' as any);
  };

  const handleNotifications = () => {
    router.push('/(screens)/notification');
  };

  const handlePrivacySecurity = () => {
    router.push('/(screens)/PrivacySecurity' as any);
  };

  const handleHelpSupport = () => {
    router.push('/(screens)/chat-support');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <LinearGradient
          colors={['#0f172a', '#1e293b']}
          style={styles.headerSection}
        >
          <View style={styles.profileHeader}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.avatarContainer}>
              <MaterialIcons name="account-circle" size={80} color="#fff" />
            </View>
            <Text style={styles.userName}>{userDetails?.email}</Text>
            <Text style={styles.userSubtitle}>Member since {userDetails?.created_at}</Text>
          </View>
        </LinearGradient>

        <View style={styles.contentSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.lostItems}</Text>
              <Text style={styles.statLabel}>Lost Items</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.foundItems}</Text>
              <Text style={styles.statLabel}>Found Items</Text>
            </View>
          </View>

          <View style={styles.menuSection}>
            <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
              <MaterialIcons name="edit" size={24} color="#2c3e50" />
              <Text style={styles.menuText}>Edit Profile</Text>
              <MaterialIcons name="chevron-right" size={24} color="#2c3e50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
              <MaterialIcons name="notifications" size={24} color="#2c3e50" />
              <Text style={styles.menuText}>Notifications</Text>
              <MaterialIcons name="chevron-right" size={24} color="#2c3e50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handlePrivacySecurity}>
              <MaterialIcons name="security" size={24} color="#2c3e50" />
              <Text style={styles.menuText}>Privacy & Security</Text>
              <MaterialIcons name="chevron-right" size={24} color="#2c3e50" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
              <MaterialIcons name="help-outline" size={24} color="#2c3e50" />
              <Text style={styles.menuText}>Help & Support</Text>
              <MaterialIcons name="chevron-right" size={24} color="#2c3e50" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.signOutButton} 
            onPress={handleSignOut}
          >
            <MaterialIcons name="logout" size={24} color="#ff6b6b" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSection: {
    padding: 30,
    paddingTop: 50,
  },
  profileHeader: {
    alignItems: 'center',
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  userSubtitle: {
    fontSize: 14,
    color: '#cbd5e1',
  },
  contentSection: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  statLabel: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#e2e8f0',
  },
  menuSection: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  menuText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signOutText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#ff6b6b',
    fontWeight: '600',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
});

export default ProfilePage; 