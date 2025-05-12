import { Face, detectFaces } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';

export const calculateHeadDirection = (detectedFaces: Face[], setHeadDirection: any, setHeadAngle: any, vescState: any) => {
  if (detectedFaces.length === 0) return;

  const face = detectedFaces[0];
  if (!face.bounds || !face.bounds.width) return;

  const { x, width } = face.bounds;
  const frameWidth = 640;
  const centerX = frameWidth / 2;
  const faceCenter = x + width / 2;
  
  const offsetPercentage = (faceCenter - centerX) / (frameWidth / 2);
  const calculatedAngle = -offsetPercentage * 45;
  const roundedAngle = parseFloat(calculatedAngle.toFixed(2));

  const angle = face.yawAngle !== undefined ? parseFloat(face.yawAngle.toFixed(2)) : roundedAngle;
  setHeadAngle(angle);

  const isNeutral = Math.abs(angle) < 5;
  let directionText = 'Neutral';
  let command = { x: 0, y: 0 };
  
  if (!isNeutral) {
    const radians = (angle * Math.PI) / 180;
    command.x = Math.sin(radians);
    command.y = Math.cos(radians);
    
    directionText = angle > 0 ? 'Left' : 'Right';
  }

  setHeadDirection(directionText);
  if (!isNeutral) {
    vescState.setters.setJoystickX(command.x);
    vescState.setters.setJoystickY(command.y);
    console.log(`Direction command added: ${directionText} (${angle}°) -> x: ${command.x.toFixed(2)}, y: ${command.y.toFixed(2)}`);
  }
};
