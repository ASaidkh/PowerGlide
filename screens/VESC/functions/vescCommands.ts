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
  
  async sendCommand(commandId: number, data: number[] = []) {
    try {
      const startTime = performance.now();
      console.log(`[TIMING] sendCommand start - Command ID: ${commandId}`);

      // Log the original data
      console.log('Sending Command ID:', commandId, "  Data:", data);

      // Create the packet
      const packetStartTime = performance.now();
      const packet = PacketAssembly.createPacket(commandId, data);
      const packetEndTime = performance.now();
      console.log(`[TIMING] Packet creation took ${(packetEndTime - packetStartTime).toFixed(2)}ms`);

      // Log the packet in Base64 format
      const base64Packet = Buffer.from(packet).toString('base64');

      // Send the packet without response
      const sendStartTime = performance.now();
      await this.rxCharacteristic.writeWithoutResponse(base64Packet)
      .then(() => {
        // Success code
        const sendEndTime = performance.now();
        console.log(`[TIMING] BLE write operation took ${(sendEndTime - sendStartTime).toFixed(2)}ms`);
        console.log("Wrote: ", base64Packet);
      });
      
      const endTime = performance.now();
      console.log(`[TIMING] Total sendCommand execution took ${(endTime - startTime).toFixed(2)}ms`);
    } catch (error) {
      console.error('Error sending command:', error);
      throw error;
    }
  }


  async parseVescValues(data: Buffer) {
    const startTime = performance.now();
    console.log(`[TIMING] parseVescValues start - Buffer size: ${data.length}`);
    
    try {
      let offset = 0;
      const mask = 0xFFFFFFFF;
      const values: any = {};

      // Timing for reading each value group
      const readingStartTime = performance.now();
      
      if (mask & (1 << 0)) {
        values.temp_mos = data.readInt16BE(offset) / 10.0;
        offset += 2;
      }
      // ... [other value readings]
      // For brevity, I'm not including all the value reading code
      // Include all your existing value reading code here
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
        offset += 1;
      }
      
      const readingEndTime = performance.now();
      console.log(`[TIMING] Reading all values took ${(readingEndTime - readingStartTime).toFixed(2)}ms`);

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

      const endTime = performance.now();
      console.log(`[TIMING] Total parseVescValues execution took ${(endTime - startTime).toFixed(2)}ms`);
      
      return values;

    } catch (error) {
      const endTime = performance.now();
      console.error(`[TIMING] parseVescValues failed after ${(endTime - startTime).toFixed(2)}ms:`, error);
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

  async forwardCanFrame(canId: number, CanCommandId: number, CommCommandId: number, data: Buffer) {
    const startTime = performance.now();
    console.log(`[TIMING] forwardCanFrame start`);
    
    // Frame ID needs to be 4 bytes total
    // VESC ID in lower 8 bits, Command ID in next 8 bits
    const frameId = canId | (CanCommandId << 8);
    const frameIdBuffer = Buffer.alloc(5);
    
    frameIdBuffer.writeInt32BE(frameId,0);
    frameIdBuffer.writeUInt8(CommCommandId,4);
    
    console.log("Frame ID buffer:", frameIdBuffer);
    
    // Data should stay in Big Endian
    const frameData = Array.from(frameIdBuffer).concat(Array.from(data));

    console.log("Complete CAN frame data:", frameData);
    
    await this.sendCommand(COMMANDS.CAN_FWD_FRAME, frameData);
    
    const endTime = performance.now();
    console.log(`[TIMING] forwardCanFrame completed in ${(endTime - startTime).toFixed(2)}ms`);
  }

  async setRpmLeft(canId: number, rpm: number) {
    const startTime = performance.now();
    console.log(`[TIMING] setRpmLeft start - RPM: ${rpm}`);
    
    // For CAN, data values should be Big Endian
    const buffer = Buffer.alloc(4);
    buffer.writeInt32BE(rpm, 0);  // Use BE for values

    console.log("CAN RPM BUFFER:", buffer);
    
    await this.forwardCanFrame(canId, COMMANDS.CAN_PACKET_SET_RPM, COMMANDS.SET_RPM, buffer);
    
    const endTime = performance.now();
    console.log(`[TIMING] setRpmLeft completed in ${(endTime - startTime).toFixed(2)}ms`);
  }



  async setDuty(duty: number) {
    // Clamp duty cycle between -1 and 1
    duty = Math.max(-1, Math.min(1, duty));

    const scaledDuty = Math.round(duty * 100000);

    // Convert the scaled duty to a 32-bit signed integer (int32)
    const buffer = Buffer.alloc(4); // 4 bytes for a 32-bit integer
    buffer.writeInt32BE(scaledDuty, 0); // Store as a 32-bit integer in big-endian format
  
    console.log("Scaled Duty Cycle (int32): ", scaledDuty, "Original Duty:", duty);
    
    // Convert the buffer to an array of bytes
    const dutyData = Array.from(buffer);
  
    // Send the command with the duty data
    await this.sendCommand(COMMANDS.SET_DUTY, dutyData);
}


async setRpmRight(rpm: number) {
  const startTime = performance.now();
  console.log(`[TIMING] setRpmRight start - RPM: ${rpm}`);
  
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
  
  const endTime = performance.now();
  console.log(`[TIMING] setRpmRight completed in ${(endTime - startTime).toFixed(2)}ms`);
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

async getValues(): Promise<any> {
  const totalStartTime = performance.now();
  console.log(`[TIMING] getValues START`);
  
  const txChar = this.txCharacteristic;
  
  return new Promise(async (resolve, reject) => {
      let dataBuffer = Buffer.alloc(0);
      let expectedLength = -1;
      let monitorStartTime = 0;
      
      const dataHandler = txChar.monitor((error, characteristic) => {
          const currentTime = performance.now();
          if (monitorStartTime === 0) {
              monitorStartTime = currentTime;
              console.log(`[TIMING] BLE monitor started`);
          }
          
          if (error) {
              const monitorTime = currentTime - monitorStartTime;
              console.log(`[TIMING] BLE monitor error after ${monitorTime.toFixed(2)}ms`);
              dataHandler.remove();
              reject(error);
              return;
          }

          if (!characteristic?.value) {
              return;
          }
          
          const packetTime = currentTime - monitorStartTime;
          console.log(`[TIMING] BLE packet received after ${packetTime.toFixed(2)}ms`);
          
          // Decode from Base64 first
          const decodeStartTime = performance.now();
          const decodedPacket = Buffer.from(characteristic.value, 'base64');
          const decodeEndTime = performance.now();
          
          console.log(`[TIMING] Base64 decoding took ${(decodeEndTime - decodeStartTime).toFixed(2)}ms`);
          console.log("Decoded packet:", decodedPacket);
          
          if (expectedLength === -1) {
              if (decodedPacket[0] === 2) { // Start byte
                  expectedLength = decodedPacket[1];
                  dataBuffer = Buffer.concat([dataBuffer, decodedPacket.slice(2)]);
                  console.log(`[TIMING] Found start byte, expecting ${expectedLength} bytes of data`);
              }
          } else if (expectedLength !== -1) {
              const concatStartTime = performance.now();
              dataBuffer = Buffer.concat([dataBuffer, decodedPacket]);
              const concatEndTime = performance.now();
              
              console.log(`[TIMING] Buffer concatenation took ${(concatEndTime - concatStartTime).toFixed(2)}ms`);
              console.log(`[TIMING] Buffer length: ${dataBuffer.length}, Expected: ${expectedLength}`);
              
              if (dataBuffer.length >= expectedLength) {
                  const totalMonitorTime = performance.now() - monitorStartTime;
                  console.log(`[TIMING] Complete data received after ${totalMonitorTime.toFixed(2)}ms`);
                  
                  dataHandler.remove();
                  
                  try {
                      const parseStartTime = performance.now();
                      const actualData = dataBuffer.slice(1, expectedLength);
                      console.log("[TIMING] Parsing Data of length:", actualData.length);
                      
                      // Call parseVescValues without await
                      this.parseVescValues(actualData)
                        .then(values => {
                          const parseEndTime = performance.now();
                          
                          console.log(`[TIMING] parseVescValues completed in ${(parseEndTime - parseStartTime).toFixed(2)}ms`);
                          console.log("[TIMING] Parsed Values:", values);
                          
                          // Clear the buffer after successful parsing
                          dataBuffer = Buffer.alloc(0);
                          expectedLength = -1;
                          
                          const totalTime = performance.now() - totalStartTime;
                          console.log(`[TIMING] getValues total execution time: ${totalTime.toFixed(2)}ms`);
                          
                          resolve(values);
                        })
                        .catch(err => {
                          console.error('[TIMING] Error in parsing:', err);
                          reject(err);
                        });
                  } catch (err) {
                      console.error('[TIMING] Error in parsing setup:', err);
                      reject(err);
                  }
              }
          }
      });

      try {
          const commandStartTime = performance.now();
          await this.sendCommand(COMMANDS.GET_VALUES, []);
          const commandEndTime = performance.now();
          console.log(`[TIMING] sendCommand for GET_VALUES took ${(commandEndTime - commandStartTime).toFixed(2)}ms`);
      } catch (err) {
          dataHandler.remove();
          const errorTime = performance.now() - totalStartTime;
          console.error(`[TIMING] Error in getValues after ${errorTime.toFixed(2)}ms:`, err);
          reject(err);
      }

      // Set timeout for the entire operation
      setTimeout(() => {
          dataHandler.remove();
          const timeoutTime = performance.now() - totalStartTime;
          console.error(`[TIMING] Timeout in getValues after ${timeoutTime.toFixed(2)}ms`);
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
