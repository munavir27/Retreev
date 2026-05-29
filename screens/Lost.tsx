import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Alert, Platform, Modal, Keyboard, KeyboardAvoidingView, ActionSheetIOS
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

type RootStackParamList = {
  Home: undefined;
  Lost: undefined;
  Found: undefined;
  SignInSignUp: undefined;
};

type LostScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Lost'
>;

type LocationModalProps = {
  visible: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onSearch: () => void;
  onCurrentLocation: () => void;
};

type Location = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

type Coordinate = {
  latitude: number;
  longitude: number;
};

type ImageInfo = {
  uri: string;
  assets?: Array<{ uri: string }>;
  canceled?: boolean;
};

type LostItem = {
  id: string;
  created_at: string;
  user_id: string;
  item_name: string;
  category: string;
  description: string;
  date_lost: string;
  contact_details: string;
  photos: string[];
  location: {
    latitude: number;
    longitude: number;
  };
  status: 'active' | 'found' | 'closed';
  updated_at: string;
};

type PhotoSource = 'camera' | 'library';

// Make sure bucket name is consistent
const bucketName = 'lost-items-photos';

const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in km
};

const LocationModal: React.FC<LocationModalProps> = ({ 
  visible, 
  onClose, 
  searchQuery, 
  onSearchChange, 
  onSearch, 
  onCurrentLocation 
}) => (
  <Modal
    animationType="slide"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.modalContainer}
    >
      <TouchableOpacity 
        style={styles.modalOverlay} 
        activeOpacity={1} 
        onPress={() => Keyboard.dismiss()}
      >
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select Location Method</Text>
          
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search location"
              value={searchQuery}
              onChangeText={onSearchChange}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
              blurOnSubmit={true}
            />
            <TouchableOpacity 
              style={styles.searchButton}
              onPress={onSearch}
            >
              <Text style={styles.buttonText}>Search</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.modalButton} 
            onPress={onCurrentLocation}
          >
            <Text style={styles.modalButtonText}>Use Current Location</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.modalButton, styles.cancelButton]} 
            onPress={onClose}
          >
            <Text style={styles.modalButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  </Modal>
);

const LostItemPage: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const router = useRouter();
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [contactDetails, setContactDetails] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [location, setLocation] = useState<Location | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Coordinate | null>(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const mapRef = useRef<MapView | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categories = ['Electronics', 'Gadgets', 'Clothing', 'Documents', 'Wallet', 'Keys', 'Other'];

  useEffect(() => {
    (async () => {
      if (Platform.OS !== 'web') {
        const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
        const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();

        if (mediaStatus !== 'granted' || cameraStatus !== 'granted' || locationStatus !== 'granted') {
          Alert.alert('Permission Required', 'Enable camera, gallery, and location permissions.');
          return;
        }
      }
    })();
  }, []);

  const uploadImage = async (uri: string): Promise<string> => {
    try {
      console.log('Starting image upload process...');
      console.log('Image URI:', uri);

      // Ensure the URI is valid and accessible
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }

      // Convert the image to a blob
      const blob = await response.blob();
      console.log('Blob created:', blob);

      // Temporarily return the local URI instead of uploading to Supabase
      return uri;

      /* Commenting out Supabase upload code
      // Get the current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication required for upload');
      }

      // Generate a unique filename
      const fileExt = blob.type.split('/')[1] || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `lost/${session.user.id}/${timestamp}_${randomString}.${fileExt}`;
      console.log('Generated filename:', fileName);

      // Upload the image to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('lost-items-photos')
        .upload(fileName, blob, {
          contentType: blob.type,
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from('lost-items-photos')
        .getPublicUrl(fileName);

      console.log('Public URL generated:', publicUrl);
      return publicUrl;
      */

    } catch (error: any) {
      console.error('Upload error details:', error);
      throw new Error(error?.message || 'Failed to upload image');
    }
  };

  const ensureFileUri = (uri: string): string => {
    if (!uri.startsWith('file://')) {
      return `file://${uri}`;
    }
    return uri;
  };

  const testImageAccess = async (uri: string) => {
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('Image is accessible. Blob:', blob);
      return true;
    } catch (error) {
      console.error('Image access error:', error);
      return false;
    }
  };

  const handlePhotoUpload = async () => {
    try {
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            options: ['Cancel', 'Take Photo', 'Choose from Library'],
            cancelButtonIndex: 0,
          },
          async (buttonIndex) => {
            if (buttonIndex === 1) {
              await takePhoto();
            } else if (buttonIndex === 2) {
              await pickFromLibrary();
            }
          }
        );
      } else {
        Alert.alert(
          'Add Photo',
          'Choose a photo source',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Take Photo', onPress: takePhoto },
            { text: 'Choose from Library', onPress: pickFromLibrary },
          ]
        );
      }
    } catch (error) {
      console.error('Photo selection error:', error);
      Alert.alert('Error', 'Failed to handle photo selection. Please try again.');
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = ensureFileUri(selectedAsset.uri); // Ensure the URI starts with 'file://'
        console.log('Selected image URI:', uri);

        // Test if the URI is accessible
        const isAccessible = await testImageAccess(uri);
        if (!isAccessible) {
          throw new Error('Image URI is not accessible');
        }

        // Add the URI to the photos state
        setPhotos([...photos, uri]);
      }
    } catch (error) {
      console.error('Photo library error:', error);
      Alert.alert('Error', 'Failed to select photo from library. Please try again.');
    }
  };

  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        const uri = ensureFileUri(selectedAsset.uri); // Ensure the URI starts with 'file://'
        console.log('Camera photo URI:', uri);

        // Test if the URI is accessible
        const isAccessible = await testImageAccess(uri);
        if (!isAccessible) {
          throw new Error('Image URI is not accessible');
        }

        // Add the URI to the photos state
        setPhotos([...photos, uri]);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    setPhotos(newPhotos);
  };

  const handleMapPress = (event: any) => {
    const coordinate = event.nativeEvent.coordinate as Coordinate;
    setSelectedLocation(coordinate);
    setLocation({
      ...coordinate,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const handleLocationPress = () => {
    setLocationModalVisible(true);
  };

  const handleSearchLocation = useCallback(async () => {
    try {
      Keyboard.dismiss();
      
      if (!searchQuery.trim()) {
        Alert.alert('Error', 'Please enter a location to search');
        return;
      }

      const searchResults = await Location.geocodeAsync(searchQuery.trim());

      if (searchResults.length > 0) {
        const { latitude, longitude } = searchResults[0];
        const newLocation = {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };

        setLocation(newLocation);
        setSelectedLocation({ latitude, longitude });
        setLocationModalVisible(false);
        setSearchQuery('');

        if (mapRef.current) {
          mapRef.current.animateToRegion(newLocation, 1000);
        }
      } else {
        Alert.alert('Error', 'Location not found');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search location. Please try again.');
    }
  }, [searchQuery]);

  const handleCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please enable location permissions to use this feature.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      const newLocation = {
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setLocation(newLocation);
      setSelectedLocation({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude
      });
      setLocationModalVisible(false);

      if (mapRef.current) {
        mapRef.current.animateToRegion(newLocation, 1000);
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location. Please check your location settings.');
    }
  };

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
  }, []);

  const handleCloseModal = useCallback(() => {
    setLocationModalVisible(false);
    setSearchQuery('');
    Keyboard.dismiss();
  }, []);

  const handleSubmit = async () => {
    if (!itemName || !category || !description || !date || !contactDetails || !selectedLocation) {
      Alert.alert('Error', 'Please fill all fields and select a location');
      return;
    }

    try {
      setLoading(true);

      // Create the lost item first
      const { data: lostItem, error: lostError } = await supabase
        .from('lost')
        .insert([{
          user_id: (await supabase.auth.getUser()).data.user?.id,
          item_name: itemName,
          category,
          description,
          date_lost: date,
          contact_details: contactDetails,
          location: selectedLocation,
          status: 'active'
        }])
        .select()
        .single();

      if (lostError) throw lostError;

      // Show success message first
      Alert.alert(
        'Success',
        'Lost item report submitted successfully!',
        [{ 
          text: 'OK',
          onPress: async () => {
            // Check for matches after user acknowledges submission
            await checkForMatches(lostItem);
            router.back();
          }
        }]
      );

    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Failed to submit lost item');
    } finally {
      setLoading(false);
    }
  };

  // Separate function to check matches
  const checkForMatches = async (lostItem: any) => {
    // Check for matches in existing found items
    const { data: foundItems, error: foundError } = await supabase
      .from('found')
      .select('*')
      .eq('status', 'active');

    if (foundError) throw foundError;



    
    // Filter potential matches
    const matches = foundItems?.filter(foundItem => {
      const nameMatch = foundItem.item_name.toLowerCase().includes(itemName.toLowerCase()) ||
                     itemName.toLowerCase().includes(foundItem.item_name.toLowerCase());
      const categoryMatch = foundItem.category === category;
      
      
      const distance = calculateDistance(
        selectedLocation?.latitude ?? 0, // Ensure selectedLocation is not null
        selectedLocation?.longitude ?? 0, // Ensure selectedLocation is not null
        foundItem.location.latitude,
        foundItem.location.longitude
      );
      const locationMatch = distance < 1; // Within 1km

      return (nameMatch && categoryMatch) || (nameMatch && locationMatch);
    });

    if (matches && matches.length > 0) {
      // Create notifications for both users for each match
      for (const match of matches) {
        const notifications = [
          // Notification for lost item owner (current user)
          {
            user_id: lostItem.user_id,
            type: 'match',
            title: 'Potential Match Found',
            message: `Someone found an item that matches your lost ${itemName}!`,
            related_items: { lost_item_id: lostItem.id, found_item_id: match.id },
            read: false,
            created_at: new Date().toISOString()
          },
          // Notification for finder
          {
            user_id: match.user_id,
            type: 'match',
            title: 'Match with Lost Item',
            message: `Your found item matches with someone's lost ${itemName}!`,
            related_items: { lost_item_id: lostItem.id, found_item_id: match.id },
            read: false,
            created_at: new Date().toISOString()
          }
        ];

        // Insert notifications
        for (const notification of notifications) {
          await supabase
            .from('notifications')
            .insert([notification]);
        }
      }

      // Show alert about matches
      Alert.alert(
        'Potential Matches Found!',
        'We found some items that match your lost item. Check your notifications.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate.toISOString().split('T')[0]);
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Report a Lost Item</Text>
        <Text style={styles.subtitle}>Help us locate your missing belongings</Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Item Details</Text>
          <View style={styles.pickerContainer}>
            <Picker selectedValue={category} onValueChange={setCategory} style={styles.picker}>
              <Picker.Item label="Select a Category" value="" />
              {categories.map((cat, index) => <Picker.Item key={index} label={cat} value={cat} />)}
            </Picker>
          </View>

          <TextInput 
            style={[styles.input, styles.elevatedInput]} 
            placeholder="Item Name" 
            value={itemName} 
            onChangeText={setItemName}
            placeholderTextColor="#666" 
          />

          <TextInput 
            style={[styles.input, styles.multilineInput, styles.elevatedInput]} 
            placeholder="Description" 
            value={description} 
            onChangeText={setDescription} 
            multiline 
            placeholderTextColor="#666"
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Date & Contact</Text>
          <TouchableOpacity 
            style={[styles.input, styles.elevatedInput]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={date ? styles.dateText : styles.datePlaceholder}>
              {date || 'Select Date Lost'}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date ? new Date(date) : new Date()}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          <TextInput 
            style={[styles.input, styles.elevatedInput]} 
            placeholder="Contact Details" 
            value={contactDetails} 
            onChangeText={setContactDetails}
            placeholderTextColor="#666" 
          />
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Photos</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={handlePhotoUpload}>
            <Ionicons name="camera" size={24} color="#fff" />
            <Text style={styles.uploadButtonText}>Upload Photos</Text>
          </TouchableOpacity>

          <View style={styles.photosContainer}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoWrapper}>
                <Image source={{ uri: photo }} style={styles.photo} />
                <TouchableOpacity style={styles.removeIcon} onPress={() => removePhoto(index)}>
                  <Ionicons name="close-circle" size={24} color="#ff6b6b" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity style={styles.locationButton} onPress={handleLocationPress}>
            <Ionicons name="location" size={24} color="#fff" />
            <Text style={styles.locationButtonText}>Select Location</Text>
          </TouchableOpacity>

          {location && (
            <View style={styles.mapContainer}>
              <MapView
                ref={mapRef}
                style={styles.map}
                region={location}
                onPress={handleMapPress}
              >
                {selectedLocation && <Marker coordinate={selectedLocation} title="Selected Location" />}
              </MapView>
            </View>
          )}
        </View>

        {/* Police Report Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Report to Authorities</Text>
          <Text style={styles.reportDescription}>
            Lost a valuable item? File a police report for additional security and documentation.
          </Text>
          <TouchableOpacity 
            style={styles.reportButton}
            onPress={() => Alert.alert(
              'Contact Authorities',
              'Would you like to file a police report for this lost item?',
              [
                {
                  text: 'Call Police',
                  onPress: () => {
                    // This would typically use Linking to make a phone call
                    Alert.alert('Connecting', 'Redirecting to emergency services...');
                  },
                  style: 'default'
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                }
              ]
            )}
          >
            <LinearGradient
              colors={['#1e40af', '#1e3a8a']}
              style={styles.reportButtonGradient}
            >
              <View style={styles.reportButtonContent}>
                <MaterialIcons name="local-police" size={24} color="#fff" />
                <Text style={styles.reportButtonText}>File Police Report</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.disabledButton]} 
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Submitting...' : 'Submit Report'}
          </Text>
        </TouchableOpacity>
      </View>

      <LocationModal 
        visible={locationModalVisible}
        onClose={handleCloseModal}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onSearch={handleSearchLocation}
        onCurrentLocation={handleCurrentLocation}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f5f6fa',
  },
  headerContainer: {
    backgroundColor: '#2c3e50',
    padding: 30,
    paddingTop: 30,
    borderBottomLeftRadius: 30,
    //borderBottomRightRadius: 30,
    borderTopRightRadius: 30,
    //borderTopLeftRadius: 30,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#bdc3c7',
    textAlign: 'center',
    marginTop: 5,
  },
  formContainer: {
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 15,
  },
  pickerContainer: {
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    backgroundColor: '#fff',
  },
  picker: {
    height: 50,
  },
  input: {
    height: 50,
    borderColor: '#e0e0e0',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
    color: '#2c3e50',
  },
  multilineInput: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 15,
  },
  uploadButton: {
    backgroundColor: '#4ecdc4',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  photosContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoWrapper: {
    position: 'relative',
  },
  photo: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  map: { 
    width: '100%', 
    height: 200,
    marginVertical: 10,
    borderRadius: 8 
  },
  locationButton: {
    backgroundColor: '#ff6b6b',
    padding: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#2c3e50',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalOverlay: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: '30%',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    position: 'absolute',
    top: '30%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  searchContainer: {
    width: '100%',
    flexDirection: 'row',
    marginBottom: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  searchButton: {
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: '#4ecdc4',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    width: '100%',
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#ff6b6b',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  elevatedInput: {
    backgroundColor: '#fff',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
  },
  mapContainer: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  reportDescription: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 15,
    lineHeight: 20,
  },
  reportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  reportButtonGradient: {
    padding: 16,
  },
  reportButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  reportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dateText: {
    color: '#000',
    fontSize: 16,
    padding: 10,
  },
  datePlaceholder: {
    color: '#666',
    fontSize: 16,
    padding: 10,
  },
});

export default LostItemPage;