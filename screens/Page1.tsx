import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const Page1 = () => (
  <View style={[styles.page, { backgroundColor: 'lightgreen' }]}>
    {/* Connection Link Icon */}
    <Icon name="microchip" size={75} color="black" style={styles.icon} />

    {/* Title */}
    <Text style={styles.title}>Connect to VESC</Text>

    {/* Button */}
    <TouchableOpacity style={styles.button} onPress={() => { /* Handle Bluetooth request here */ }}>
      <Text style={styles.buttonText}>Request Bluetooth Access</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20, // Optional: Add some padding
  },
  icon: {
    marginBottom: 10, // Space between the icon and title
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
    marginBottom: 20, // Adds space between the title and the button
  },
  button: {
    backgroundColor: 'blue', // Button color
    paddingVertical: 10, // Vertical padding for the button
    paddingHorizontal: 20, // Horizontal padding for the button
    borderRadius: 5, // Optional: Rounded corners
  },
  buttonText: {
    color: 'white', // Text color
    fontSize: 16, // Font size of the button text
    fontWeight: 'bold', // Make the text bold
    textAlign: 'center', // Center the text within the button
  },
});

export default Page1;
