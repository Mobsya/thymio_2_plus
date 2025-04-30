import React from 'react';
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
import {useLoading} from './App';
import {useLanguage} from './i18n';
import { Menu } from './components/Menu';

function App({navigation}: any): JSX.Element {
  const {i18n} = useLanguage();

  const {loading, setLoading} = useLoading();
  const isDarkMode = useColorScheme() === 'dark';

  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.root}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
          hidden
        />
        <Menu setLoading={setLoading}/>
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
      <Menu setLoading={setLoading}/>

      <View style={styles.containerTitle}>
        <Logo />
        <Text style={styles.titleText}>{i18n.t('title_welcome')}</Text>
        <Text>{i18n.t('subtitle_welcome')}</Text>
      </View>
      <View style={styles.AppsContainer}>
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
              style={styles.stretch}
              source={logo}
            />
          </View>
        </TouchableOpacity>
        ))}
      </View>
      <View style={styles.containerFooter}>
        <Text>v3.5.0</Text>
      </View>
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
  stretch: {
    width: Dimensions.get('window').width * 0.18,
    height: Dimensions.get('window').width * 0.18,
    // height: 200,
    resizeMode: 'contain',
    margin: 0,
    padding: 0,
  },
  AppsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    width: Dimensions.get('window').width,
    maxWidth: 900,
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
  },
  containerTitle: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Dimensions.get('window').height * 0.09,
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
  },
  containerFooter: {
    width: Dimensions.get('window').width * 1,
    position: 'absolute',
    bottom: 0,
    paddingHorizontal: 20,
    paddingVertical: 50,
  },
});
