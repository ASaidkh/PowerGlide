import React, { useState } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { TabView, SceneMap, TabBar } from 'react-native-tab-view';

const Page1 = () => (
  <View style={[styles.page, { backgroundColor: 'lightgreen' }]}>
    <Text>Page 1</Text>
  </View>
);

const Page2 = () => (
  <View style={[styles.page, { backgroundColor: 'white' }]}>
    <Text>Page 2</Text>
  </View>
);

const Page3 = () => (
  <View style={[styles.page, { backgroundColor: 'powderblue' }]}>
    <Text>Page 3</Text>
  </View>
);

const renderScene = SceneMap({
  first: Page1,
  second: Page2,
  third: Page3,
});

export default function App() {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: 'first', title: 'Page 1' },
    { key: 'second', title: 'Page 2' },
    { key: 'third', title: 'Page 3' },
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
          labelStyle={{ color: 'black', fontWeight: 'bold' }}
          activeColor="black"
          inactiveColor="gray"
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBar: {
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
