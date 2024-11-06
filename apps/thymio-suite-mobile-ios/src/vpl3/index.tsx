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
} from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';
import Dialog from 'react-native-dialog';

import {WebView, WebViewNavigation} from 'react-native-webview';
import LaucherIcon from '../assets/launcher-icon-vpl';
import BackIcon from '../assets/back-icon';
import CloseIcon from '../assets/launcher-icon-close';
import HelpIcon from '../assets/launcher-icon-help-blue';
import {CommonActions} from '@react-navigation/native';

import {useTdm} from '../hooks/useTdm';
import {getPathAfterLocalhost, getQueryParams} from '../helpers/parsers';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {useLanguage} from '../i18n';

import DocumentPicker from 'react-native-document-picker';
import useAsyncStorageArray from '../components/Sidebar/useAccesTDM';

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

function App({navigation, serverUrl }: any): JSX.Element {
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
  const [url, setUrl] = useState<string | undefined>(undefined);
  const [dialogVisible, setDialogVisible] = useState<string | null>(null);
  const [fileName, setFileName] = useState('vpl3-program');
  const [config, setConfig, asyncSetConfig] = usePersistentState('vpl3Config', {
    basicBlocks: [
      'init',
      'button 1',
      'acc side',
      'acc upside down',
      'tap',
      'ground mean',
      'ground',
      'horiz prox',
      'color 8 state',
      'bottom color 8 state',
      'state 256',
      'move',
      'top color 8',
      'bottom color 8',
      'set state 256',
      'notes',
    ],
    basicMultiEvent: true,
    disabledUI: ['src:language', 'vpl:exportToHTML', 'vpl:flash'],
    program: [],
  });

  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  const loadJsonFile = async () => {
    try {
      // Abrir el selector de documentos para archivos JSON
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const res = results[0];

      // Res contiene varias propiedades, incluyendo URI, tipo, nombre del archivo, tamaño, etc.
      console.log('URI:', res.uri);
      console.log('Tipo:', res.type);
      console.log('Nombre del archivo:', res.name);
      console.log('Tamaño:', res.size);

      // read file from uri
      const file = await ReactNativeBlobUtil.fs.readFile(
        res.uri.replaceAll('file:///private', ''),
        'utf8',
      );

      console.log('File:', file);

      setConfig(JSON.parse(file));

      console.log('Programa cargado');
      webViewRef.current.reload();

      // Aquí puedes manejar el objeto JSON como necesites
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('Selección de archivo cancelada');
      } else {
        console.log('Error al seleccionar el archivo:', err);
      }
    }
  };

  const onBackPress = () => {
    console.log('webview', webview);
    webview !== 'vpl3'
      ? navigation.dispatch(CommonActions.goBack())
      : Alert.alert(
          i18n.t('vpl3_confirm_quit1'),
          i18n.t('vpl3_confirm_quit2'),
          [
            {
              text: i18n.t('vpl3_quit_calcel'),
              onPress: () => console.log('Annulation'),
              style: 'cancel',
            },
            {
              text: i18n.t('vpl3_quit_without_save'),
              onPress: () => {
                webViewRef.current.postMessage(
                  JSON.stringify({action: 'getProgram', spec: 'toQuit'}),
                );
              },
            },
            {
              text: i18n.t('vpl3_quit_with_save'),
              onPress: () => {
                // navigation.dispatch(CommonActions.goBack());
                if (webViewRef.current) {
                  webViewRef.current.postMessage(
                    JSON.stringify({
                      action: 'getProgram',
                      spec: 'toSaveAndQuit',
                    }),
                  );
                } else {
                  console.log('webViewRef.current no existe');
                }
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

  const saveJsonFile = async (
    jsonData: string,
    filename: string,
    quit: boolean,
  ) => {
    try {
      // Verifica que dirs y DocumentDirectoryPath están correctamente definidos
      console.log('The document directory is: ', ReactNativeBlobUtil.fs.dirs);

      const documentDir = ReactNativeBlobUtil.fs.dirs.DocumentDir;
      if (!documentDir) {
        console.error('The document directory is not available');
        return;
      }

      const path = `${documentDir}/${filename}`;

      // Asegúrate de que jsonData sea un string JSON válido, no es necesario
      // eliminar ningún prefijo de datos como en el caso de base64

      // Guardar el string JSON en el archivo
      await ReactNativeBlobUtil.fs.writeFile(path, jsonData, 'utf8');
      console.log('The file saved successfully in path:', path);

      if (quit) {
        Alert.alert(i18n.t('scratch_save_success'), '', [
          {
            text: i18n.t('scratch_save_continue'),
            onPress: () => {
              navigation.dispatch(CommonActions.goBack());
            },
          },
        ]);

        return path;
      }

      // Mostrar una alerta indicando éxito y opciones posteriores
      Alert.alert(
        i18n.t('scratch_save_success'),
        i18n.t('scratch_save_options'),
        [
          {text: i18n.t('scratch_save_continue'), onPress: () => {}},
          {text: i18n.t('scratch_save_share'), onPress: () => shareFile(path)},
        ],
      );

      return path;
    } catch (error) {
      console.error('Error saving the JSON file:', error);
      // Considera mostrar un mensaje de error al usuario
    }
  };

  React.useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.titleContainer}>
          <LaucherIcon />
          {webview === 'vpl3' ? (
            <Text style={styles.titleBar}>{`${queryParams?.name}`}</Text>
          ) : (
            <Text style={styles.titleBar}>VPL3</Text>
          )}
        </View>
      ),
      headerRight: () => (
        <View style={styles.titleContainer}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'https://www.thymio.org/fr/produits/programmer-avec-thymio-suite/programmer-en-vpl3/',
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
  }, [navigation, webview, webViewRef]);

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

      if (
        cycle < 2 &&
        JSON.stringify(services) === '{}' &&
        JSON.stringify(LTServices) !== '{}'
      ) {
        setCycle(cycle + 1);
      } else {
        setCycle(0);
      }
    }
  }, [services]);

  const injectedJavaScript = useMemo(() => {
    // console.log('config changed in MEMO');
    const js = `
  
      function handleMessage(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'getProgram') {
            const programJSON = window.vplGetProgramAsJSON();
            window.ReactNativeWebView.postMessage(JSON.stringify({ saved: programJSON, spec: data.spec }));
          }
        } catch(e) {
          console.error('Error procesando el mensaje:', e);
        }
      }
  
      document.addEventListener('message', handleMessage);
      window.addEventListener('message', handleMessage);
  
      window.addEventListener('click', function(e) {
        // Intercepta clics o solicitudes de descarga y envía el contenido a React Native
        if (e.target.href && e.target.href.startsWith('blob:')) {
          e.preventDefault();
          fetch(e.target.href).then(response => {
            if (response.ok) {
              return response.text();
            }
            throw new Error('Network response was not ok.');
          }).then(data => {
            window.ReactNativeWebView.postMessage(data);
          }).catch(error => {
            console.error('Error fetching blob data:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({error: error.toString()}));
          });
        }
      }, false);
  
      window["vplStorageGetFunction"] = function (filename, load) {
        program = JSON.stringify(${JSON.stringify(config, null, 2)});
        load(program);
      };

      true; // nota: siempre termina con true para evitar warnings
    `;

    // console.log('injectedJavaScript', js);
    return js;
  }, [config]);

  const [quit, setQuit] = useState(false);

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

    const objectData = JSON.parse(_data);

    if (objectData.spec === 'toSaveAndQuit') {
      asyncSetConfig(JSON.parse(objectData.saved), () => {
        setQuit(true);
        setDialogVisible(objectData);
      });
    } else if (objectData.spec === 'toQuit' || objectData.saved) {
      asyncSetConfig(JSON.parse(objectData.saved), () => {
        navigation.dispatch(CommonActions.goBack());
      });
    } else {
      Alert.alert(
        i18n.t('vpl3_program_management'),
        i18n.t('vpl3_program_info'),
        [
          {
            text: i18n.t('vpl3_program_new'),
            onPress: () => {
              setConfig({
                basicBlocks: config.basicBlocks,
                basicMultiEvent: true,
                disabledUI: ['src:language', 'vpl:exportToHTML', 'vpl:flash'],
                program: [],
              });

              console.log('Programa cargado');
              webViewRef.current.reload();
            },
          },
          {
            text: i18n.t('vpl3_program_load'),
            onPress: () => {
              loadJsonFile();
            },
          },
          {
            text: i18n.t('vpl3_program_save'),
            onPress: () => {
              setDialogVisible(objectData);
            },
          },
          {
            text: i18n.t('scratch_cancel'),
          },
        ],
      );
    }
  };

  const deberíaDescargar = useCallback((_url: string) => {
    // Ajusta esta lógica según tus necesidades
    return _url.includes('blob:'); // Ejemplo para archivos JSON
  }, []);

  const handleNavigationStateChange = useCallback(
    (event: any) => {
      // console.log('Evento de navegación:', event.url);
      if (deberíaDescargar(event.url)) {
        // Detiene la carga en el WebView y maneja la descarga
        webViewRef.current?.stopLoading();
      } else {
        // Si no es una descarga, pasa el evento a la función onChange propuesta

        setWebview(getPathAfterLocalhost(event.url));
        setQueryParams(getQueryParams(event.url));
        setUrl(event.url);
      }
    },
    [deberíaDescargar],
  );

  const handleSave = () => {
    // setConfig(dialogVisible);
    saveJsonFile(JSON.stringify(dialogVisible), fileName + '.vpl3', quit);
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
              uri: `http://127.0.0.1:3000/scanner/index.html?data=${JSON.stringify({...LTServices})}&gl=${JSON.stringify(
                {
                  interface: 'vpl3',
                },
              )}&lang=${language}`,
            }}
            injectedJavaScript={injectedJavaScript}
            style={{flex: 1}}
            onError={syntheticEvent => {
              const {nativeEvent} = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
            onNavigationStateChange={handleNavigationStateChange}
            incognito={true}
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

              openURL(request.url);
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
    width: '100%',
    height: '100%',
  },
  rootHiddenContainer: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    position: 'absolute',
    zIndex: 1,
    backgroundColor: 'white',
  },
  hiddenContainer: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    position: 'absolute',
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
