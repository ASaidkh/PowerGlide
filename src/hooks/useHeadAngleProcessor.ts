// hooks/useHeadAngleProcessor.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { useFrameProcessor } from 'react-native-vision-camera';
import { useFaceDetector } from 'react-native-vision-camera-face-detector';
import { Worklets } from 'react-native-worklets-core';
import OneEuroFilter from '../utils/OneEuroFilter';
import KalmanFilter from '../utils/KalmanFilter';
import { PIDController } from '../utils/PIDController';
import { calculateAngleFromLandmarks, fuseAngleEstimates } from '../utils/FaceUtils';

export function useHeadAngleProcessor(vescState) {
  const [headDirection, setHeadDirection] = useState('Neutral');
  const [headAngle, setHeadAngle] = useState(0);
  const [headCommand, setHeadCommand] = useState<'None'|'Go'|'Stop'>('None');

  const lastProcessedTime = useRef(0);
  const lastLoggedTime = useRef(0);
  const wasNeutral = useRef(true);
  const lastCommandTime = useRef(0);

  const angleFilter = useRef(new OneEuroFilter()).current;
  const kalmanFilter = useRef(new KalmanFilter(0.05, 3)).current;
  const pidX = useRef(new PIDController(0.5, 0.05, 0.1, -1, 1)).current;

  const { detectFaces } = useFaceDetector({
    mode: 'accurate',
    detectLandmarks: 'all',
    runClassifications: 'all',
    tracking: true,
  });

  useEffect(() => {
    pidX.setSetpoint(0); // target: centerX → offset = 0
  }, [pidX]);

  const handleDetectedFaces = useCallback((faces, width, height) => {
    if (faces.length === 0) return;

    const face = faces[0];
    const { x, width: w } = face.bounds;
    const centerX = width / 2;
    const faceCenter = x + w / 2;

    // Raw offset from center (-1 to 1)
    const offset = (faceCenter - centerX) / (width / 2);

    // PID correction smooths positional jitter
    const pidOutput = pidX.update(offset);
    const positionAngle = pidOutput * 50; // scale to degrees

    // Angle fusion
    const landmarkAngle = calculateAngleFromLandmarks(face);
    const nativeYaw = face.yawAngle;
    const nativePitch = face.pitchAngle;
    const fusedAngle = fuseAngleEstimates(nativeYaw, landmarkAngle, positionAngle);

    // Kalman smoothing
    const kalmanSmoothed = kalmanFilter.filter(fusedAngle);
    const finalAngle = parseFloat(kalmanSmoothed.toFixed(1));
    setHeadAngle(finalAngle);

    const now = Date.now();
    const cooldown = 1000;

    // Head up/down -> Go/Stop commands
    if (nativePitch !== undefined && now - lastCommandTime.current > cooldown) {
      if (nativePitch > 10 && headCommand !== 'Go') {
        vescState.setters.setJoystickX(0);
        vescState.setters.setJoystickY(0.5);
        setHeadCommand('Go');
        lastCommandTime.current = now;
      } else if (nativePitch < -10 && headCommand !== 'Stop') {
        vescState.setters.setJoystickX(0);
        vescState.setters.setJoystickY(0);
        setHeadCommand('Stop');
        lastCommandTime.current = now;
      }
    }

    const neutralThreshold = nativeYaw !== undefined ? 8 : landmarkAngle != null ? 6 : 5;
    const isNeutral = Math.abs(finalAngle) < neutralThreshold;

    let direction = 'Neutral';
    if (!isNeutral) {
      direction = finalAngle > 30 ? 'Far Left'
                : finalAngle > 15 ? 'Left'
                : finalAngle < -30 ? 'Far Right'
                : finalAngle < -15 ? 'Right'
                : finalAngle > neutralThreshold ? 'Slight Left'
                : finalAngle < -neutralThreshold ? 'Slight Right'
                : 'Neutral';
    }

    const maxAngle = 40;
    const norm = Math.max(-1, Math.min(1, finalAngle / maxAngle));
    const curved = Math.sign(norm) * Math.pow(Math.abs(norm), 1.5);
    const cmd = {
      x: !isNeutral ? -curved * 0.8 : 0,
      y: !isNeutral && Math.abs(vescState.states.joystickY) < 0.1 ? 0.3 : vescState.states.joystickY,
    };

    const sinceLog = now - lastLoggedTime.current;
    const dirChanged = direction !== headDirection;
    const toNeutral = !wasNeutral.current && isNeutral;
    const fromNeutral = wasNeutral.current && !isNeutral;

    if (dirChanged || sinceLog >= 15000 || toNeutral || fromNeutral) {
      setHeadDirection(direction);
      lastLoggedTime.current = now;
      wasNeutral.current = isNeutral;

      if (!isNeutral) {
        vescState.setters.setJoystickX(cmd.x);
        if (cmd.y !== 0 && Math.abs(vescState.states.joystickY) < 0.1) {
          vescState.setters.setJoystickY(cmd.y);
        }
      } else if (toNeutral) {
        vescState.setters.setJoystickX(0);
      }
    }
  }, [vescState, headAngle, headCommand, pidX, headDirection]);

  const workletHandler = Worklets.createRunOnJS((faces, w, h) => {
    const now = Date.now();
    if (now - lastProcessedTime.current < 200) return;
    lastProcessedTime.current = now;
    handleDetectedFaces(faces, w, h);
  });

  const frameProcessor = useFrameProcessor(frame => {
    'worklet';
    const faces = detectFaces(frame);
    workletHandler(faces, frame.width, frame.height);
  }, [handleDetectedFaces]);

  return { headDirection, headAngle, headCommand, frameProcessor };
}
