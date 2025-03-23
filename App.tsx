import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Page1 from './src/screens/Page1';
import Page2 from './src/screens/Page2';
import Page3 from './src/screens/Page3';
import { useVescState } from './src/VESC/functions/VescStateManager';

// Define a simple command type
export interface Command {
  type: string;  // 'direction' or 'voice'
  value: string; // The actual command like 'left', 'go', etc.
  angle?: number; // Optional angle for direction commands
  timestamp: number;
}

// App.tsx
export default function App() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'VESC' },
    { key: 'second', title: 'Camera' },
    { key: 'third', title: 'GPS' },
  ]);
  
  // Create a single shared state instance
  const sharedVescState = useVescState();
  
  // Create a shared command buffer
  const [commandBuffer, setCommandBuffer] = useState<Command[]>([]);
  
  // Function to add a command to the buffer
  const addCommand = (command: Omit<Command, 'timestamp'>) => {
    const newCommand: Command = {
      ...command,
      timestamp: Date.now()
    };
    setCommandBuffer(prev => [...prev, newCommand]);
  };
  
  // Function to remove a command from the buffer
  const removeCommand = (index: number) => {
    setCommandBuffer(prev => prev.filter((_, i) => i !== index));
  };
  
  // Custom render function that passes the shared state and command buffer
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <Page1 
          vescState={sharedVescState} 
          commandBuffer={commandBuffer}
          removeCommand={removeCommand}
        />;
      case 'second':
        return <Page2
          addCommand={addCommand}
          commandBuffer={commandBuffer}
        />;
      case 'third':
        return <Page3 
          vescState={sharedVescState} 
        />;
      default:
        return null;
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      swipeEnabled={true} // Allows swiping
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