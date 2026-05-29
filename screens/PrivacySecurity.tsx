import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const PrivacySecurityPage = () => {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
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
            <Text style={styles.headerTitle}>Privacy & Security</Text>
            <Text style={styles.headerSubtitle}>
              Manage your privacy settings
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="security" size={24} color="#2c3e50" />
              <Text style={styles.sectionTitle}>Security Settings</Text>
            </View>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingDescription}>Update your account password</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Two-Factor Authentication</Text>
                <Text style={styles.settingDescription}>Add an extra layer of security</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="visibility" size={24} color="#2c3e50" />
              <Text style={styles.sectionTitle}>Privacy Settings</Text>
            </View>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Profile Visibility</Text>
                <Text style={styles.settingDescription}>Control who can see your profile</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingTextContainer}>
                <Text style={styles.settingTitle}>Data Sharing</Text>
                <Text style={styles.settingDescription}>Manage how your data is used</Text>
              </View>
              <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="report" size={24} color="#2c3e50" />
              <Text style={styles.sectionTitle}>Privacy Policy</Text>
            </View>
            
            <View style={styles.policyContainer}>
              <Text style={styles.policyText}>
                Our privacy policy explains how we collect, use, and protect your personal information.
                We are committed to ensuring the security of your data and maintaining your trust.
              </Text>
              <TouchableOpacity style={styles.policyButton}>
                <Text style={styles.policyButtonText}>Read Full Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
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
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
  content: {
    flex: 1,
    backgroundColor: '#f5f6fa',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    padding: 20,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginLeft: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#334155',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#64748b',
  },
  policyContainer: {
    paddingVertical: 16,
  },
  policyText: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 16,
  },
  policyButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  policyButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default PrivacySecurityPage; 