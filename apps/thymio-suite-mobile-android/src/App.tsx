import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import HomeScreen from './Home';
import Scratch from './scratch';
import Vpl3 from './vpl3';
import RobotSelect from './RobotSelect';
import {createContext, useContext, useState} from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  View,
  Text,
} from 'react-native';
import WelcomeScreen from './firstUse';
import {useFirstUseState} from './hooks/useFirstTime';
import Logo from './assets/logo-thymio';
import {useLanguage} from './i18n';
import { TdmDiscovery } from './packages/TdmDIscovery/TdmDiscovery';

const Stack = createNativeStackNavigator();

// Crea un contexto con un estado inicial
const LoadingContext = createContext({
  loading: true,
  setLoading: (loading: boolean) => {},
});

// Hook personalizado para usar el contexto
export const useLoading = () => useContext(LoadingContext);

const App = () => {
  const [firstUse, setFirstUse] = useFirstUseState();
  const [startVue, setStartVue] = useState(true);
  const {loading, setLoading, language, i18n} = useLanguage();

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <View style={styles.containerTitle}>
          <Logo />
          <Text style={styles.titleText}>{i18n.t('common_loading')}</Text>
        </View>
      </View>
    );
  }

  if (startVue) {
    return (
      <WelcomeScreen
        firstUse={firstUse}
        setLoading={setLoading}
        setFirstUse={(v: boolean) => {
          setStartVue(false);
          setFirstUse(false);
        }}
      />
    );
  }

  return (
    <LoadingContext.Provider value={{loading, setLoading}}>
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
          }}>
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: ''}}
          />
          <Stack.Screen
            name="Scratch"
            component={Scratch}
            options={{title: 'Scratch', gestureEnabled: false}}
          />
          <Stack.Screen
            name="VPL3"
            component={Vpl3}
            options={{title: 'VPL3', gestureEnabled: false}}
          />
          <Stack.Screen
            name="RobotSelect"
            component={RobotSelect}
            options={{title: 'RobotSelect'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </LoadingContext.Provider>
  );
};

export default App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('window').height,
    width: Dimensions.get('window').width,
    margin: 0,
    padding: 0,
  },
  stretchTablet: {
    width: Dimensions.get('window').width * 0.18,
    height: Dimensions.get('window').width * 0.18,
    // height: 200,
    resizeMode: 'contain',
    margin: 0,
    padding: 0,
  },
  stretchMobile: {
    width: Dimensions.get('window').width * 0.12,
    height: Dimensions.get('window').width * 0.12,
    // height: 200,
    resizeMode: 'contain',
    margin: 0,
    padding: 0,
  },
  AppsContainerTablet: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    width: Dimensions.get('window').width,
    maxWidth: 900,
    margin: 0,
    padding: 0,
  },
  AppsContainerMobile: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    width: Dimensions.get('window').width,
    maxWidth: Dimensions.get('window').width / 2,
    margin: 0,
    padding: 0,
  },
  Apps: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    // flexDirection: 'column',
    margin: 0,
    padding: 0,
    // backgroundColor: '#f00',
  },
  containerTitle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Dimensions.get('window').height * 0.09,
  },
  constainerFirstUse: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: 'red',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    color: '#222',
  },
  subtitleText: {
    fontSize: 16,
    marginTop: 2,
    marginBottom: 20,
    color: '#555',
  },
  containerFooter: {
    width: Dimensions.get('window').width * 1,
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
});
