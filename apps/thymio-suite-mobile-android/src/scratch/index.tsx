/* eslint-disable indent */
/* eslint-disable @typescript-eslint/indent */
/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';

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
  Platform,
  PermissionsAndroid,
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import Dialog from 'react-native-dialog';

import {WebView, WebViewNavigation} from 'react-native-webview';
import LaucherIcon from '../assets/launcher-icon-scratch';
import BackIcon from '../assets/back-icon';
import CloseIcon from '../assets/launcher-icon-close';
import HelpIcon from '../assets/launcher-icon-help-blue';
import {CommonActions} from '@react-navigation/native';

import {getPathAfterLocalhost, getQueryParams} from '../helpers/parsers';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLanguage} from '../i18n';

import useAsyncStorageArray from '../components/Sidebar/useAccesTDM';
import DeviceInfo from 'react-native-device-info';
import { RobotService } from '../packages/TdmDIscovery/TdmDiscovery';

const isTablet = DeviceInfo.isTablet();

const tdmDiscoveryService = new RobotService();

function usePersistentState(key: any, initialValue: any) {
  const {language, i18n} = useLanguage();

  const [state, setState] = useState(initialValue);

  // Cargar el estado guardado al inicializar
  useEffect(() => {
    const loadStoredState = async () => {
      try {
        const storedState = await AsyncStorage.getItem(key);

        if (storedState !== null) {
          setState(JSON.parse(storedState));
        }
      } catch (error) {
        console.error('Error to load saved state:', error);
      }
    };

    loadStoredState();
  }, [key]);

  const asyncSetState = async (newState: any, callback = () => {}) => {
    try {
      const stateToSave = newState !== undefined ? newState : state;
      await AsyncStorage.setItem(key, JSON.stringify(stateToSave));
      callback();
    } catch (error) {
      Alert.alert(i18n.t('vpl3_error_to_saved_program'), JSON.stringify(error));
    }
  };

  useEffect(() => {
    const _saveState = async () => {
      try {
        await AsyncStorage.setItem(key, JSON.stringify(state));
      } catch (error) {
        Alert.alert(
          i18n.t('vpl3_error_to_saved_program'),
          JSON.stringify(error),
        );
      }
    };

    _saveState();
  }, [state, key]);

  return [state, setState, asyncSetState];
}

function App({navigation}: any): JSX.Element {
  const {language, i18n} = useLanguage();
  const [data, setData] = useAsyncStorageArray('accessTDMServices', []);

  const webViewRef = useRef<any>(null);
  const [LTServices, setLTServices] = useState({});
  const isDarkMode = useColorScheme() === 'dark';
  const [cycle, setCycle] = useState(2);
  const [first, setFirst] = useState(true);
  const [webview, setWebview] = useState('scanner');
  const [queryParams, setQueryParams] = useState<any>({});
  const [url, setUrl] = useState<string>('');
  const [dialogVisible, setDialogVisible] = useState<string | null>(null);
  const [fileName, setFileName] = useState('vpl3-program');

  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  const onBackPress = () => {
    webview !== 'scratch'
      ? navigation.dispatch(CommonActions.goBack())
      : Alert.alert(
          i18n.t('vpl3_confirm_quit1'),
          i18n.t('vpl3_confirm_quit2'),
          [
            {
              text: i18n.t('scratch_cancel'),
              onPress: () => console.log('Annulation'),
              style: 'cancel',
            },
            {
              text: i18n.t('scratch_quit'),
              onPress: () => {
                navigation.dispatch(CommonActions.goBack());
              },
            },
          ],
          {cancelable: true},
        );
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

  const saveJsonFile = async (base64data: string | null, filename: string) => {
    try {
      const documentDir = ReactNativeBlobUtil.fs.dirs.LegacyDownloadDir;
      if (!documentDir) {
        console.error('The document directory is not available');
        return;
      }

      if (!base64data) {
        console.error('No data to save');
        return;
      }

      const base64 = base64data.split('base64,')[1];
      let path = `${documentDir}/${filename}`;
      let fileExists = await ReactNativeBlobUtil.fs.exists(path);
      let index = 0;

      while (fileExists) {
        index++;
        const newPath = `${documentDir}/${filename.split('.').slice(0, -1).join('.') + '(' + index + ')' + '.' + filename.split('.').pop()}`;
        fileExists = await ReactNativeBlobUtil.fs.exists(newPath);
        if (!fileExists) {
          Alert.alert(
            i18n.t('file_exist'),
            i18n.t('file_exist_message', {name: filename}),
            [
              {
                text: 'No',
                onPress: () => {
                  setDialogVisible(base64data);
                },
                style: 'cancel',
              },
              {
                text: 'OK',
                onPress: async () => {
                  await ReactNativeBlobUtil.fs.createFile(
                    newPath,
                    base64,
                    'base64',
                  );

                  Alert.alert(
                    i18n.t('scratch_save_success'),
                    i18n.t('scratch_save_options'),
                    [
                      {
                        text: i18n.t('scratch_save_continue'),
                        onPress: () => {},
                      },
                      {
                        text: i18n.t('scratch_save_share'),
                        onPress: () => shareFile(newPath),
                      },
                    ],
                  );
                },
              },
            ],
            {cancelable: false},
          );
          return;
        }
      }

      await ReactNativeBlobUtil.fs.createFile(path, base64, 'base64');
      Alert.alert(
        i18n.t('scratch_save_success'),
        i18n.t('scratch_save_options'),
        [
          {text: i18n.t('scratch_save_continue'), onPress: () => {}},
          {
            text: i18n.t('scratch_save_share'),
            onPress: () => shareFile(path),
          },
        ],
      );
    } catch (error) {
      console.error('Error saving the JSON file:', error);
    }
  };

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.titleContainer}>
          <LaucherIcon />
          {webview === 'scratch' ? (
            <Text style={styles.titleBar}>{`${queryParams?.name}`}</Text>
          ) : (
            <Text style={styles.titleBar}>SCRATCH</Text>
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
      headerBackVisible: false,
    });
  }, [navigation, webview, webViewRef]);

  useEffect(() => {
    const fetchServices = async () => {
      const services = await tdmDiscoveryService.scan();
      console.log('[FOUND SERVICES]', services);
      setLTServices(services);
    }

    fetchServices();
  }, []);

  const [host, setHost] = useState<string | undefined>(undefined);

  const handleOnMessage = (event: {nativeEvent: {data: any}}) => {
    const _data = event.nativeEvent.data;

    if (
      !_data ||
      _data === 'null' ||
      _data === 'undefined' ||
      _data[0] === '<'
    ) {
      return;
    }

    try {
      const objectData = JSON.parse(_data);

      if (objectData.spec === 'openUrl') {
        const newHost =
          Platform.OS === 'android'
            ? 'file:///android_asset'
            : 'http://127.0.0.1:3000';

        setUrl(newHost + objectData.url);
      } else if (objectData.spec === 'alert') {
        // console.log('Alerta', objectData.payload);
      } else {
        setDialogVisible(objectData.payload);
      }
    } catch (error) {
      console.log('Error to parse data:', error);
    }
  };

  const deberíaDescargar = useCallback((_url: string) => {
    return _url.includes('blob:');
  }, []);

  const handleNavigationStateChange = useCallback(
    (event: any) => {
      if (Platform.OS === 'android') {
        if (event.title === 'Scratch 3.0 GUI') {
          setWebview('scratch');
          setQueryParams(getQueryParams(event.url));
          setUrl(event.url);
        }
        return;
      }

      if (deberíaDescargar(event.url)) {
        webViewRef.current?.stopLoading();
      } else {
        setWebview(getPathAfterLocalhost(event.url));
        setQueryParams(getQueryParams(event.url));
        setUrl(event.url);
      }
    },
    [deberíaDescargar],
  );

  const handleSave = () => {
    saveJsonFile(dialogVisible, fileName + '.sb3');
    setDialogVisible(null);
  };

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

  useEffect(() => {
    const newHost = 'file:///android_asset';

    setHost(newHost);
    setUrl(
      `${newHost}/scanner/index.html?data=${JSON.stringify({...LTServices})}&gl=${JSON.stringify(
        {
          interface: 'scratch',
          redirect: 'file:///android_asset/scratch/index.html',
        },
      )}&lang=${language}&isTablet=${JSON.stringify(isTablet)}`,
    );
  }, [Platform.OS, LTServices, language]);

  if (host === undefined || url === '') {
    return (
      <SafeAreaView style={styles.root}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={backgroundStyle.backgroundColor}
        />
        <View style={{marginTop: 22}} />
        <View style={styles.rootHiddenContainer}>
          <View style={styles.hiddenContainer}>
            <View style={{height: 25}} />
            <View style={styles.root}>
              <Text>{i18n.t('common_loading')}</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={backgroundStyle.backgroundColor}
      />
      <View style={styles.rootHiddenContainer}>
        <View style={styles.hiddenContainer}>
          <Dialog.Container visible={dialogVisible !== null}>
            <Dialog.Title style={{color: 'black'}}>
              {i18n.t('scratch_saveForm_title')}
            </Dialog.Title>
            <Dialog.Description style={{color: 'black'}}>
              {i18n.t('scratch_saveForm_info')}
            </Dialog.Description>
            <Dialog.Input
              wrapperStyle={{
                borderWidth: 1,
                borderColor: 'gray',
                borderRadius: 2,
              }}
              style={{color: 'black'}}
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
          <WebView
            onMessage={handleOnMessage}
            ref={webViewRef}
            startInLoadingState
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            source={{
              uri: url,
            }}
            style={{flex: 1}}
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            onShouldStartLoadWithRequest={(webRequest: WebViewNavigation) => {
              console.log('request.url::--->', webRequest.url);

              if (webRequest.url.includes('localhost')) {
                return true;
              }

              if (webRequest.url.includes('blob:')) {
                console.log('blob:---> aqui');
                return false;
              }

              if (webRequest.url.includes('127.0.0.1')) {
                return true;
              }

              if (webRequest.url.includes('file:///android_asset')) {
                return true;
              }

              openURL(webRequest.url);
              return false;
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
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
  },
  rootHiddenContainer: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    backgroundColor: 'white',
  },
  hiddenContainer: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
  },
  header: {
    fontWeight: 'bold',
    fontSize: 36,
  },
  titleBar: {
    color: 'white',
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
