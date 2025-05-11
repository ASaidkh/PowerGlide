// components/VoiceIndicator.tsx
import React from 'react';
import { View, Text } from 'react-native';
import styles from '../utils/Page2styles';

interface Props {
  recognizing: boolean;
}

const VoiceIndicator: React.FC<Props> = ({ recognizing }) => {
  return (
    <View style={styles.voiceIndicator}>
      <Text style={styles.voiceIndicatorText}>
        {recognizing ? "Listening..." : "Voice Ready"}
      </Text>
    </View>
  );
};

export default VoiceIndicator;
