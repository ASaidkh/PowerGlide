import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Page3 = () => (
  <View style={[styles.page, { backgroundColor: 'powderblue' }]}>
    <Text style={styles.title}>Begin Navigation</Text>
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

export default Page3;
