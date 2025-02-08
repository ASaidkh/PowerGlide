"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from "react-native"
import { Camera, useCameraDevices } from "react-native-vision-camera"
import Icon from "react-native-vector-icons/FontAwesome5"

const Page2 = () => {
  const [hasPermission, setHasPermission] = useState(false)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const cameraRef = useRef(null)
  const devices = useCameraDevices()
  const [frontCamera, setFrontCamera] = useState(null)

  useEffect(() => {
    const getFrontCamera = () => {
      const availableDevices = Object.values(devices)
      const frontCameraDevice = availableDevices.find((device) => device.position === "front")
      setFrontCamera(frontCameraDevice)
    }

    getFrontCamera()
  }, [devices])

  const requestPermissionsAndOpenCamera = useCallback(async () => {
    try {
      const cameraPermission = await Camera.requestCameraPermission()
      const microphonePermission = await Camera.requestMicrophonePermission()

      console.log("Camera permission:", cameraPermission)
      console.log("Microphone permission:", microphonePermission)

      if (cameraPermission === "authorized" && microphonePermission === "authorized") {
        setHasPermission(true)
        setIsCameraActive(true)
      } else if (cameraPermission === "denied" || microphonePermission === "denied") {
        Alert.alert(
          "Permission Denied",
          "Camera and microphone permissions are required. Please enable them in your device settings.",
          [
            { text: "OK", onPress: () => console.log("OK Pressed") },
            { text: "Open Settings", onPress: () => Linking.openSettings() },
          ],
        )
      } else {
        Alert.alert("Permission Required", "Camera & microphone permissions are required to use this feature.")
      }
    } catch (error) {
      console.error("Error requesting permissions:", error)
      Alert.alert("Error", "Failed to request permissions. Please try again.")
    }
  }, [])

  useEffect(() => {
    const checkAndActivateCamera = async () => {
      const cameraPermission = await Camera.getCameraPermissionStatus()
      const microphonePermission = await Camera.getMicrophonePermissionStatus()

      console.log("Current camera permission:", cameraPermission)
      console.log("Current microphone permission:", microphonePermission)

      if (cameraPermission === "authorized" && microphonePermission === "authorized" && frontCamera) {
        setHasPermission(true)
        setIsCameraActive(true)
      } else {
        setHasPermission(false)
        setIsCameraActive(false)
      }
    }

    checkAndActivateCamera()
  }, [frontCamera])

  if (!frontCamera) {
    return (
      <View style={styles.page}>
        <Text style={styles.title}>Camera not available</Text>
        <Text style={styles.subtitle}>Initializing camera...</Text>
      </View>
    )
  }

  return (
    <View style={styles.page}>
      {isCameraActive && frontCamera ? (
        <Camera ref={cameraRef} style={styles.camera} device={frontCamera} isActive={true} />
      ) : (
        <>
          <Icon name="wheelchair" size={75} color="white" style={styles.icon} />
          <Text style={styles.title}>Start Glide!</Text>
          <TouchableOpacity style={styles.button} onPress={requestPermissionsAndOpenCamera}>
            <Text style={styles.buttonText}>Open Camera & Microphone</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "black",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    fontFamily: "Arial",
    color: "white",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "white",
    textAlign: "center",
    marginTop: 10,
  },
  button: {
    backgroundColor: "blue",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
  },
  camera: {
    width: "100%",
    height: "100%",
  },
  icon: {
    marginBottom: 20,
  },
})

export default Page2
