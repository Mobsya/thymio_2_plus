/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, createContext, useContext } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaticServer from 'react-native-static-server'; // Using the given implementation
import RNFS from 'react-native-fs'; // Required for file system paths
import HomeScreen from './Home';
import Scratch from './scratch';
import Vpl3 from './vpl3';
import Thymio2pConfigurator from './Thymio2pConfigurator';

const Stack = createNativeStackNavigator();

// Define your static server states
const STATES = {
  ACTIVE: 'active',
  STARTING: 'starting',
  STOPPING: 'stopping',
  CRASHED: 'crashed',
  INACTIVE: 'inactive',
};

// Create a context for loading state
const LoadingContext = createContext({
  loading: true,
  setLoading: (loading: boolean) => {},
  serverUrl: '',
});

// Custom hook for loading context
export const useLoading = () => useContext(LoadingContext);

// Hook for tracking app state (foreground/background)
const useAppState = (): AppStateStatus => {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      setAppState(nextAppState);
    });

    return () => {
      subscription.remove();
    };
  }, []);

  return appState;
};

const App = () => {
  const [serverUrl, setServerUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const path = `${RNFS.MainBundlePath}/www`;

    // for debug
    RNFS.readDir(path).then((files) => {
      console.log('Files in www directory: ', JSON.stringify(files.map(({name})=>name), null, 2));
    });

    const server = new StaticServer(3000, path, { localOnly: true, keepAlive : true });

    server.start().then((url:string) => {
      setServerUrl(`${url}`);
      console.log('Server running at:', url);
      setLoading(false);

    });

    // Stop the server when the component unmounts
    return () => {
      server.stop().then(() => {
        console.log('Server stopped');
      }).catch((error) => {
        console.error('Error stopping server:', error);
      });
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ loading, setLoading, serverUrl }}>
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
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: '' }} />
          <Stack.Screen name="Scratch" component={Scratch} options={{ title: 'Scratch', gestureEnabled: false }} />
          <Stack.Screen name="VPL3" component={Vpl3} options={{ title: 'VPL3', gestureEnabled: false }} />
          <Stack.Screen name="Thymio2pConfigurator" component={Thymio2pConfigurator} options={{ title: 'Thymio2+ configuration', gestureEnabled: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </LoadingContext.Provider>
  );
};

export default App;
