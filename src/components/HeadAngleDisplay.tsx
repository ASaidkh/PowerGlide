// components/HeadAngleDisplay.tsx
import React from 'react';
import { View, Text } from 'react-native';
import styles from '../utils/Page2styles';

interface Props {
  headAngle: number;
  headDirection: string;
}

const HeadAngleDisplay: React.FC<Props> = ({ headAngle, headDirection }) => {
  return (
    <>
      <View style={styles.angleIndicator}>
        <View style={styles.angleBar}>
          <View style={[styles.anglePointer, { left: `${50 - (headAngle / 45) * 50}%` }]} />
          <View style={[styles.angleTick, { left: '25%' }]} />
          <View style={[styles.angleTick, { left: '50%' }]} />
          <View style={[styles.angleTick, { left: '75%' }]} />
        </View>
        <View style={styles.angleLabels}>
          <Text style={styles.angleLabel}>-45°</Text>
          <Text style={styles.angleLabel}>0°</Text>
          <Text style={styles.angleLabel}>45°</Text>
        </View>
      </View>

      <View style={styles.headDirectionTop}>
        <Text style={styles.headDirectionText}>Face: {headDirection}</Text>
        <Text style={styles.headAngleText}>{headAngle.toFixed(1)}°</Text>
      </View>
    </>
  );
};

export default HeadAngleDisplay;
