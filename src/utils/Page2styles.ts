import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'flex-start',  // Keep elements at the top of the screen
    alignItems: 'center',
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
  topCenterStatusContainer: {
    position: 'absolute',
    top: 50,  // Adjust this value to move it closer to the top
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  headDirectionTop: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    marginBottom: 10,
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
  angleIndicator: {
    marginTop: 10,
    width: 200,
    alignSelf: 'center',
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
  controlsContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 85,
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
});

export default styles;
