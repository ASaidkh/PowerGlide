// utils/FaceUtils.ts
import { Face } from 'react-native-vision-camera-face-detector';

export function calculateAngleFromLandmarks(face: Face): number | null {
   if (!face.landmarks || !Array.isArray(face.landmarks) || face.landmarks.length < 5) return null;

   try {
      const leftEye = face.landmarks.find(l => l.type === 'leftEye');
      const rightEye = face.landmarks.find(l => l.type === 'rightEye');
      const nose = face.landmarks.find(l => l.type === 'nose');

      if (!leftEye || !rightEye || !nose) return null;

      const eyeMidX = (leftEye.position.x + rightEye.position.x) / 2;
      const eyeMidY = (leftEye.position.y + rightEye.position.y) / 2;

      const eyeVector = {
         x: rightEye.position.x - leftEye.position.x,
         y: rightEye.position.y - leftEye.position.y,
      };

      const eyeLineLength = Math.sqrt(eyeVector.x ** 2 + eyeVector.y ** 2);

      const noseOffset = {
         x: nose.position.x - eyeMidX,
         y: nose.position.y - eyeMidY,
      };

      const projection = (noseOffset.x * eyeVector.x + noseOffset.y * eyeVector.y) / eyeLineLength;

      const normalizedOffset = projection / eyeLineLength;

      const angle = Math.asin(Math.min(Math.max(normalizedOffset, -0.8), 0.8)) * (180 / Math.PI) * 1.5;

      return -angle;
   } catch (error) {
      console.log('Error calculating angle from landmarks:', error);
      return null;
   }
}

export function fuseAngleEstimates(
   nativeYaw: number | undefined,
   landmarkAngle: number | null,
   positionAngle: number
   ): number {
   const weights = {
      nativeYaw: 0.6,
      landmarks: 0.3,
      position: 0.1,
   };

   let finalAngle = positionAngle * weights.position;
   let totalWeight = weights.position;

   if (landmarkAngle !== null) {
      finalAngle += landmarkAngle * weights.landmarks;
      totalWeight += weights.landmarks;
   }

   if (nativeYaw !== undefined) {
      finalAngle += nativeYaw * weights.nativeYaw;
      totalWeight += weights.nativeYaw;
   }

   return finalAngle / totalWeight;
}
