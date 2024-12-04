/* eslint-disable react-native/no-inline-styles */
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
import ThymioLeftSide from './assets/thymio-left-side';
import {Menu} from './components/Sidebar/menu';
import {LanguageSelector, useLanguage} from './i18n';
import DeviceInfo from 'react-native-device-info';
import FullScreenModal from './components/Modal';
import Policy from './components/Policy';

const isTablet = DeviceInfo.isTablet();

type ClickableLinkTextProps = {
  normalText: string;
  linkText: string;
  onPressLink: () => void;
};

const ClickableLinkText = ({
  normalText,
  linkText,
  onPressLink,
}: ClickableLinkTextProps) => {
  const fisrt = normalText.split('###')[0];
  const last = normalText.split('###')[1];

  return (
    <Text
      style={{...stylesClickableLinkText.text, fontSize: isTablet ? 16 : 12}}>
      {fisrt}
      <Text style={stylesClickableLinkText.link} onPress={onPressLink}>
        {linkText}
      </Text>
      {last}
    </Text>
  );
};

const stylesClickableLinkText = StyleSheet.create({
  text: {
    fontSize: 14,
    color: '#555',
  },
  link: {
    color: 'blue',
    textDecorationLine: 'underline',
  },
});

const WelcomeScreen = ({setFirstUse, setLoading}: any) => {
  const [openModal, setOpenModal] = React.useState(false);
  const [openVC, setOpenVC] = React.useState(false);
  const {language, i18n} = useLanguage();

  const handleContinuePress = () => {
    console.log('Continuar');
    setFirstUse(false);
  };

  return (
    <View style={styles.container}>
      <FullScreenModal open={openModal} onClose={setOpenModal}>
        <Policy />
      </FullScreenModal>
      <View style={styles.header}>
        <View style={{paddingTop: 8, paddingLeft: 8}}>
          <Logo />
        </View>
        <LanguageSelector setLoading={setLoading} />
      </View>
      <View style={styles.middle}>
        {isTablet ? (
          <Text style={styles.welcome}>
            {i18n.t('welcome_to_tyhmioSuiteTablet')}
          </Text>
        ) : (
          <Text style={styles.welcome}>
            {i18n.t('welcome_to_tyhmioSuitePhone')}
          </Text>
        )}

        <ThymioLeftSide />

        {/*

          isTablet ? (
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoText}>
              {i18n.t('welcome_message_tablet')}
            </Text>
            <View style={{height: 30}} />
          </View>
        ) : (
          <View style={{...styles.infoTextContainer}}>
            <Text
              style={{
                ...styles.infoText,
                fontSize: 12,
                textAlign: 'justify',
                maxWidth: '80%',
              }}>
              {i18n.t('welcome_message_phone')}
            </Text>
          </View>
        )
          */}

        <TouchableOpacity onPress={handleContinuePress}>
          <View style={styles.continuerButton}>
            <Text
              style={{
                ...styles.textContinuerButton,
                fontSize: isTablet ? 16 : 14,
              }}>
              {i18n.t('welcome_continue')}
            </Text>
          </View>
        </TouchableOpacity>
        {/*

        <TouchableOpacity onPress={() => setOpenVC(true)}>
          <View style={styles.skipButton}>
            <Text
              style={{...styles.textSkipButton, fontSize: isTablet ? 16 : 14}}>
              Verifier ma conexion au Thymio2+
            </Text>
          </View>
        </TouchableOpacity>

        */}
      </View>
      <View style={styles.footer}>
        <ClickableLinkText
          normalText={i18n.t('welcome_policy_message')}
          linkText={i18n.t('terms_and_conditions_document')}
          onPressLink={() => setOpenModal(true)}
        />
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
    position: 'absolute',
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcome: {
    fontSize: 24,
    marginBottom: 4,
  },
  footer: {
    width: '90%',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
  },
  terms: {
    textAlign: 'center',
    fontSize: 13,
    color: '#555',
  },
  continuerButton: {
    backgroundColor: '#0A9EEB',
    padding: 8,
    margin: 2,
    borderRadius: 5,
  },
  skipButton: {
    padding: 8,
    margin: 2,
    borderRadius: 5,
  },
  textSkipButton: {
    color: '#0A9EEB',
    fontSize: 16,
  },
  textContinuerButton: {
    color: 'white',
    fontSize: 16,
  },
  infoTextContainer: {
    marginBottom: 10,
    marginTop: -10,
  },
  infoText: {
    fontSize: 13,
    textAlign: 'center',
    color: '#555',
    marginBottom: 4,
  },
});

export default WelcomeScreen;
