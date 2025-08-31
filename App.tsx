import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import HomeScreen from './screens/HomeScreen';
import VideoScreen from './screens/VideoScreen';
import PDFScreen from './screens/PDFScreen';

export type RootStackParamList = {
  Home: { videoFailed?: boolean; pdfFailed?: boolean } | undefined;
  Video: { videoUri: string };
  PDF: { pdfUri: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="Video" 
          component={VideoScreen} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="PDF" 
          component={PDFScreen} 
          options={{ headerShown: false }} 
        />
      </Stack.Navigator>
      <StatusBar style="auto" />
    </NavigationContainer>
  );
}
