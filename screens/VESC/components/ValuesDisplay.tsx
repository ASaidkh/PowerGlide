import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles/vescStyles';
import { VescValues } from '../types/VescTypes';

interface ValuesDisplayProps {
  values: VescValues;
}

const renderValue = (label: string, value: number, unit: string = '') => (
  <View style={styles.valueRow}>
    <Text style={styles.valueLabel}>{label}:</Text>
    <Text style={styles.valueText}>{value} {unit}</Text>
  </View>
);

export const ValuesDisplay: React.FC<ValuesDisplayProps> = ({ values }) => {
  return (
    <View style={styles.valuesContainer}>
      <Text style={styles.subtitle}>Real-time Values</Text>
      {renderValue('Temperature MOSFET', values.tempMosfet, '°C')}
      {renderValue('Temperature Motor', values.tempMotor, '°C')}
      {renderValue('Motor Current', values.currentMotor, 'A')}
      {renderValue('Input Current', values.currentInput, 'A')}
      {renderValue('Duty Cycle', values.dutyCycleNow * 100, '%')}
      {renderValue('RPM', values.rpm)}
      {renderValue('Voltage', values.voltage, 'V')}
      {renderValue('Amp Hours', values.ampHours, 'Ah')}
      {renderValue('Amp Hours Charged', values.ampHoursCharged, 'Ah')}
    </View>
  );
};