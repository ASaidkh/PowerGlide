import React, { useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';
import Page1 from './screens/Page1';
import Page2 from './screens/Page2';
import Page3 from './screens/Page3';

const renderScene = SceneMap({
  first: Page1,
  second: Page2,
  third: Page3,
});

export default function App() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'VESC' },
    { key: 'second', title: 'Camera' },
    { key: 'third', title: 'GPS' },
  ]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      onIndexChange={setIndex}
      initialLayout={{ width: layout.width }}
      swipeEnabled={true} // Allows swiping
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
