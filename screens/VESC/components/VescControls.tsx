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
  onStartStop,
  onRPMchange,
  targetRPM
}) => {
  return (
    <View style={styles.controlsContainer}>
      {/*
      <View style={styles.controlGroup}>
        <Text style={{ color: 'black' }}>Duty Cycle: {(dutyCycle * 100).toFixed(1)}%</Text>
        <Slider  style = {styles.slider}
          value={dutyCycle}
          onValueChange={onDutyCycleChange}
          minimumValue={-1}
          maximumValue={1}
          step={0.01}
       
        />
      </View>
    
      <View style={styles.controlGroup}>
        <Text style={{ color: 'black' }}>Current: {targetCurrent.toFixed(1)} A</Text>
        <Slider    style = {styles.slider}
          value={targetCurrent}
          onValueChange={onCurrentChange}
          minimumValue={-100}
          maximumValue={100}
          step={1}
         
        />
      </View>
    */}
    
      <View style={styles.controlGroup}>
        <Text style={{ color: 'black' }}>RPM: {targetRPM.toFixed(1)} </Text>
        <Slider    style = {styles.slider}
          value={targetRPM}
          onValueChange={onRPMchange}
          minimumValue={-50000}
          maximumValue={50000}
          step={1}
         
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