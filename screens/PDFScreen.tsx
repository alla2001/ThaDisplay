import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Dimensions,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as FileSystem from 'expo-file-system';
import { RootStackParamList } from '../App';

type PDFScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'PDF'>;
  route: RouteProp<RootStackParamList, 'PDF'>;
};

const PDFScreen: React.FC<PDFScreenProps> = ({ navigation, route }) => {
  const { pdfUri } = route.params;
  const [useNativePDF, setUseNativePDF] = useState(true);
  const [pdfData, setPdfData] = useState<string>('');

  useEffect(() => {
    // Ensure landscape orientation
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    
    // Try native PDF first, fallback to WebView
    tryNativePDF();
    
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, []);

  const tryNativePDF = async () => {
    try {
      // Try to import react-native-pdf
      const Pdf = await import('react-native-pdf');
      console.log('Native PDF module available');
      setUseNativePDF(true);
    } catch (error) {
      console.log('Native PDF not available, using WebView fallback');
      setUseNativePDF(false);
      loadPDFForWebView();
    }
  };

  const loadPDFForWebView = async () => {
    try {
      // Read PDF as base64 for WebView
      const base64Data = await FileSystem.readAsStringAsync(pdfUri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      setPdfData(base64Data);
    } catch (error) {
      console.log('Error loading PDF for WebView:', error);
      Alert.alert('PDF Error', 'Failed to load PDF file', [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home', { pdfFailed: true })
        }
      ]);
    }
  };

  const renderNativePDF = () => {
    try {
      const Pdf = require('react-native-pdf').default;
      return (
        <Pdf
          source={{ uri: pdfUri }}
          style={styles.pdf}
          onLoadComplete={(numberOfPages: number, filePath: string) => {
            console.log(`Number of pages: ${numberOfPages}`);
          }}
          onPageChanged={(page: number, numberOfPages: number) => {
            console.log(`Current page: ${page}`);
          }}
          onError={(error: any) => {
            console.log('Native PDF error:', error);
            Alert.alert('PDF Error', 'Failed to load PDF file', [
              {
                text: 'OK',
                onPress: () => navigation.navigate('Home', { pdfFailed: true })
              }
            ]);
          }}
          onPressLink={(link: string) => {
            console.log(`Link pressed: ${link}`);
          }}
        />
      );
    } catch (error) {
      console.log('Failed to render native PDF:', error);
      setUseNativePDF(false);
      loadPDFForWebView();
      return null;
    }
  };

  const renderWebViewPDF = () => {
    return (
      <View style={styles.fallbackContainer}>
        <Text style={styles.fallbackTitle}>PDF Viewer</Text>
        <Text style={styles.fallbackText}>
          PDF viewing in Expo Go is limited. The PDF file has been selected:
        </Text>
        <Text style={styles.fileName}>{pdfUri.split('/').pop()}</Text>
        
        <TouchableOpacity 
          style={styles.shareButton}
          onPress={async () => {
            try {
              const { default: Sharing } = await import('expo-sharing');
              await Sharing.shareAsync(pdfUri);
            } catch (error) {
              Alert.alert('Share Error', 'Cannot share PDF file');
            }
          }}
        >
          <Text style={styles.shareButtonText}>Share/Open PDF</Text>
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          This will open the PDF in your device's default PDF viewer or share it with other apps.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {useNativePDF ? renderNativePDF() : (pdfData ? renderWebViewPDF() : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading PDF...</Text>
        </View>
      ))}
      
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  pdf: {
    flex: 1,
    width,
    height,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  loadingText: {
    fontSize: 18,
    color: '#333',
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#f5f5f5',
  },
  fallbackTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  fallbackText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 30,
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    textAlign: 'center',
  },
  shareButton: {
    backgroundColor: '#3498db',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  helpText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 300,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: 20,
    right: 20,
  },
  backButton: {
    backgroundColor: 'rgba(231, 76, 60, 0.8)',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PDFScreen;