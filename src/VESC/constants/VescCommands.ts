export const COMMANDS = {
  GET_VALUES: 0x04,
  SET_DUTY: 0x05,
  SET_CURRENT: 0x06,
  SET_CURRENT_BRAKE: 0x07,
  SET_RPM: 0x08,
  SET_POS: 0x09,
  SET_HANDBRAKE: 0x0A,
  GET_MCCONF: 0x0B,
  PING_CAN: 62,
  ALIVE: 30,
  LOG_START: 145,
  LOG_STOP: 146,
  LOG_CONFIG_FIELD: 147,
  LOG_DATA_F32: 148,
  LOG_DATA_F64: 151,
  CAN_FWD_FRAME: 85,
  CAN_PACKET_SET_RPM: 3
  
};

export const BLE_UUIDS = {
  UART_SERVICE: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
  UART_RX: '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  UART_TX: '6e400003-b5a3-f393-e0a9-e50e24dcca9e'
};

