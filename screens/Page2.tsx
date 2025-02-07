import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Page2 = () => (
  <View style={[styles.page, { backgroundColor: 'white' }]}>
    <Text style={styles.title}>Start Glide!</Text>
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

export default Page2;
