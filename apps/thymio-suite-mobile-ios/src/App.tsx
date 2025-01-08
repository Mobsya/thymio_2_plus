import React, { useState, useEffect, createContext, useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import StaticServer from 'react-native-static-server'; // Using the given implementation
import RNFS from 'react-native-fs';
import HomeScreen from './Home';
import RobotSelect from './RobotSelect';
import Scratch from './scratch';
import VPL3 from './vpl3';

const Stack = createNativeStackNavigator();

// Create a context for loading state
const LoadingContext = createContext({
  loading: true,
  setLoading: (loading: boolean) => {},
  serverUrl: '',
});

// Custom hook for loading context
export const useLoading = () => useContext(LoadingContext);

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
