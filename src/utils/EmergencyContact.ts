// src/utils/emergencyContact.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export const setEmergencyContact = async (phoneNumber: string) => {
  try {
    await AsyncStorage.setItem('emergencyContact', phoneNumber);
  } catch (error) {
    console.error('Error saving emergency contact:', error);
  }
};

export const getEmergencyContact = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem('emergencyContact');
  } catch (error) {
    console.error('Error retrieving emergency contact:', error);
    return null;
  }
};
