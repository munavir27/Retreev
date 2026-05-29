import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

const WorkingPage = () => {
  const router = useRouter();

  const features = [
    {
      title: 'Report Lost Items',
      description: 'Easily report your lost items with detailed descriptions, photos, and location information.',
      icon: 'search',
      color: '#ff6b6b',
    },
    {
      title: 'Report Found Items',
      description: 'Help others by reporting items you\'ve found, making it easier for owners to locate their belongings.',
      icon: 'add-circle-outline',
      color: '#4ecdc4',
    },
    {
      title: 'Location Tracking',
      description: 'Use precise location mapping to mark where items were lost or found.',
      icon: 'location-on',
      color: '#ffd93d',
    },
    {
      title: 'Photo Upload',
      description: 'Add clear photos of lost or found items to improve identification.',
      icon: 'photo-camera',
      color: '#6c5ce7',
    },
    {
      title: 'Real-time Notifications',
      description: 'Receive instant notifications when potential matches are found.',
      icon: 'notifications',
      color: '#a8e6cf',
    },
    {
      title: 'Secure Communication',
      description: 'Safe and secure in-app communication between users.',
      icon: 'chat',
      color: '#ff8b94',
    },
  ];

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
            <Text style={styles.headerTitle}>How It Works</Text>
            <Text style={styles.headerSubtitle}>
              Your guide to using the Lost & Found app effectively
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          {/* Steps Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Simple Steps</Text>
            <View style={styles.stepsContainer}>
              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: '#ff6b6b' }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={styles.stepTitle}>Create Account</Text>
                <Text style={styles.stepDescription}>
                  Sign up with your email to access all features
                </Text>
              </View>

              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: '#4ecdc4' }]}>
                  <Text style={styles.stepNumberText}>2</Text>
                </View>
                <Text style={styles.stepTitle}>Report Item</Text>
                <Text style={styles.stepDescription}>
                  Report lost or found items with details and photos
                </Text>
              </View>

              <View style={styles.step}>
                <View style={[styles.stepNumber, { backgroundColor: '#ffd93d' }]}>
                  <Text style={styles.stepNumberText}>3</Text>
                </View>
                <Text style={styles.stepTitle}>Connect</Text>
                <Text style={styles.stepDescription}>
                  Get notified and connect with matching reports
                </Text>
              </View>
            </View>
          </View>

          {/* Features Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Features</Text>
            <View style={styles.featuresGrid}>
              {features.map((feature, index) => (
                <View key={index} style={styles.featureCard}>
                  <View style={[styles.featureIcon, { backgroundColor: feature.color }]}>
                    <MaterialIcons name={feature.icon as any} size={24} color="#fff" />

                  </View>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Tips Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pro Tips</Text>
            <View style={styles.tipsContainer}>
              <View style={styles.tipCard}>
                <Ionicons name="bulb" size={24} color="#ffd93d" />
                <Text style={styles.tipText}>
                  Add clear, well-lit photos from multiple angles
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="time" size={24} color="#4ecdc4" />
                <Text style={styles.tipText}>
                  Report items as soon as possible for better chances
                </Text>
              </View>
              <View style={styles.tipCard}>
                <Ionicons name="location" size={24} color="#ff6b6b" />
                <Text style={styles.tipText}>
                  Be as specific as possible with location details
                </Text>
              </View>
            </View>
          </View>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  step: {
    alignItems: 'center',
    width: '30%',
  },
  stepNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  tipsContainer: {
    gap: 15,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipText: {
    fontSize: 14,
    color: '#2c3e50',
    marginLeft: 15,
    flex: 1,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1,
    padding: 8,
  },
});

export default WorkingPage; 