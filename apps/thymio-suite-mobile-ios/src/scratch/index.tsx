/* eslint-disable @typescript-eslint/no-unused-vars */


/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
  Dimensions,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import Dialog from 'react-native-dialog';
import {WebView, WebViewNavigation} from 'react-native-webview';
import LaucherIcon from '../assets/launcher-icon-scratch';
import BackIcon from '../assets/back-icon';
import CloseIcon from '../assets/launcher-icon-close';
import HelpIcon from '../assets/launcher-icon-help-blue';
import {CommonActions} from '@react-navigation/native';

import {useTdm} from '../hooks/useTdm';
import {getPathAfterLocalhost, getQueryParams} from '../helpers/parsers';
import {useLanguage} from '../i18n';

import Share from 'react-native-share';

import ReactNativeBlobUtil from 'react-native-blob-util';
import useAsyncStorageArray from '../components/Sidebar/useAccesTDM';

function App({navigation}: any): JSX.Element {
  const {language, i18n} = useLanguage();
  const [data, setData] = useAsyncStorageArray('accessTDMServices', []);

  const webViewRef = useRef<any>(null);
  const [LTServices, setLTServices] = useState({});
  const {services, status, discovery} = useTdm();
  const isDarkMode = useColorScheme() === 'dark';
  const [cycle, setCycle] = useState(2);
  const [first, setFirst] = useState(true);
  const [webview, setWebview] = useState('scanner');
  const [queryParams, setQueryParams] = useState<any>({});

  const [dialogVisible, setDialogVisible] = useState<string | null>(null);
  const [fileName, setFileName] = useState('scratch-program');

  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  // Función para mostrar el diálogo
  const showDialog = (base64Data: string) => {
    setDialogVisible(base64Data);
  };

  // Función que se llama cuando el usuario confirma el nombre del archivo
  const handleSave = () => {
    setDialogVisible(null);
    console.log('El usuario ha elegido el nombre:', fileName);
    if (dialogVisible) {
      saveBase64File(dialogVisible, fileName + '.sb3');
    }
  };

  const shareFile = async (filePath: any) => {
    console.log(`Intentando compartir archivo: ${filePath}`); // Asegúrate de que esto se imprima
    try {
      const shareResponse = await Share.open({
        url: `file://${filePath}`,
      });
      console.log('Archivo compartido con éxito:', shareResponse);
    } catch (error) {
      console.log('Error al compartir el archivo:', error);
    }
  };

  const saveBase64File = async (base64Data: string, filename: string) => {
    try {
      // Verifica que dirs y DocumentDirectoryPath están correctamente definidos
      console.log('The document directory is: ', ReactNativeBlobUtil.fs.dirs);

      const documentDir = ReactNativeBlobUtil.fs.dirs.DocumentDir;
      if (!documentDir) {
        console.error('the document directory is not available');
        return;
      }

      const path = `${documentDir}/${filename}`;

      // Asegúrate de que base64Data no incluya el prefijo de datos; si es así, elimínalo.
      if (base64Data.startsWith('data:')) {
        base64Data = base64Data.split(',')[1];
      }

      await ReactNativeBlobUtil.fs.writeFile(path, base64Data, 'base64');
      console.log('The file saved successfully in path:', path);

      Alert.alert(
        i18n.t('scratch_save_success'),
        i18n.t('scratch_save_options'),
        [
          {text: i18n.t('scratch_save_continue'), onPress: () => {}},
          {text: i18n.t('scratch_save_share'), onPress: () => shareFile(path)},
        ],
      );

      return path;
    } catch (error) {}
  };

  const onBackPress = () => {
    webview !== 'scratch'
      ? navigation.dispatch(CommonActions.goBack())
      : // Mostrar una alerta al usuario antes de ir hacia atrás
        Alert.alert(
          i18n.t('vpl3_confirm_quit1'), // Título de la alerta
          i18n.t('vpl3_confirm_quit2'), // Mensaje de la alerta
          [
            {
              text: i18n.t('scratch_cancel'),
              onPress: () => console.log('Annulation'), // No hace nada, solo cierra la alerta
              style: 'cancel',
            },
            {
              text: i18n.t('scratch_quit'),
              onPress: () => navigation.dispatch(CommonActions.goBack()), // Si el usuario confirma, navega hacia atrás
            },
          ],
          {cancelable: true}, // Permite cerrar la alerta tocando fuera de ella
        );
  };

  React.useEffect(() => {
    // Use `setOptions` to update the button that we previously specified
    // Now the button includes an `onPress` handler to update the count
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.titleContainer}>
          <LaucherIcon />
          {webview === 'scratch' ? (
            <Text style={styles.titleBar}>{`${queryParams?.name}`}</Text>
          ) : (
            <Text style={styles.titleBar}>Scratch</Text>
          )}
        </View>
      ),
      headerRight: () => (
        <View style={styles.titleContainer}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'https://www.thymio.org/fr/produits/programmer-avec-thymio-suite/programmer-avec-scratch/',
              )
            }>
            <HelpIcon />
          </TouchableOpacity>
          <View style={{width: 10}} />
          <TouchableOpacity onPress={() => onBackPress()}>
            <CloseIcon />
          </TouchableOpacity>
        </View>
      ),
      headerLeft: () => (
        <View>
          <TouchableOpacity onPress={() => onBackPress()}>
            <BackIcon />
          </TouchableOpacity>
        </View>
      ),
      headerTitleAlign: 'center',
    });
  }, [navigation, webview]);

  useEffect(() => {
    discovery.scan();
  }, []);

  useEffect(() => {
    if (services) {
      if (
        (first && JSON.stringify(services) !== '{}') ||
        (cycle >= 2 &&
          JSON.stringify(LTServices) !== JSON.stringify(services)) ||
        (JSON.stringify(LTServices) === '{}' &&
          JSON.stringify(services) !== '{}') ||
        (JSON.stringify(LTServices) !== JSON.stringify(services) &&
          JSON.stringify(services) !== '{}')
      ) {
        const names = data
          .filter((options: any) => options.isAceepted)
          .map((item: any) => item.name);
        const servicesLT = {...services};

        const resutl = Object.entries(servicesLT)
          .map(([key, value]) => ({
            key,
            ...value,
          }))
          .filter((item: any) => names.includes(item.key))
          .reduce((acc: any, item: any) => ({...acc, [item.key]: item}), {});

        setLTServices(resutl);
        setFirst(false);
      }

      // compare services object with LTServices object and update LTServices only if there is a change
      if (
        cycle < 2 &&
        JSON.stringify(services) === '{}' &&
        JSON.stringify(LTServices) !== '{}'
      ) {
        setCycle(cycle + 1);
      } else {
        setCycle(0);
      }

      console.log(
        'Cycle:',
        'http://127.0.0.1:3000/scanner/index.html' +
          `?data=${JSON.stringify({...LTServices})}&gl=${JSON.stringify({
            interface: 'scratch',
          })}&lang=${language}`,
      );
    }
  }, [services]);

  const handleOnMessage = async (event: {nativeEvent: {data: any}}) => {
    const _data = event.nativeEvent.data;
    const {type, payload} = JSON.parse(_data);

    const base64Data = payload;

    console.log('HandleOnMessage:', type);
    showDialog(base64Data);
  };

  const handleNavigationStateChange = useCallback((event: any) => {
    // console.log('Evento de navegación:', event.url);
    setWebview(getPathAfterLocalhost(event.url));
    setQueryParams(getQueryParams(event.url));
    // console.log('webview', event.url);
  }, []);

  const injectedJavaScript = `
  true;
`;

  const openURL = (_url: string) => {
    Linking.canOpenURL(_url)
      .then(supported => {
        if (supported) {
          Linking.openURL(_url);
        } else {
          Alert.alert('Error', `No se puede manejar la URL: ${_url}`);
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={{marginTop: 22}}>
        <Dialog.Container visible={dialogVisible !== null}>
          <Dialog.Title>{i18n.t('scratch_saveForm_title')}</Dialog.Title>
          <Dialog.Description>
            {i18n.t('scratch_saveForm_info')}
          </Dialog.Description>
          <Dialog.Input
            wrapperStyle={{
              borderWidth: 1,
              borderColor: 'gray',
              borderRadius: 5,
            }}
            onChangeText={text => setFileName(text)}
            value={fileName}
          />
          <Dialog.Button
            label={i18n.t('scratch_saveForm_labelButton_calcel')}
            onPress={() => setDialogVisible(null)}
          />
          <Dialog.Button
            label={i18n.t('scratch_saveForm_labelButton_save')}
            onPress={handleSave}
          />
        </Dialog.Container>
      </View>
      <View style={styles.rootHiddenContainer}>
        <View style={styles.hiddenContainer}>
          <View style={{height: 25}} />
          <WebView
            onMessage={handleOnMessage}
            ref={webViewRef}
            startInLoadingState
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            source={{
              uri:
                'http://127.0.0.1:3000/scanner/index.html' +
                `?data=${JSON.stringify({...LTServices})}&gl=${JSON.stringify({
                  interface: 'scratch',
                })}&lang=${language}`,
            }}
            injectedJavaScript={injectedJavaScript}
            style={{flex: 1}}
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={(request: WebViewNavigation) => {
              // console.log('request.url::--->', request.url);
              if (request.url.includes('localhost')) {
                return true;
              }

              if (request.url.includes('blob:')) {
                return true;
              }

              if (request.url.includes('127.0.0.1')) {
                return true;
              }

              // openURL(request.url);
              return true;
            }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

export default App;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
  },
  rootContainer: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    backgroundColor: 'white',
  },
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rootHiddenContainer: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    position: 'absolute',
    // transform: [{ translateX: -Dimensions.get('window').width }],
    // display: 'none',
    zIndex: 1,
    backgroundColor: 'white',
  },
  hiddenContainer: {
    flex: 1,
    height: Dimensions.get('screen').height - 25,
    width: Dimensions.get('screen').width,
    position: 'absolute',
    // transform: [{ translateX: -Dimensions.get('window').width }],
    // display: 'none',
    zIndex: 2,
    backgroundColor: 'white',
  },
  header: {
    fontWeight: 'bold',
    marginBottom: 20,
    fontSize: 36,
  },
  titleBar: {
    color: 'white',
    // fontFamily: 'roboto',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 10,
  },
  titleContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
