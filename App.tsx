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
    { key: 'second', title: 'Camera' },
    { key: 'third', title: 'GPS' },
  ]);

  // Shared state for VESC
  const sharedVescState = useVescState();

  // Function to add a command to the buffer
  const addCommand = useCallback((command: Omit<Command, 'timestamp'>) => {//I wrapped this is useCallback
    console.log("addCommand function is being called with:", command); // Debug Log
    const newCommand: Command = {
      ...command,
      timestamp: Date.now()
    };
    setCommandBuffer(prev => [...prev, newCommand]);
  }, []);
  
  // Command buffer for storing voice and movement commands
  const [commandBuffer, setCommandBuffer] = useState<Command[]>([]);
  const [command, setCommand] = useState({ voice: '', headDirection: '', headAngle: 0 });

  // Vosk voice recognition hook
  const { result, recognizing, modelLoaded, loadModel, startRecognition } = useVoskRecognition();

  // Function to handle head movement (simulated)
  const handleHeadMovement = (direction: string, angle: number) => {
    setCommand((prev) => ({ ...prev, headDirection: direction, headAngle: angle }));
  };

  // Effect to update command state with recognized voice command
  useEffect(() => {
    console.log("Effect triggered, result:", result);
    if (result) {
      setCommand((prev) => ({ ...prev, voice: result }));
      processCommand(command.headDirection, command.headAngle, result);
      addCommand({ type: 'voice', value: result });
    }
  }, [result, addCommand]);

  // Function to remove a command from the buffer
  const removeCommand = (index: number) => {
    setCommandBuffer(prev => prev.filter((_, i) => i !== index));
  };

  // Custom render function that passes shared state and command buffer
  const renderScene = ({ route }) => {
    console.log(`Rendering ${route.key}, addCommand:`, addCommand); // Debug Log
    switch (route.key) {
      case 'first':
        return <Page1 vescState={sharedVescState} commandBuffer={commandBuffer} removeCommand={removeCommand} />;
      case 'second':
        return <Page2 addCommand={addCommand} commandBuffer={commandBuffer} />;
      case 'third':
        return <Page3 vescState={sharedVescState} />;
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <View>
        <Text>Voice Command: {command.voice}</Text>
        <Text>Head Direction: {command.headDirection}</Text>
        <Text>Head Angle: {command.headAngle}</Text>
        {modelLoaded ? (
          <Text onPress={startRecognition}>Start Recognition</Text>
        ) : (
          <Text onPress={loadModel}>Load Model</Text>
        )}
      </View>
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
