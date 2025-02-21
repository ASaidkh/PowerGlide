import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { styles } from '../styles/vescStyles';
import { LogData } from '../types/VescTypes';

interface LoggingControlsProps {
  isLogging: boolean;
  logData: LogData[];
  onToggleLogging: () => void;
}

export const LoggingControls: React.FC<LoggingControlsProps> = ({
  isLogging,
  logData,
  onToggleLogging
}) => {
  return (
    <View style={styles.loggingContainer}>
      <Text style={styles.subtitle}>Logging</Text>
      <TouchableOpacity 
        style={[styles.controlButton, isLogging ? styles.stopButton : styles.goButton]}
        onPress={onToggleLogging}
      >
        <Text style={styles.buttonText}>
          {isLogging ? 'Stop Logging' : 'Start Logging'}
        </Text>
      </TouchableOpacity>

      {logData.slice(-5).map((entry, index) => (
        <View key={index} style={styles.logEntry}>
          <Text style={styles.logText}>
            {entry.timestamp.toLocaleTimeString()}: {entry.values.join(', ')}
          </Text>
        </View>
      ))}
    </View>
  );
};