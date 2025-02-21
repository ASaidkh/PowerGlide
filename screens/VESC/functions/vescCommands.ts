import { COMMANDS } from '../constants/VescCommands';
import { PacketAssembly } from './PacketAssembly';
import { Buffer } from 'buffer';



export class VescCommands {
  rxCharacteristic: any;

  constructor(rxCharacteristic: any) {
    this.rxCharacteristic = rxCharacteristic;
  }
  
  async sendCommand(commandId: number, data: number[]) {
    try {
      // Log the original data (no scaling in this function anymore)
      console.log('Sending Command ID:', commandId, "  Data:", data);
      
      // Create the packet
      const packet = PacketAssembly.createPacket(commandId, data);
      
      // Log the packet in Base64 format
      const base64Packet = Buffer.from(packet).toString('base64');
     // console.log('Sending packet:', base64Packet);
      
      // Send the packet without response
      await this.rxCharacteristic.writeWithoutResponse(base64Packet);
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }
  
 

  async setDuty(duty: number) {
    // Clamp duty cycle between -1 and 1
    duty = Math.max(-1, Math.min(1, duty));

    // Use a lower scaling factor for more granular control
    // The firmware typically uses different scaling factors
    const scaledDuty = Math.round(duty * 100000);

    // Convert the scaled duty to a 32-bit signed integer (int32)
    const buffer = Buffer.alloc(4); // 4 bytes for a 32-bit integer
    buffer.writeInt32LE(scaledDuty, 0); // Store as a 32-bit integer in little-endian format
  
    console.log("Scaled Duty Cycle (int32): ", scaledDuty, "Original Duty:", duty);
    
    // Convert the buffer to an array of bytes
    const dutyData = Array.from(buffer);
  
    // Send the command with the duty data
    await this.sendCommand(COMMANDS.SET_DUTY, dutyData);
}
  
  async forwardCanFrame(data: Buffer, id: number, isExtended: boolean = false) {
    const dataArray = Array.from(data);

    const canForwardPacket = [
        COMMANDS.CAN_FWD_FRAME,  // Command to forward CAN frame
        ...[id & 0xFF, (id >> 8) & 0xFF, (id >> 16) & 0xFF, (id >> 24) & 0xFF],  // 32-bit ID in little-endian
        isExtended ? 1 : 0,  // Extended flag
        ...dataArray  // Actual data payload
    ];

    await this.sendCommand(COMMANDS.CAN_FWD_FRAME, canForwardPacket);
}
  
  
  
  async setCurrent(current: number) {
    await this.sendCommand(COMMANDS.SET_CURRENT, [current], 1000);
  }

  async getValues() {
    await this.sendCommand(COMMANDS.GET_VALUES);
  }

  async sendAlive() {
    await this.sendCommand(COMMANDS.ALIVE);
  }

  async pingCan() {
    await this.sendCommand(COMMANDS.PING_CAN);
  }

  // ... other command methods
}
