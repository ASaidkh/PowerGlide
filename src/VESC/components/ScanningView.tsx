import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { styles } from '../styles/vescStyles';

interface ScanningViewProps {
  devices: any[];
  isScanning?: boolean;
  onScanStart?: () => void;
  onConnect: (device: any) => void;
}

export const ScanningView: React.FC<ScanningViewProps> = ({
  devices,
  isScanning = false,
  onScanStart,
  onConnect
}) => {
  return (
    <View style={styles.scanContainer}>
      <Icon name="microchip" size={75} color="black" style={styles.icon} />
      <Text style={styles.title}>VESC Monitor</Text>

      <TouchableOpacity 
        style={styles.button} 
        onPress={onScanStart}
      >
        <Text style={styles.buttonText}>
          {isScanning ? 'Scanning...' : 'Scan for Devices'}
        </Text>
      </TouchableOpacity>

      <View style={styles.deviceList}>
        {devices.map(device => (
          <TouchableOpacity
            key={device.id}
            style={styles.deviceItem}
            onPress={() => onConnect(device)}
          >
            <Text style={styles.deviceText}>{device.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};