import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Page1 from './screens/Page1';
import Page2 from './screens/Page2';
import Page3 from './screens/Page3';
import { useVescState } from './screens/VESC/functions/VescStateManager';



// App.tsx
export default function App() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'VESC' },
    { key: 'second', title: 'Camera' },
    { key: 'third', title: 'GPS' },
  ]);
  
  // Create a single shared state instance
  const sharedVescState = useVescState();
  
  // Custom render function that passes the shared state
  const renderScene = ({ route }) => {
    switch (route.key) {
      case 'first':
        return <Page1 vescState={sharedVescState} />;
      case 'second':
        return <Page2 />;
      case 'third':
        return <Page3 vescState={sharedVescState} />;
      default:
        return null;
    }
  };

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      swipeEnabled={true}
      renderTabBar={props => (
        <TabBar
          {...props}
          style={styles.tabBar}
          indicatorStyle={{ backgroundColor: 'black' }}
          labelStyle={{ color: 'white', fontWeight: 'bold' }}
          activeColor="white"
          inactiveColor="gray"
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: 'black',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
