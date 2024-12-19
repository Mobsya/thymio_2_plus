import React, {useEffect, useState} from 'react';
import {
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Dimensions,
  TouchableOpacity,
  Image,
} from 'react-native';
import Logo from './assets/logo-thymio';
import {useLanguage} from './i18n';
import DeviceInfo from 'react-native-device-info';
import { Menu } from './components/Menu';

const isTablet = DeviceInfo.isTablet();

function App({navigation}: any): JSX.Element {
  const {language, i18n} = useLanguage();

  const [loading, setLoading] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  // useEfffect for a setTimout to simulate a loading screen
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 800);
  }, [setLoading]);

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

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
        hidden
      />
      <Menu setLoading={setLoading} />

      <View style={styles.containerTitle}>
        <Logo />
        <Text style={styles.titleText}>{i18n.t('title_welcome')}</Text>
        <Text style={styles.subtitleText}>{i18n.t('subtitle_welcome')}</Text>
      </View>
      <View
        style={
          isTablet ? styles.AppsContainerTablet : styles.AppsContainerMobile
        }>
        {[
          {
            logo: require('./assets/vpl3-animated-icon.webp'),
            name: 'VPL3',
          },
          {
            logo: require('./assets/scratch-animated-icon.webp'),
            name: 'Scratch',
          },
        ].map(({logo, name}) => (
          <TouchableOpacity
            key={name}
            onPress={() => navigation.navigate('RobotSelect', { programmingEnv: name })}>
            <View style={{...styles.Apps}}>
              <Image
                style={isTablet ? styles.stretchTablet : styles.stretchMobile}
                source={logo}
              />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.versionString}>v3.3.0</Text>
    </View>
  );
}

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
  versionString: {
    position: 'absolute',
    bottom: 10
  }
});
