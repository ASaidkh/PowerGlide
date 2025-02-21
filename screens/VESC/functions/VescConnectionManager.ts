import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { VescCommands } from './vescCommands';
import { BLE_UUIDS } from '../constants/VescCommands';
import { PacketAssembly } from './PacketAssembly';
import { Buffer } from 'buffer';

export class VescConnectionManager {
    private bleManager: BleManager;
    private device: Device | null;
    private vescCommands: VescCommands | null;
    private valueSubscription: any;
    private buffer: Buffer; // Persistent buffer to accumulate incoming data

    constructor() {
        this.bleManager = new BleManager();
        this.device = null;
        this.vescCommands = null;
        this.buffer = Buffer.alloc(0); // Initialize buffer to an empty Buffer
    }

    // Start scanning for devices
    startScanning = async (onDeviceFound: (device: Device) => void) => {
        try {
            await this.bleManager.startDeviceScan(
                null, 
                { allowDuplicates: false },
                (error, device) => {
                    if (error) {
                        console.error('Scan error:', error);
                        return;
                    }
                    
                    if (device && device.name?.includes('VESC')) {
                        onDeviceFound(device);
                    }
                }
            );
        } catch (error) {
            console.error('Error starting scan:', error);
            throw error;
        }
    };

    // Stop scanning for devices
    stopScanning = () => {
        this.bleManager.stopDeviceScan();
    };

    // Connect to a device and discover services and characteristics
    connect = async (device: Device) => {
        try {
            const connectedDevice = await device.connect();
            const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
            
            // Get the UART service
            const services = await discoveredDevice.services();
            const uartService = services.find(
                service => service.uuid === BLE_UUIDS.UART_SERVICE
            );
            
            if (!uartService) {
                throw new Error('UART service not found');
            }

            // Get TX and RX characteristics
            const characteristics = await uartService.characteristics();
            const rxChar = characteristics.find(
                char => char.uuid === BLE_UUIDS.UART_RX
            );
            const txChar = characteristics.find(
                char => char.uuid === BLE_UUIDS.UART_TX
            );

            if (!rxChar || !txChar) {
                throw new Error('UART characteristics not found');
            }

            

            // Initialize VESC commands
            this.vescCommands = new VescCommands(rxChar, txChar);
            this.device = discoveredDevice;

            return this.vescCommands;

        } catch (error) {
            console.error('Connection error:', error);
            throw error;
        }
    };

    // Disconnect from the device
    disconnect = async () => {
        try {
            if (this.valueSubscription) {
                this.valueSubscription.remove();
            }
            if (this.device) {
                await this.device.cancelConnection();
            }
            this.device = null;
            this.vescCommands = null;
        } catch (error) {
            console.error('Disconnect error:', error);
            throw error;
        }
    };

    // Handle incoming data and accumulate it until a full packet is received
    private handleIncomingData(data: Buffer) {
        try {
            console.log("Received data:", data);
            

            // Accumulate incoming data
            this.buffer = Buffer.concat([this.buffer, data]);
            console.log("Buffer Length:", this.buffer.length);
            console.log("Buffer:", this.buffer);

            // Check if we have at least 20 bytes of data (full packet size)
            const expectedPacketSize = 79;

            // Process the buffer if it's long enough for a full packet
            if (this.buffer.length >= expectedPacketSize) {
                // Extract the full 20-byte packet
                const packet = this.buffer.slice(0, expectedPacketSize);
                console.log(packet)
                // Remove the processed packet from the buffer
                this.buffer = this.buffer.slice(expectedPacketSize);

                // Now parse the full packet
                try {
                    const values = PacketAssembly.parseVescValues(packet);
                    console.log("Parsed Data:", values);
                } catch (error) {
                    console.error('Error parsing VESC values:', error);
                }
            }
        } catch (error) {
            console.error('Error parsing incoming data:', error);
        }
    }

    // Cleanup resources
    destroy() {
        this.bleManager.destroy();
    }
}
