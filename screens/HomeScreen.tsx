import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useFocusEffect, RouteProp } from '@react-navigation/native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as ScreenOrientation from 'expo-screen-orientation';
import { RootStackParamList } from '../App';

type HomeScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Home'>;
  route: RouteProp<RootStackParamList, 'Home'>;
};

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation, route }) => {
  const [videoUri, setVideoUri] = useState<string>('');
  const [pdfUri, setPdfUri] = useState<string>('');
  const [filesLoaded, setFilesLoaded] = useState(false);
  const [rememberedVideoUri, setRememberedVideoUri] = useState<string>('');
  const [rememberedPdfUri, setRememberedPdfUri] = useState<string>('');
  const [videoFailed, setVideoFailed] = useState<boolean>(false);
  const [pdfFailed, setPdfFailed] = useState<boolean>(false);

  const preloadFiles = async () => {
    try {
      let foundVideo = false;
      let foundPDF = false;

      // Check multiple app-accessible directories
      const dirsToCheck = [
        FileSystem.documentDirectory, // App's document directory
        FileSystem.cacheDirectory,    // App's cache directory
      ];

      console.log('App directories:');
      console.log('Document Directory:', FileSystem.documentDirectory);
      console.log('Cache Directory:', FileSystem.cacheDirectory);

      for (const dir of dirsToCheck) {
        if (!dir) continue;
        
        try {
          const files = await FileSystem.readDirectoryAsync(dir);
          console.log(`Files in ${dir}:`, files);
          
          if (!foundVideo) {
            const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
            const firstVideo = files.find(file => 
              videoExtensions.some(ext => file.toLowerCase().endsWith(ext))
            );
            
            if (firstVideo) {
              const videoPath = dir + firstVideo;
              setVideoUri(videoPath);
              foundVideo = true;
              console.log('Found video:', videoPath);
            }
          }

          if (!foundPDF) {
            const firstPDF = files.find(file => 
              file.toLowerCase().endsWith('.pdf')
            );
            
            if (firstPDF) {
              const pdfPath = dir + firstPDF;
              setPdfUri(pdfPath);
              foundPDF = true;
              console.log('Found PDF:', pdfPath);
            }
          }
        } catch (dirError) {
          console.log(`Error reading directory ${dir}:`, dirError);
        }
      }

      setFilesLoaded(true);

      if (!foundVideo && !foundPDF) {
        Alert.alert(
          'No Files Found', 
          `Please copy your files to the app via iTunes File Sharing:\n\n• video.mp4 (your video)\n• document.pdf (your PDF)`
        );
      }
    } catch (error) {
      console.log('Error preloading files:', error);
      Alert.alert('Error', 'Failed to scan app files');
      setFilesLoaded(true);
    }
  };


  useEffect(() => {
    // Lock orientation to landscape
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    
    // Preload files
    preloadFiles();

    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  // Listen for when user returns from video/PDF screens
  useFocusEffect(
    React.useCallback(() => {
      // Check if we're returning with failure flags
      if (route.params?.videoFailed) {
        setVideoFailed(true);
        setRememberedVideoUri(''); // Clear remembered video
      }
      if (route.params?.pdfFailed) {
        setPdfFailed(true);
        setRememberedPdfUri(''); // Clear remembered PDF
      }
    }, [route.params])
  );

  const pickAndPlayVideo = async () => {
    // If we already have a remembered video and it didn't fail, use it
    if (rememberedVideoUri && !videoFailed) {
      navigation.navigate('Video', { videoUri: rememberedVideoUri });
      return;
    }

    Alert.alert(
      'Select Video Source',
      'Choose where to pick your video from',
      [
        {
          text: 'Gallery',
          onPress: async () => {
            try {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Videos,
                allowsEditing: false,
                quality: 1,
              });

              if (!result.canceled && result.assets[0]) {
                setRememberedVideoUri(result.assets[0].uri);
                navigation.navigate('Video', { videoUri: result.assets[0].uri });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to pick video from gallery');
            }
          }
        },
        {
          text: 'Files',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: 'video/*',
                copyToCacheDirectory: true,
              });

              if (!result.canceled && result.assets[0]) {
                setRememberedVideoUri(result.assets[0].uri);
                navigation.navigate('Video', { videoUri: result.assets[0].uri });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to pick video file');
            }
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const pickAndViewPDF = async () => {
    // If we already have a remembered PDF and it didn't fail, use it
    if (rememberedPdfUri && !pdfFailed) {
      navigation.navigate('PDF', { pdfUri: rememberedPdfUri });
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setRememberedPdfUri(result.assets[0].uri);
        navigation.navigate('PDF', { pdfUri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick PDF file');
    }
  };

  return (
    <ImageBackground 
      source={require('../assets/bg.jpg')} 
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickAndPlayVideo}
        >
          <Image 
            source={require('../assets/btn2.png')} 
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.button} 
          onPress={pickAndViewPDF}
        >
          <Image 
            source={require('../assets/btn1.png')} 
            style={styles.buttonImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
      </View>
    </ImageBackground>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  fallbackBackground: {
    backgroundColor: '#2c3e50',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
  },
  button: {
    marginHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonImage: {
    width: 260,
    height: 156,
  },
  disabledImage: {
    opacity: 0.3,
  },
  fallbackButton: {
    width: 200,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  videoButton: {
    backgroundColor: '#e74c3c',
  },
  pdfButton: {
    backgroundColor: '#3498db',
  },
  disabledButton: {
    opacity: 0.3,
  },
  buttonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeScreen;