import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import "./global.css";
import { MainScreen } from './src/components/home/MainScreen';

/**
 * App Entry Point
 * 保持简洁，仅作为 Provider 的容器
 */
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <MainScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
