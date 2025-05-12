import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  icon: {
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#2c3e50',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#34495e',
  },
  button: {
    backgroundColor: '#3498db',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
    width: '80%',
    elevation: 3,
  },
  disconnectButton: {
    backgroundColor: '#e74c3c',
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  deviceList: {
    width: '100%',
    marginTop: 10,
  },
  deviceItem: {
    backgroundColor: '#fff',
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    width: '100%',
    elevation: 2,
  },
  deviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  valuesContainer: {
    width: '100%',
    backgroundColor: 'white',
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
    borderBottomColor: '#ecf0f1',
  },
  valueLabel: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  valueText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  controlsContainer: {
    width: '100%',
    backgroundColor: 'white',
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
    backgroundColor: '#2980b9',
    padding: 10,
    borderRadius: 8,
    width: '48%',
    elevation: 2,
    marginVertical: 5,
  },
  controlGroup: {
    width: 250,
    height: '10%',
    marginBottom: 50,
  },
  controlLabel: {
    fontSize: 16,
    color: '#2c3e50',
    marginBottom: 5,
  },
  slider: {
    width: '100%',
    height: 50,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#bdc3c7',
    borderRadius: 5,
    padding: 5,
    width: '50%',
    textAlign: 'center',
    fontSize: 16,
  },
  configButtons: {
    marginTop: 10,
    width: '100%',
  },
  goButton: {
    backgroundColor: '#2ecc71', // Green for Go
  },
  stopButton: {
    backgroundColor: '#e74c3c', // Red for Stop
  },
  // Add to your styles
loggingContainer: {
  marginTop: 20,
  width: '100%',
  padding: 10,
  backgroundColor: '#f5f5f5',
  borderRadius: 8,
},
logEntry: {
  padding: 5,
  marginTop: 5,
  backgroundColor: 'white',
  borderRadius: 4,
},
logText: {
  fontSize: 12,
  color: '#2c3e50',
},
pingContainer: {
  marginTop: 10,
  flexDirection: 'row',
  justifyContent: 'space-between',
  width: '100%',
}
});