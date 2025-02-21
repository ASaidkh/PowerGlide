import { COMMANDS } from '../constants/VescCommands';
import { PacketAssembly } from './PacketAssembly';
import { Buffer } from 'buffer';



export class VescCommands {
  rxCharacteristic: any;
  txCharacteristic: any;

  constructor(rxCharacteristic: any, txCharacteristic: any) {
    this.rxCharacteristic = rxCharacteristic;
    this.txCharacteristic = txCharacteristic;
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
      await this.rxCharacteristic.writeWithoutResponse(base64Packet)
      .then(() => {
        // Success code
        console.log("Wrote: ", base64Packet);
      });
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }


async parseVescValues(data: Buffer) {
  try {
    let offset = 0;
    const mask = 0xFFFFFFFF;
    const values: any = {};

    if (mask & (1 << 0)) {
      values.temp_mos = data.readInt16BE(offset) / 10.0;
      offset += 2;
    }
    if (mask & (1 << 1)) {
      values.temp_motor = data.readInt16BE(offset) / 10.0;
      offset += 2;
    }
    if (mask & (1 << 2)) {
      values.current_motor = data.readInt32BE(offset) / 100.0;
      offset += 4;
    }
    if (mask & (1 << 3)) {
      values.current_in = data.readInt32BE(offset) / 100.0;
      offset += 4;
    }
    if (mask & (1 << 4)) {
      values.id = data.readInt32BE(offset) / 100.0;
      offset += 4;
    }
    if (mask & (1 << 5)) {
      values.iq = data.readInt32BE(offset) / 100.0;
      offset += 4;
    }
    if (mask & (1 << 6)) {
      values.duty_now = data.readInt16BE(offset) / 1000.0;
      offset += 2;
    }
    if (mask & (1 << 7)) {
      values.rpm = data.readInt32BE(offset);
      offset += 4;
    }
    if (mask & (1 << 8)) {
      values.v_in = data.readInt16BE(offset) / 10.0;
      offset += 2;
    }
    if (mask & (1 << 9)) {
      values.amp_hours = data.readInt32BE(offset) / 10000.0;
      offset += 4;
    }
    if (mask & (1 << 10)) {
      values.amp_hours_charged = data.readInt32BE(offset) / 10000.0;
      offset += 4;
    }
    if (mask & (1 << 11)) {
      values.watt_hours = data.readInt32BE(offset) / 10000.0;
      offset += 4;
    }
    if (mask & (1 << 12)) {
      values.watt_hours_charged = data.readInt32BE(offset) / 10000.0;
      offset += 4;
    }
    if (mask & (1 << 13)) {
      values.tachometer = data.readInt32BE(offset);
      offset += 4;
    }
    if (mask & (1 << 14)) {
      values.tachometer_abs = data.readInt32BE(offset);
      offset += 4;
    }
    if (mask & (1 << 15)) {
      values.fault_code = data.readInt8(offset);
      //values.fault_str = this.faultToStr(values.fault_code);
      offset += 1;
    }

    // Check remaining buffer size and handle additional fields
    const remaining = data.length - offset;

    if (remaining >= 4) {
      if (mask & (1 << 16)) {
        values.position = data.readInt32BE(offset) / 1000000.0;
        offset += 4;
      }
    } else {
      values.position = -1.0;
    }

    if (remaining >= 1) {
      if (mask & (1 << 17)) {
        values.vesc_id = data.readUInt8(offset);
        offset += 1;
      }
    } else {
      values.vesc_id = 255;
    }

    if (remaining >= 6) {
      if (mask & (1 << 18)) {
        values.temp_mos_1 = data.readInt16BE(offset) / 10.0;
        offset += 2;
        values.temp_mos_2 = data.readInt16BE(offset) / 10.0;
        offset += 2;
        values.temp_mos_3 = data.readInt16BE(offset) / 10.0;
        offset += 2;
      }
    }

    if (remaining >= 8) {
      if (mask & (1 << 19)) {
        values.vd = data.readInt32BE(offset) / 1000.0;
        offset += 4;
      }
      if (mask & (1 << 20)) {
        values.vq = data.readInt32BE(offset) / 1000.0;
        offset += 4;
      }
    }

    if (remaining >= 1) {
      if (mask & (1 << 21)) {
        const status = data.readUInt8(offset);
        values.has_timeout = (status & 1) !== 0;
        values.kill_sw_active = ((status >> 1) & 1) !== 0;
        offset += 1;
      }
    }

    return values;

  } catch (error) {
    console.error('Error parsing VESC values:', error);
    throw error;
  }
}

  
  private calculateCrc16(data: Buffer): number {
    let crc = 0;
    for (let i = 0; i < data.length; i++) {
        const b = data[i];
        crc = ((crc << 8) & 0xFFFF) ^ CRC16_TABLE[(crc >> 8) ^ b];
    }
    return crc;
  }

async forwardCanFrame(canId: number, commandId: number, data: Buffer) {
    // Frame ID needs to be 4 bytes total
    // VESC ID in lower 8 bits, Command ID in next 8 bits
    const frameId = canId | (commandId << 8);
    const frameIdBuffer = Buffer.alloc(4);
    frameIdBuffer.writeUInt32BE(frameId);

    console.log("Frame ID buffer:", frameIdBuffer);
    
    // Data should stay in Big Endian
    const frameData = Array.from(frameIdBuffer).concat(Array.from(data));

    // Add isExtended flag at the end
    frameData.push(0); // 1 for extended CAN frame

    console.log("Complete CAN frame data:", frameData);
    
    await this.sendCommand(COMMANDS.CAN_FWD_FRAME, frameData);
}

async setRpmForVesc(canId: number, rpm: number) {
   await this.setRpm(rpm);
    // For CAN, data values should be Big Endian
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(Math.round(rpm), 0);  // Use BE for values

    console.log("CAN RPM BUFFER:", buffer);
    // CAN_PACKET_SET_RPM = 3
    await this.forwardCanFrame(canId, 3, buffer);
}

  async setDuty(duty: number) {
    // Clamp duty cycle between -1 and 1
    duty = Math.max(-1, Math.min(1, duty));

    // Use a lower scaling factor for more granular control
    // The firmware typically uses different scaling factors
    const scaledDuty = Math.round(duty * 100000);

    // Convert the scaled duty to a 32-bit signed integer (int32)
    const buffer = Buffer.alloc(4); // 4 bytes for a 32-bit integer
    buffer.writeInt32BE(scaledDuty, 0); // Store as a 32-bit integer in little-endian format
  
    console.log("Scaled Duty Cycle (int32): ", scaledDuty, "Original Duty:", duty);
    
    // Convert the buffer to an array of bytes
    const dutyData = Array.from(buffer);
  
    // Send the command with the duty data
    await this.sendCommand(COMMANDS.SET_DUTY, dutyData);
}
async setRpm(rpm: number) {
  // No scaling needed for RPM as per VESC firmware
  const scaledRpm = Math.round(rpm); // Just round to ensure integer

  // Convert to buffer
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(scaledRpm, 0);

  console.log("RPM value (int32):", scaledRpm, "Original RPM:", rpm);

  // Convert buffer to array of bytes
  const rpmData = Array.from(buffer);

  // Send command
  await this.sendCommand(COMMANDS.SET_RPM, rpmData);
}
  
  
  
async setCurrent(current: number) {
  
  // Scale by 1000 as per VESC firmware (1e3)
  const scaledCurrent = Math.round(current*1000 );

  // Convert to buffer
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(scaledCurrent, 0);

  console.log("Scaled Current (int32):", scaledCurrent, "Original Current:", current);

  // Convert buffer to array of bytes
  const currentData = Array.from(buffer);

  // Send command
  await this.sendCommand(COMMANDS.SET_CURRENT, currentData);
}

  async faultToStr(fault: number): string {
    const faultStrings = {
        0: "FAULT_CODE_NONE",
        1: "FAULT_CODE_OVER_VOLTAGE",
        2: "FAULT_CODE_UNDER_VOLTAGE",
        3: "FAULT_CODE_DRV",
        4: "FAULT_CODE_ABS_OVER_CURRENT",
        5: "FAULT_CODE_OVER_TEMP_FET",
        6: "FAULT_CODE_OVER_TEMP_MOTOR",
        // ... add all other fault codes
    };
    return faultStrings[fault] || "FAULT_CODE_UNKNOWN";
}

  async getValues(): Promise<VescValues> {
    const txChar = this.txCharacteristic;
    
    return new Promise(async (resolve, reject) => {
        let dataBuffer = Buffer.alloc(0);
        let expectedLength = -1;
        
        const dataHandler = txChar.monitor((error, characteristic) => {
            if (error) {
                dataHandler.remove();
                reject(error);
                return;
            }

            if (!characteristic?.value) {
                return;
            }
            
            // Decode from Base64 first
            const decodedPacket = Buffer.from(characteristic.value, 'base64');
            console.log("Decoded packet:", decodedPacket);
            
            
            if (expectedLength === -1) {
                if (decodedPacket[0] === 2) { // Start byte
                    expectedLength = decodedPacket[1];
                    dataBuffer = Buffer.concat([dataBuffer, decodedPacket.slice(2)]);
                    console.log("expectedLength:", expectedLength);
                }
            } else  if (expectedLength !== -1){
                dataBuffer = Buffer.concat([dataBuffer, decodedPacket]);
                console.log("Buffer length:", dataBuffer.length);
                console.log("Data Buffer:", dataBuffer);
                if (dataBuffer.length >= expectedLength) {
                    dataHandler.remove();
                    
                    try {
                        const actualData = dataBuffer.slice(1, expectedLength);
                        console.log("Parsing Data:", actualData);
                        const values = this.parseVescValues(actualData);
                        console.log("Parsed Values:", values);
                        
                        // Clear the buffer after successful parsing
                        dataBuffer = Buffer.alloc(0);
                        expectedLength = -1;
                        
                        resolve(values);
                    } catch (err) {
                        reject(err);
                    }
                }
            }
        });

        try {
            await this.sendCommand(COMMANDS.GET_VALUES, []);
        } catch (err) {
            dataHandler.remove();
            reject(err);
        }

        setTimeout(() => {
            dataHandler.remove();
            reject(new Error('Timeout waiting for VESC values'));
        }, 1000);
    });
}

  async sendAlive() {
    await this.sendCommand(COMMANDS.ALIVE);
  }

  async pingCan() {
    await this.sendCommand(COMMANDS.PING_CAN);
  }

  // ... other command methods
}
