import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMERGENCY_CONTACT_KEY = 'emergency_contact';

const Page4 = () => {
  const [phone, setPhone] = useState('');
  const [savedPhone, setSavedPhone] = useState('');

  useEffect(() => {
    const loadContact = async () => {
      const stored = await AsyncStorage.getItem(EMERGENCY_CONTACT_KEY);
      if (stored) setSavedPhone(stored);
    };
    loadContact();
  }, []);

  const handleSave = async () => {
    if (!/^\+?\d{7,15}$/.test(phone)) {
      Alert.alert('Invalid number', 'Please enter a valid phone number with 7-15 digits.');
      return;
    }
    try {
      await AsyncStorage.setItem(EMERGENCY_CONTACT_KEY, phone);
      setSavedPhone(phone);
      setPhone('');
      Alert.alert('Saved', 'Emergency contact updated.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save the contact.');
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Emergency Contact',
      'Are you sure you want to delete your emergency contact?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', onPress: async () => {
            await AsyncStorage.removeItem(EMERGENCY_CONTACT_KEY);
            setSavedPhone('');
            Alert.alert('Deleted', 'Emergency contact has been removed.');
          }},
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Emergency Contact</Text>
      <Text style={styles.label}>Current: {savedPhone || 'Not set'}</Text>

      <TextInput
        style={styles.input}
        placeholder="Enter new contact number"
        keyboardType="phone-pad"
        value={phone}
        onChangeText={setPhone}
      />

      <TouchableOpacity onPress={handleSave} style={styles.button}>
        <Text style={styles.buttonText}>Save Contact</Text>
      </TouchableOpacity>

      {savedPhone ? (
        <TouchableOpacity onPress={handleDelete} style={[styles.button, styles.deleteButton]}>
          <Text style={styles.buttonText}>Delete Contact</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

export default Page4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#121212',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 24,
    color: 'white',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  label: {
    fontSize: 16,
    color: 'lightgray',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#2c2c2c',
    color: 'white',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#00aaff',
    padding: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'red',
    marginTop: 10,
  },
});
