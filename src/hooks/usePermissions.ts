import { useCameraPermission, useMicrophonePermission } from 'react-native-vision-camera';

export const usePermissions = () => {
   const { hasPermission: hasCameraPermission, requestPermission: requestCameraPermission } = useCameraPermission();
   const { hasPermission: hasMicPermission, requestPermission: requestMicPermission } = useMicrophonePermission();
 
   const requestPermissions = async () => {
     const cameraGranted = await requestCameraPermission();
     const micGranted = await requestMicPermission();
     return cameraGranted && micGranted;
   };
 
   return {
     hasCameraPermission,
     hasMicPermission,
     requestPermissions,
   };
 };
 