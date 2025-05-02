import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  button: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: 'white',
  },
  controlsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 70,
    justifyContent: 'space-around',
    width: '80%',
  },
  controlButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#1E90FF',
    marginHorizontal: 10,
  },
  cameraActive: {
    backgroundColor: '#FF4500',
  },
  micActive: {
    backgroundColor: '#32CD32',
  },
  headDirectionTop: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
  },
  headDirectionText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headAngleText: {
    color: '#00BFFF',
    fontSize: 16,
    marginTop: 4,
  },
  faceDataText: {
    color: '#7FFF00',
    fontSize: 12,
    marginTop: 4,
  },
  angleIndicator: {
    position: 'absolute',
    bottom: 130,
    left: 110,
    width: 200,
  },
  angleBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#444',
    borderRadius: 6,
    position: 'relative',
  },
  anglePointer: {
    position: 'absolute',
    width: 12,
    height: 24,
    backgroundColor: '#ff5733',
    borderRadius: 6,
    top: -6,
    marginLeft: -6,
    borderWidth: 1,
    borderColor: 'white',
    // Add a shadow for better visibility
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  angleTick: {
    position: 'absolute',
    top: 0,
    width: 2,
    height: 12,
    backgroundColor: '#fff',
    opacity: 0.5,
  },
  angleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  angleLabel: {
    color: 'white',
    fontSize: 14,
  },
  voiceIndicator: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    backgroundColor: 'rgba(0,139,0,0.7)',
    padding: 8,
    borderRadius: 5,
  },
  voiceIndicatorText: {
    color: 'white',
    fontSize: 16,
  },
  // Debug panel for developers
  debugPanel: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    maxWidth: 200,
  },
  debugText: {
    color: '#AAAAAA',
    fontSize: 10,
    fontFamily: 'monospace',
  },
});

export default styles;