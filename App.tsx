import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, useWindowDimensions, View, Text } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Page1 from './src/screens/Page1';
import Page2 from './src/screens/Page2';
import Page3 from './src/screens/Page3';
import { useVescState } from './src/VESC/functions/VescStateManager';
import useVoskRecognition from './src/hooks/UseVoskRecognition';
import { processCommand } from './src/utils/CommandHandler';

// Define a simple command type
export interface Command {
  type: string;  // 'direction' or 'voice'
  value: string; // The actual command like 'left', 'go', etc.
  angle?: number; // Optional angle for direction commands
  timestamp: number;
}

export default function App() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'VESC' },
    { key: 'second', title: 'CAMERA' },
    { key: 'third', title: 'JOYSTICK' },
  ]);

  // Shared state for VESC
  const sharedVescState = useVescState();

  // Custom render function that passes shared state and command buffer
  const renderScene = ({ route }) => {
    //console.log(`Rendering ${route.key}, addCommand:`, addCommand); // Debug Log
    switch (route.key) {
      case 'first':
        return <Page1 vescState={sharedVescState}/>;
      case 'second':
        return <Page2 vescState={sharedVescState} />;
      case 'third':
        return <Page3 vescState={sharedVescState} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
     
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        swipeEnabled={true}
        renderTabBar={props => (
          <TabBar
            {...props}
            style={styles.tabBar}
            indicatorStyle={{ backgroundColor: 'black' }}
            labelStyle={{ color: 'white', fontWeight: 'bold' }}
            activeColor="white"
            inactiveColor="gray"
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'black',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
