import { Command } from '../../App';

export const processVoiceCommand = (text: string, vescState: any) => {
  const command = text.toLowerCase().trim();

  const commandMappings: Record<string, { x: number; y: number }> = {
    'go': { x: 0, y: 1 },
    'reverse': { x: 0, y: -1 },
    'speed one': { x: 0, y: 0.4 },
    'speed two': { x: 0, y: 0.7 },
    'speed three': { x: 0, y: 1 },
    'stop': { x: 0, y: 0 },
    'left': { x: -1, y: 0 },
    'right': { x: 1, y: 0 },
    'help me': { x: 0, y: 0 },
  };

  for (const [key, value] of Object.entries(commandMappings)) {
    if (command.includes(key)) {
      vescState.setters.setJoystickX(value.x);
      vescState.setters.setJoystickY(value.y);
      console.log(`Voice command recognized: ${key} -> x: ${value.x}, y: ${value.y}`);
      break;
    }
  }
};
