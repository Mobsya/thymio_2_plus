import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './Home';
import RobotSelect from './RobotSelect';
import Scratch from './scratch';
import VPL3 from './vpl3';

const Stack = createNativeStackNavigator();

// Create a context for loading state
const LoadingContext = createContext({
  loading: false,
  setLoading: (loading: boolean) => {},
});

// Custom hook for loading context
export const useLoading = () => useContext(LoadingContext);

const App = () => {
  const [loading, setLoading] = useState(false);

  return (
    <LoadingContext.Provider value={{ loading, setLoading }}>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerStyle: {
              backgroundColor: '#201439',
            },
            headerTintColor: '#fff',
            headerTitleStyle: {
              fontWeight: 'bold',
            },
          }}
        >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: '' }}
        />
        <Stack.Screen
          name="RobotSelect"
          component={RobotSelect}
          options={{title: 'Select a robot'}}
        />
        <Stack.Screen
          name="Scratch"
          component={Scratch}
          options={{ title: 'Scratch', gestureEnabled: false }}
        />
        <Stack.Screen
          name="VPL3"
          component={VPL3}
          options={{ title: 'VPL3', gestureEnabled: false }}
        />
        </Stack.Navigator>
      </NavigationContainer>
    </LoadingContext.Provider>
  );
};

export default App;
