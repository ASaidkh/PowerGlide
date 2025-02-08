import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';

const Page3 = () => (
  <View style={[styles.page, { backgroundColor: 'powderblue' }]}>
    {/* GPS Icon */}
    <Icon name="gps-fixed" size={75} color="black" style={styles.gpsIcon} />

    {/* Title */}
    <Text style={styles.title}>Begin Navigation</Text>

    {/* Button */}
    <TouchableOpacity style={styles.button} onPress={() => { /* Handle Bluetooth request here */ }}>
      <Text style={styles.buttonText}>Request Location Access</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gpsIcon: {
    marginBottom: 10, // Adds space between the icon and title
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
  },
  button: {
    backgroundColor: 'blue', // Button color
    paddingVertical: 12, // Vertical padding for the button
    paddingHorizontal: 25, // Horizontal padding for the button
    borderRadius: 5, // Optional: Rounded corners
    marginTop: 20,
  },
  buttonText: {
    color: 'white', // Text color
    fontSize: 16, // Font size of the button text
    fontWeight: 'bold', // Make the text bold
    textAlign: 'center', // Center the text within the button
  },
});

export default Page3;
