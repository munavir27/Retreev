import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Dimensions, Platform, TextInput } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons'; // For icons
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';

// Define navigation type properly
type RootStackParamList = {
  home: undefined;
  '(screens)': {
    lost: undefined;
    found: undefined;
    profile: undefined;
    working: undefined;
    notification: undefined;
    'chat-support': undefined;
  };
};

// Create a proper navigation type
type HomeScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'home'
>;

const { width } = Dimensions.get('window');

const HomePage: React.FC = () => {
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<HomeScreenNavigationProp>();
    const router = useRouter();
    const [userRating, setUserRating] = useState(0);
    const [userReview, setUserReview] = useState('');
    const [userName, setUserName] = useState('');
    const [reviews, setReviews] = useState([
        {
            id: 1,
            name: 'Almas',
            rating: 5,
            text: '"Found my lost laptop within 24 hours! This app is a lifesaver. The community is incredibly helpful."',
        },
        {
            id: 2,
            name: 'Abiram',
            rating: 5,
            text: '"Reunited with my lost phone thanks to this amazing platform. The process was smooth and secure."',
        },
        {
            id: 4,
            name: 'Ashbin',
            rating: 5,
            text: '"Excellent app! Found my lost keys in just a few hours. The map feature is particularly helpful."',
        },
      
    ]);

    useEffect(() => {
        getUserName();
    }, []);
    
    // Add this new effect to refresh username when the screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            getUserName();
            return () => {};
        }, [])
    );

    const getUserName = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // First try to get the display name from user metadata
                const displayName = user.user_metadata?.display_name;
                if (displayName) {
                    setUserName(displayName);
                } else {
                    // Fallback to email name if no display name
                    const nameFromEmail = user.email?.split('@')[0] || 'User';
                    setUserName(nameFromEmail);
                }
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUserName('User');
        }
    };

    const handlePostReview = () => {
        if (!userRating || !userReview.trim()) return;

        const newReview = {
            id: Date.now(),
            name: 'You', // You might want to get the actual user name
            rating: userRating,
            text: `"${userReview.trim()}"`,
        };

        setReviews([...reviews, newReview]);
        setUserRating(0);
        setUserReview('');
    };

    return (
        <ScrollView 
            style={styles.container}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/*  Header with Gradient */}
            <LinearGradient
                colors={['#0f172a', '#1e293b']}  // Deep blue-gray to slate
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.headerContainer, { paddingTop: insets.top + 20 }]}
            >
                <View style={styles.headerOverlay} />
                <View style={styles.navbar}>
                    <View style={styles.logoContainer}>
                        <Ionicons name="search-circle-sharp" size={32} color="#ff6b6b" />
                        <Text style={styles.logoText}>Retreev</Text>
                    </View>
                    <View style={styles.navIcons}>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={() => router.push('/notification')}
                        >
                            <MaterialIcons name="notifications" size={24} color="#fff" />
                            <View style={styles.notificationBadge} />
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.iconButton}
                            onPress={() => router.push('/profile')}
                        >
                            <MaterialIcons name="account-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.headerContent}>
                    <View style={styles.greetingContainer}>
                        <Text style={styles.welcomeText}>Welcome Back,</Text>
                        <Text style={styles.userName}>{userName}!</Text>
                        <View style={styles.taglineWrapper}>
                            <Text style={styles.tagline}>
                                Reuniting Lost Items with Their Rightful Owners
                            </Text>
                        </View>
                    </View>
                </View>
            </LinearGradient>

            <View style={styles.mainContent}>
                
                {/* Lost and Found Buttons */}
                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={[styles.actionBox, styles.lostBox]}
                        onPress={() => router.push('/lost')}
                    >
                        <LinearGradient
                            colors={['#ff6b6b', '#ff8787']}
                            style={styles.boxGradient}
                        >
                            <View style={styles.boxContent}>
                                <View style={styles.boxIconContainer}>
                                    <MaterialIcons name="search" size={32} color="#fff" />
                                </View>
                                <View style={styles.boxTextContainer}>
                                    <Text style={styles.boxTitle}>LOST SOMETHING?</Text>
                                    <Text style={styles.boxSubtitle}>Report a lost item here</Text>
                                </View>
                                <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.actionBox, styles.foundBox]}
                        onPress={() => router.push('/found')}
                    >
                        <LinearGradient
                            colors={['#4ecdc4', '#45b7af']}
                            style={styles.boxGradient}
                        >
                            <View style={styles.boxContent}>
                                <View style={styles.boxIconContainer}>
                                    <MaterialIcons name="add-circle-outline" size={32} color="#fff" />
                                </View>
                                <View style={styles.boxTextContainer}>
                                    <Text style={styles.boxTitle}>FOUND SOMETHING?</Text>
                                    <Text style={styles.boxSubtitle}>Report a found item here</Text>
                                </View>
                                <MaterialIcons name="arrow-forward" size={24} color="#fff" />
                            </View>
                        </LinearGradient>
                    </TouchableOpacity>
                </View>

                {/* Stats Section */}
                

                {/* Reviews Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionTitleContainer}>
                        <MaterialIcons name="star" size={24} color="#2c3e50" />
                        <Text style={styles.sectionTitle}>User Reviews</Text>
                    </View>
                    <ScrollView 
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.reviewsScroll}
                    >
                        {reviews.map((review) => (
                            <View key={review.id} style={styles.reviewCard}>
                                <View style={styles.reviewHeader}>
                                    <MaterialIcons name="account-circle" size={40} color="#2c3e50" />
                                    <View style={styles.reviewerInfo}>
                                        <Text style={styles.reviewerName}>{review.name}</Text>
                                        <View style={styles.ratingContainer}>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <MaterialIcons 
                                                    key={star} 
                                                    name="star" 
                                                    size={16} 
                                                    color="#ffd700" 
                                                />
                                            ))}
                                        </View>
                                    </View>
                                </View>
                                <Text style={styles.reviewText}>{review.text}</Text>
                            </View>
                        ))}
                    </ScrollView>

                    <View style={styles.reviewDivider} />

                    <View style={styles.writeReviewContainer}>
                        <Text style={styles.writeReviewTitle}>Write a Review</Text>
                        <View style={styles.ratingContainer}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity 
                                    key={star} 
                                    onPress={() => setUserRating(star)}
                                >
                                    <MaterialIcons 
                                        name={userRating >= star ? "star" : "star-border"} 
                                        size={32} 
                                        color="#ffd700" 
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TextInput
                            style={styles.reviewInput}
                            placeholder="Share your experience..."
                            value={userReview}
                            onChangeText={setUserReview}
                            multiline
                            numberOfLines={3}
                            placeholderTextColor="#94a3b8"
                        />
                        <TouchableOpacity 
                            style={[
                                styles.postButton,
                                (!userRating || !userReview.trim()) && styles.postButtonDisabled
                            ]}
                            onPress={handlePostReview}
                            disabled={!userRating || !userReview.trim()}
                        >
                            <Text style={styles.postButtonText}>Post Review</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionTitleContainer}>
                        <Ionicons name="stats-chart" size={24} color="#2c3e50" />
                        <Text style={styles.sectionTitle}>Weekly Success</Text>
                    </View>
                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>42</Text>
                            <Text style={styles.statLabel}>Items Reunited</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={styles.statNumber}>1.2K</Text>
                            <Text style={styles.statLabel}>Active Users</Text>
                        </View>
                    </View>
                </View>
                {/* Help Section */}
                <View style={styles.sectionContainer}>
                    <View style={styles.sectionTitleContainer}>
                        <Ionicons name="help-circle-outline" size={24} color="#2c3e50" />
                        <Text style={styles.sectionTitle}>Need Help?</Text>
                    </View>
                    <View style={styles.helpOptions}>
                        <TouchableOpacity 
                            style={styles.helpButton}
                            onPress={() => router.push('/chat-support')}
                        >
                            <LinearGradient
                                colors={['#0f172a', '#334155']}
                                style={styles.helpButtonGradient}
                            >
                                <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
                                <Text style={styles.helpButtonText}>Chat Support</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={styles.helpButton}
                            onPress={() => router.push('/working')}
                        >
                            <LinearGradient
                                colors={['#1e293b', '#475569']}
                                style={styles.helpButtonGradient}
                            >
                                <Ionicons name="construct-outline" size={24} color="#fff" />
                                <Text style={styles.helpButtonText}>Working</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
            
            {/* Enhanced Footer */}
            <View style={styles.footer}>
                <LinearGradient
                    colors={['#0f172a', '#1e293b']}
                    style={styles.footerGradient}
                >
                    <View style={styles.footerContent}>
                        <View style={styles.footerColumn}>
                            <Text style={styles.footerTitle}>Quick Links</Text>
                           
                            <TouchableOpacity style={styles.footerLink}>
                                <Text style={styles.footerLinkText}>FAQ</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.footerDivider} />
                        <View style={styles.footerColumn}>
                            <Text style={styles.footerTitle}>Support</Text>
                            <TouchableOpacity style={styles.footerLink}>
                                <Text style={styles.footerLinkText}>Report Issue</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <View style={styles.copyrightContainer}>
                        <Text style={styles.copyright}>© 2025 Lost & Found. All rights reserved.</Text>
                    </View>
                </LinearGradient>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f6fa',
    },
    contentContainer: {
        flexGrow: 1,
    },
    headerContainer: {
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        paddingBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
        position: 'relative',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        opacity: 0.5,
    },
    navbar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    logoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    logoText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.5,
    },
    navIcons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 15,
    },
    iconButton: {
        position: 'relative',
    },
    notificationBadge: {
        position: 'absolute',
        top: -5,
        right: -5,
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#ff6b6b',
    },
    headerContent: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 16,
    },
    greetingContainer: {
        gap: 8,  // Consistent spacing between elements
    },
    welcomeText: {
        fontSize: 16,
        color: '#94a3b8',
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    userName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffffff',
        letterSpacing: 0.7,
        marginBottom: 4,
    },
    taglineWrapper: {
        marginTop: 8,
    },
    tagline: {
        fontSize: 15,
        color: '#cbd5e1',
        letterSpacing: 0.3,
        lineHeight: 22,
        opacity: 0.9,
    },
    mainContent: {
        padding: 20,
    },
    sectionContainer: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 3,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
        gap: 8,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#2c3e50',
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    statItem: {
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: '#e0e0e0',
    },
    statNumber: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#2c3e50',
    },
    statLabel: {
        fontSize: 14,
        color: '#7f8c8d',
        marginTop: 4,
    },
    buttonContainer: {
        marginTop: 25,
        width: '100%',
        marginBottom: 30,
    },
    lostBox: {
        backgroundColor: '#ff6b6b', // Red for lost items
    },
    foundBox: {
        backgroundColor: '#4ecdc4', // Teal for found items
    },
    actionBox: {
        borderRadius: 15,
        marginBottom: 15,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    boxGradient: {
        padding: 20,
    },
    boxContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    boxIconContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 10,
        borderRadius: 12,
    },
    boxTextContainer: {
        flex: 1,
        marginHorizontal: 15,
    },
    boxTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    boxSubtitle: {
        fontSize: 14,
        color: '#fff',
        opacity: 0.9,
        marginTop: 4,
    },
    updatesScroll: {
        marginTop: 10,
    },
    updateCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginRight: 15,
        width: width * 0.7,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    updateCardAlert: {
        backgroundColor: '#fff5f5',
    },
    updateIconContainer: {
        marginBottom: 10,
    },
    updateTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 5,
    },
    updateText: {
        fontSize: 14,
        color: '#7f8c8d',
        marginBottom: 10,
    },
    updateTime: {
        fontSize: 12,
        color: '#95a5a6',
    },
    helpOptions: {
        flexDirection: 'row',
        gap: 15,
    },
    helpButton: {
        flex: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    helpButtonGradient: {
        padding: 20,
        alignItems: 'center',
    },
    helpButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '500',
        marginTop: 10,
    },
    footer: {
        marginTop: 15,
        width: '100%',  // Full width
        backgroundColor: '#0f172a',  // Matching background color
    },
    footerGradient: {
        width: '100%',  // Ensure gradient fills full width
        paddingVertical: 20,
    },
    footerContent: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.1)',
        paddingBottom: 15,
    },
    footerColumn: {
        flex: 1,
        alignItems: 'center',
    },
    footerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#ffffff',
        marginBottom: 10,
        textAlign: 'center',
    },
    footerDivider: {
        width: 1,
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        marginHorizontal: 10,
    },
    footerLink: {
        marginBottom: 8,
        width: '100%',
        alignItems: 'center',
    },
    footerLinkText: {
        fontSize: 14,
        color: '#cbd5e1',
        textAlign: 'center',
    },
    copyrightContainer: {
        paddingTop: 15,
        paddingHorizontal: 16,
    },
    copyright: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
    },
    reviewsScroll: {
        marginTop: 10,
    },
    reviewCard: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 15,
        marginRight: 15,
        width: width * 0.8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    reviewHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    reviewerInfo: {
        marginLeft: 10,
    },
    reviewerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#2c3e50',
        marginBottom: 2,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 4,
    },
    reviewText: {
        fontSize: 14,
        color: '#64748b',
        lineHeight: 20,
        fontStyle: 'italic',
    },
    reviewInput: {
        backgroundColor: '#f8fafc',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        minHeight: 100,
        textAlignVertical: 'top',
    },
    postButton: {
        backgroundColor: '#3b82f6',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignSelf: 'flex-end',
    },
    postButtonDisabled: {
        backgroundColor: '#94a3b8',
        opacity: 0.7,
    },
    postButtonText: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: '600',
    },
    reviewDivider: {
        height: 1,
        backgroundColor: '#e2e8f0',
        marginVertical: 20,
    },
    writeReviewContainer: {
        paddingTop: 10,
    },
    writeReviewTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#1f2937',
    },
});

export default HomePage;