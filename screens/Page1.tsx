import React, { useEffect } from 'react';
import { SafeAreaView, View, Alert } from 'react-native';
import { Device } from 'react-native-ble-plx';
import { styles } from './VESC/styles/vescStyles';
import { VescConnectionManager } from './VESC/functions/VescConnectionManager';
import { VescControlManager } from './VESC/functions/VescControlManager';
import { VescControls } from './VESC/components/VescControls';
import { ValuesDisplay } from './VESC/components/ValuesDisplay';
import { LoggingControls } from './VESC/components/LoggingControls';
import { ScanningView } from './VESC/components/ScanningView';
import { Command } from '../App';

interface Page1Props {
  vescState: any;
  commandBuffer: Command[];
  removeCommand: (index: number) => void;
}

const Page1: React.FC<Page1Props> = ({ vescState, commandBuffer, removeCommand }) => {
  const connectionManager = React.useRef(new VescConnectionManager()).current;
  const [controlManager, setControlManager] = React.useState<VescControlManager | null>(null);

  useEffect(() => {
    // Whenever the vescState changes, update the controlManager with the latest state
    if (controlManager) {
      controlManager.updateState(vescState);
    }
  }, [vescState, controlManager]);

  // Pass the command buffer to the control manager whenever it changes
  useEffect(() => {
    if (controlManager) {
      controlManager.updateCommandBuffer(commandBuffer, removeCommand);
    }
  }, [commandBuffer, removeCommand, controlManager]);

  useEffect(() => {
    return () => {
      handleDisconnect();
      connectionManager.destroy();
    };
  }, []);

  const handleStartScan = async () => {
    try {
      vescState.setters.setIsScanning(true);
      await connectionManager.startScanning((device: Device) => {
        vescState.setters.setDevices(prev => {
          if (!prev.find(d => d.id === device.id)) {
            return [...prev, device];
          }
          return prev;
        });
      });
    } catch (error) {
      Alert.alert('Scan Error', 'Failed to start scanning for devices');
    }
  };

  const handleConnect = async (device: Device) => {
    try {
      vescState.setters.setIsScanning(false);
      connectionManager.stopScanning();
      
      const vescCommands = await connectionManager.connect(device);
      const newControlManager = new VescControlManager(
        vescCommands, 
        vescState, 
        commandBuffer, 
        removeCommand
      );
      setControlManager(newControlManager);
      
      vescState.setters.setIsConnected(true);
      
      // Start continuous logging of VESC values
      newControlManager.startContinuousLogging();
      
    } catch (error) {
      Alert.alert('Connection Error', 'Failed to connect to device');
    }
  };
  
  const handleDisconnect = async () => {
    try {
      // Stop logging first
      if (controlManager) {
        controlManager.stopLogging();
      }
      
      await connectionManager.disconnect();
      vescState.setters.setIsConnected(false);
      setControlManager(null);
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {!vescState.states.isConnected ? (
        <ScanningView 
          devices={vescState.states.devices}
          isScanning={vescState.states.isScanning}
          onScanStart={handleStartScan}
          onConnect={handleConnect}
        />
      ) : (
        <View>
          <ValuesDisplay values={vescState.states.vescValues} />
          <VescControls 
            dutyCycle={vescState.states.dutyCycle}
            targetCurrent={vescState.states.targetCurrent}
            RightMotorRPM={vescState.states.RightMotorRPM}
            LeftMotorRPM={vescState.states.LeftMotorRPM}
            isRunning={vescState.states.isRunning}
            onDutyCycleChange={vescState.setters.setDutyCycle}
            onCurrentChange={vescState.setters.setTargetCurrent}
            onRightMotorRPMchange={vescState.setters.setRightMotorRPM}
            onLeftMotorRPMchange={vescState.setters.setLeftMotorRPM}
            onStartStop={() => {
              if (vescState.states.isRunning) {
                controlManager?.stopControl();
              } else {
                controlManager?.startControl();
              }
            }}
          />
          <LoggingControls 
            isLogging={vescState.states.isLogging}
            logData={vescState.states.logData}
            onToggleLogging={() => {
              if (!vescState.states.isLogging) {  // NOT isLogging
                controlManager?.startLogging();
              } else {
                controlManager?.stopLogging();
              }
            }}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Page1;