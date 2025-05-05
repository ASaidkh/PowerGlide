# PowerGlide - Adaptive Wheelchair Control System

## Overview

PowerGlide is an advanced, adaptive wheelchair control system designed to provide multiple intuitive interfaces for electric wheelchair control. This React Native application integrates with VESC motor controllers to provide precise control through:

- Face tracking for hands-free direction control
- Voice commands for basic movement
- Touchscreen joystick for traditional control
- Comprehensive safety monitoring system

The system is designed to enhance mobility independence for users with various physical capabilities, offering three control interfaces in a single application.

## Features

### Multiple Control Interfaces

- **Face Tracking:** Control wheelchair direction with head movements
  - Head turning for directional control
  - Look up for "Go" command
  - Look down for "Stop" command

- **Voice Recognition:** Issue verbal commands
  - Supports commands: "go", "reverse", "stop", "left", "right", "speed one/two/three"

- **Touch Joystick:** Traditional touchscreen control interface
  - Intuitive virtual joystick with visual feedback
  - Adjustable sensitivity

### Advanced Safety Features

- **Auto-stop Safety System:**
  - Continuous monitoring of critical parameters:
    - Motor temperature
    - MOSFET temperature
    - Current draw
    - RPM
    - Voltage
    - Duty cycle
  - Automatic emergency stop when dangerous conditions detected
  - Smart detection of startup conditions vs. normal operation

### Technical Capabilities

- **VESC Motor Controller Integration:**
  - Real-time motor parameter monitoring
  - Direct command interface via Bluetooth
  - Support for dual motor control (left/right)

- **Real-time Data Logging:**
  - Capture motor performance metrics
  - Track user inputs and system responses

- **Bluetooth Connectivity:**
  - Automatic device scanning
  - Persistent connections
  - Robust error handling

## Architecture

The application is structured with a modular architecture:

- **Core Components:**
  - VESC Connection Manager: Handles BLE communication
  - VESC Control Manager: Translates user inputs to motor commands
  - VESC State Manager: Maintains application state

- **Input Processing:**
  - Head angle processor with multi-method fusion algorithm
  - Voice recognition with command parsing
  - Joystick control with position normalization

- **User Interface:**
  - Tab-based navigation between control modes
  - Real-time parameter visualization
  - Visual feedback for all control interfaces

## Getting Started

### Prerequisites

- Node.js and npm
- React Native development environment
- Android Studio or Xcode
- Bluetooth-enabled device
- VESC motor controller setup for wheelchair

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/powerglide-wheelchair.git
   ```

2. Install dependencies:
   ```bash
   cd powerglide-wheelchair
   npm install
   ```

3. Install required native modules:
   ```bash
   npm install react-native-ble-plx react-native-vector-icons @react-native-community/slider
   npm install react-native-vision-camera react-native-vision-camera-face-detector
   npm install react-native-vosk
   ```

4. Install the Vosk speech recognition model:
   - Download the small English model from https://alphacephei.com/vosk/models
   - Extract to the `assets/vosk-model-small-en-us-0.15` directory

### Running the Application

#### Android
```bash
npx react-native run-android
```

#### iOS
```bash
npx react-native run-ios
```

## Usage Guide

1. **Connection Screen:**
   - Start by connecting to your VESC controller
   - Scan for available devices and select your wheelchair's controller

2. **Control Modes:**
   - **VESC Tab:** Direct control and monitoring of motor parameters
   - **Camera Tab:** Face tracking controls with voice command option
   - **Joystick Tab:** Touch-based directional control

3. **Safety Features:**
   - The system will automatically monitor for unsafe conditions
   - Emergency stop will activate if anomalies are detected
   - Manual stop available in all control interfaces

## Development Guide

### Project Structure

- `/src/VESC`: Core VESC communication and control components
- `/src/components`: Reusable UI components
- `/src/hooks`: Custom React hooks for state management
- `/src/screens`: Main application screens
- `/src/utils`: Helper functions and utilities

### Key Components

- `VescConnectionManager`: Handles BLE device discovery and communication
- `VescControlManager`: Translates control inputs to motor commands
- `useHeadAngleProcessor`: Processes face detection data into control signals
- `useVoskRecognition`: Manages voice command recognition

### Adding New Features

1. **New Control Method:**
   - Create a custom hook in `/src/hooks`
   - Integrate with `VescState` using the existing pattern
   - Add UI components in `/src/components`

2. **New VESC Commands:**
   - Add command constants in `VescCommands.ts`
   - Implement command functions in appropriate manager

## Simulator Support

The project includes `Voice_Face_SIM_Control.py`, a Python script that enables testing the face tracking and voice recognition systems without physical hardware. This simulator:

- Uses the same face tracking algorithms as the mobile app
- Provides visual feedback through OpenCV
- Translates head movements and voice commands to keyboard inputs
- Works with any simulator or game that uses WASD controls

### Simulator Prerequisites

- Python 3.7+
- OpenCV
- MediaPipe
- PyAutoGUI
- Vosk
- PyAudio

## Contributors

- Mike: Project Lead/Hardware
- Reta: Application/Software
- Alim: Integration/Communication/Control

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- VESC Project for the motor controller firmware
- Vosk for the speech recognition engine
- MediaPipe for the face detection technology
- React Native community
