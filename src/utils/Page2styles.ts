import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#FFFFFF',    // white background (instead of black)
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  button: {
    padding: 10,
    backgroundColor: '#D55E00',   // orange (colorblind-friendly)
    borderRadius: 5,
    margin: 20,
  },
  buttonText: {
    color: '#FFFFFF',             // white text on button for contrast
    fontSize: 18,
  },
  icon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    color: '#0072B2',             // blue for titles, colorblind-friendly
  },
  topCenterStatusContainer: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  headDirectionTop: {
    backgroundColor: 'rgba(0, 114, 178, 0.7)',  // semi-transparent blue
    padding: 10,
    borderRadius: 5,
    minWidth: 120,
    marginBottom: 10,
  },
  headDirectionText: {
    color: '#FFFFFF',            // white text
    fontSize: 18,
    fontWeight: 'bold',
  },
  headAngleText: {
    color: '#009E73',            // bluish green
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
    backgroundColor: '#999999',  // neutral gray
    borderRadius: 6,
    position: 'relative',
  },
  anglePointer: {
    position: 'absolute',
    width: 12,
    height: 24,
    backgroundColor: '#E69F00',  // warm orange
    borderRadius: 6,
    top: -6,
    marginLeft: -6,
    borderWidth: 1,
    borderColor: '#000000',       // black border for contrast
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
    backgroundColor: '#000000',   // black ticks
    opacity: 0.5,
  },
  angleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
    paddingHorizontal: 2,
  },
  angleLabel: {
    color: '#000000',             // black labels
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
    backgroundColor: '#0072B2',  // blue for buttons
    marginHorizontal: 10,
  },
  cameraOffContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default styles;
