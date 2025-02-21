import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { styles } from '../styles/vescStyles';

export const VescControls = ({
  dutyCycle,
  targetCurrent,
  isRunning,
  onDutyCycleChange,
  onCurrentChange,
  onStartStop
}) => {
  return (
    <View style={styles.controlsContainer}>
      <View style={styles.controlGroup}>
        <Text style={{ color: 'black' }}>Duty Cycle: {(dutyCycle * 100).toFixed(1)}%</Text>
        <Slider
          value={dutyCycle}
          onValueChange={onDutyCycleChange}
          minimumValue={-1}
          maximumValue={1}
          step={0.01}
        />
      </View>

     

      <TouchableOpacity 
        style={[styles.controlButton, isRunning ? styles.stopButton : styles.goButton]}
        onPress={onStartStop}
      >
        <Text style={styles.buttonText}>
          {isRunning ? 'STOP' : 'GO'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};