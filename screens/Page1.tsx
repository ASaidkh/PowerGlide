import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Page1 = () => (
  <View style={[styles.page, { backgroundColor: 'lightgreen' }]}>
    <Text style={styles.title}>Connect to VESC</Text>
  </View>
);

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: 'Arial',
    color: 'black',
  },
});

export default Page1;
