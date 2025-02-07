import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

const Page2 = () => (
  <View style={[styles.page, { backgroundColor: 'white' }]}>
    <Text style={styles.title}>Start Glide!</Text>
    {/* Button */}
        <TouchableOpacity style={styles.button} onPress={() => { /* Handle Bluetooth request here */ }}>
          <Text style={styles.buttonText}>Open Camera & Microphone</Text>
        </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
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

export default Page2;
