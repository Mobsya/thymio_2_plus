import React from 'react';
import {
  View,
  Text,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import {useFirstUseState} from './hooks/useFirstTime';
import Logo from './assets/logo-thymio';
import {Menu} from './components/Menu';
import {LanguageSelector, useLanguage} from './i18n';

const StartVue = ({setStartVue}: any) => {
  const {language, i18n} = useLanguage();

  const handleContinuePress = () => {
    console.log('Continuar');
    setStartVue(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{paddingTop: 15, paddingLeft: 15}}>
          <Logo />
        </View>
        <LanguageSelector />
      </View>
      <View style={styles.middle}>
        <Text style={styles.welcome}>
          {i18n.t('welcome_to_tyhmioSuiteMobile')}
        </Text>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoText}>
            Pour programmer un robot thymio, vous devez posseder un robot
            Thymio2 conecté a un router Thymio2+ ou a un ordinateur releais
          </Text>
        </View>
        <TouchableOpacity onPress={handleContinuePress}>
          <View style={styles.continuerButton}>
            <Text style={styles.textContinuerButton}>
              Me connecter a un Thymio2+ oz
            </Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleContinuePress}>
          <View style={styles.continuerButton}>
            <Text style={styles.textContinuerButton}>
              {i18n.t('welcome_continue_buton')}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.footer}>
        <Text style={styles.terms}>{i18n.t('welcome_policy_message')}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingTop: 10,
    paddingBottom: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    width: '100%',
    // backgroundColor: 'red',
  },
  logo: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  lang: {
    fontSize: 16,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    marginBottom: 20,
  },
  footer: {
    width: '100%',
  },
  terms: {
    textAlign: 'center',
    fontSize: 13,
    color: '#555',
  },
  continuerButton: {
    backgroundColor: '#0A9EEB',
    padding: 10,
    borderRadius: 5,
  },
  textContinuerButton: {
    color: 'white',
    fontSize: 16,
  },
  infoTextContainer: {
    width: '80%',
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#555',
  },
});

export default StartVue;
