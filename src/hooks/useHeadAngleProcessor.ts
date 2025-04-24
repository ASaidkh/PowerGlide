// hooks/useHeadAngleProcessor.ts
import { useCallback, useRef, useState } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import OneEuroFilter from '../utils/OneEuroFilter';
import { calculateAngleFromLandmarks, fuseAngleEstimates } from '../utils/FaceUtils';

export function useHeadAngleProcessor(vescState) {
  const [headDirection, setHeadDirection] = useState('Neutral');
  const [headAngle, setHeadAngle] = useState(0);
  const [winkDetected, setWinkDetected] = useState(false); // ✅ New state

  const lastWinkTime = useRef(0);
  const lastProcessedTime = useRef(0);
  const lastRawAngle = useRef(0);
  const lastLoggedTime = useRef(0);
  const wasNeutral = useRef(true);

  const angleFilter = useRef(new OneEuroFilter()).current;

  const { detectFaces } = useFaceDetector({
    mode: 'accurate',
    detectLandmarks: 'all',
    runClassifications: 'all',
    tracking: true,
  });

  const handleDetectedFaces = useCallback((detectedFaces, width, height) => {
    if (detectedFaces.length === 0) return;

    const face = detectedFaces[0];
    const { x, width: w } = face.bounds;
    const centerX = width / 2;
    const faceCenter = x + w / 2;
    const offset = (faceCenter - centerX) / (width / 2);
    const positionAngle = -Math.sign(offset) * Math.pow(Math.abs(offset), 0.8) * 50;

    const landmarkAngle = calculateAngleFromLandmarks(face);
    const nativeYaw = face.yawAngle;
    const fusedAngle = fuseAngleEstimates(nativeYaw, landmarkAngle, positionAngle);

    lastRawAngle.current = fusedAngle;
    const smoothed = angleFilter.filter(fusedAngle);
    const finalAngle = parseFloat(smoothed.toFixed(1));

    setHeadAngle(finalAngle);

    const leftEyeOpen = face.leftEyeOpenProbability ?? 1;
    const rightEyeOpen = face.rightEyeOpenProbability ?? 1;

    const winkThreshold = 0.3;
    const leftWink = leftEyeOpen < winkThreshold && rightEyeOpen > 0.6;
    const rightWink = rightEyeOpen < winkThreshold && leftEyeOpen > 0.6;
    const wink = leftWink || rightWink;

    const now = Date.now();
    const winkCooldownMs = 3000;

    if (wink && now - lastWinkTime.current > winkCooldownMs) {
      lastWinkTime.current = now;
      setWinkDetected(true); // ✅ set wink detected

      console.log("Wink detected! Sending 'go' command.");

      vescState.setters.setJoystickY(0.5);
      setTimeout(() => {
        vescState.setters.setJoystickY(0);
        setWinkDetected(false); // ✅ reset after 1s
      }, 1000);
    }

    const neutralThreshold = nativeYaw !== undefined ? 8 : landmarkAngle !== null ? 6 : 5;
    const isNeutral = Math.abs(finalAngle) < neutralThreshold;

    let direction = 'Neutral';
    if (!isNeutral) {
      if (finalAngle > 30) direction = 'Far Left';
      else if (finalAngle > 15) direction = 'Left';
      else if (finalAngle > neutralThreshold) direction = 'Slight Left';
      else if (finalAngle < -30) direction = 'Far Right';
      else if (finalAngle < -15) direction = 'Right';
      else if (finalAngle < -neutralThreshold) direction = 'Slight Right';
    }

    const maxAngle = 40;
    const normalized = Math.max(-1, Math.min(1, finalAngle / maxAngle));
    const curved = Math.sign(normalized) * Math.pow(Math.abs(normalized), 1.5);

    const command = {
      x: !isNeutral ? -curved * 0.8 : 0,
      y: !isNeutral && Math.abs(vescState.states.joystickY) < 0.1 ? 0.3 : vescState.states.joystickY
    };

    const timeSinceLastLog = now - lastLoggedTime.current;
    const changed = direction !== headDirection;
    const toNeutral = !wasNeutral.current && isNeutral;
    const fromNeutral = wasNeutral.current && !isNeutral;

    if (changed || timeSinceLastLog >= 15000 || toNeutral || fromNeutral) {
      setHeadDirection(direction);
      lastLoggedTime.current = now;
      wasNeutral.current = isNeutral;

      if (!isNeutral) {
        vescState.setters.setJoystickX(command.x);
        if (command.y !== 0 && Math.abs(vescState.states.joystickY) < 0.1) {
          vescState.setters.setJoystickY(command.y);
        }
      } else if (toNeutral) {
        vescState.setters.setJoystickX(0);
      }
    }
  }, [vescState, headDirection]);

  const workletHandler = Worklets.createRunOnJS((faces, w, h) => {
    const now = Date.now();
    if (now - lastProcessedTime.current < 200) return;
    lastProcessedTime.current = now;
    handleDetectedFaces(faces, w, h);
  });

  const frameProcessor = useFrameProcessor((frame) => {
    'worklet';
    const faces = detectFaces(frame);
    workletHandler(faces, frame.width, frame.height);
  }, [workletHandler]);

  return {
    headDirection,
    headAngle,
    frameProcessor,
    winkDetected, // ✅ now safely returned
  };
}
