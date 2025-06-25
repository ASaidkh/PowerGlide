import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',          // white background for high contrast
  },
  icon: {
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0072B2',                    // colorblind-friendly blue
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#009E73',                    // bluish green
  },
  button: {
    backgroundColor: '#D55E00',          // colorblind-friendly orange
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    elevation: 3,
  },
  disconnectButton: {
    backgroundColor: '#CC79A7',          // reddish purple instead of harsh red
    marginTop: 20,
  },
  buttonText: {
    color: '#FFFFFF',                    // white text for contrast
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deviceList: {
    width: '100%',
    marginTop: 10,
  },
  deviceItem: {
    backgroundColor: '#F0E442',          // bright yellow for device item background (soft and distinct)
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: '100%',
    elevation: 2,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0072B2',                    // blue text for clarity
  },
  valuesContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',          // white for good contrast
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#CCCCCC',        // light gray border for subtle separation
  },
  valueLabel: {
    fontSize: 14,
    color: '#7F8C8D',                    // muted gray for labels
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0072B2',                    // blue for important text
  },
  controlsContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
  },
  controlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 5,
  },
  controlButton: {
    backgroundColor: '#56B4E9',          // sky blue for buttons
    padding: 10,
    borderRadius: 20,
    width: '100%',
    elevation: 2,
    marginVertical: 5,
  },
  controlGroup: {
    width: 250,
    height: '10%',
    marginBottom: 20,
  },
  controlLabel: {
    fontSize: 16,
    color: '#0072B2',                    // blue for labels
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 20,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999999',              // neutral gray border
    borderRadius: 5,
    padding: 5,
    width: '50%',
    textAlign: 'center',
    fontSize: 16,
    color: '#000000',                    // black input text for readability
  },
  configButtons: {
    marginTop: 10,
    width: '100%',
  },
  goButton: {
    backgroundColor: '#2ECC71',          // green (safe for colorblind)
  },
  stopButton: {
    backgroundColor: '#CC79A7',          // reddish purple for stop button (instead of red)
  },
  loggingContainer: {
    marginTop: 20,
    width: '100%',
    padding: 10,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  logEntry: {
    padding: 5,
    marginTop: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  logText: {
    fontSize: 12,
    color: '#0072B2',                    // blue text for logs
  },
  pingContainer: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
});
