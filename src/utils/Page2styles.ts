import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
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
    bottom: 30,
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
  },
  headDirectionText: {
    color: 'white',
    fontSize: 18,
  },
  angleIndicator: {
    position: 'absolute',
    bottom: 100,
    left: 20,
  },
  angleBar: {
    width: 200,
    height: 10,
    backgroundColor: '#ddd',
  },
  anglePointer: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#ff5733',
    borderRadius: 5,
  },
  angleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  angleLabel: {
    color: 'white',
    fontSize: 14,
  },
});
