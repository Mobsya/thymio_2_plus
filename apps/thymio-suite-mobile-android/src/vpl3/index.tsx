import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
import Share from 'react-native-share';
import Dialog from 'react-native-dialog';

import {WebView, WebViewNavigation} from 'react-native-webview';
import BackIcon from '../assets/back-icon';
import HelpIcon from '../assets/launcher-icon-help-blue';
import {CommonActions, useNavigation} from '@react-navigation/native';

import {getPathAfterLocalhost} from '../helpers/parsers';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {i18n, useLanguage} from '../i18n';

import DocumentPicker, { errorCodes, isErrorWithCode } from '@react-native-documents/picker';
import {I18n} from 'i18n-js';
import Toast from 'react-native-simple-toast';
import Server from '@dr.pogodin/react-native-static-server';

import LauncherIcon from '../assets/launcher-icon-vpl';
import {
  copyFile,
  DocumentDirectoryPath,
  DownloadDirectoryPath,
  exists,
  MainBundlePath,
  readFile,
  TemporaryDirectoryPath,
  writeFile,
} from '@dr.pogodin/react-native-fs';

type VPLState = {
  basicBlocks: string[];
  basicMultiEvent: boolean;
  disabledUI: string[];
  program: any[];
};

type WebViewMessage = {
  state: string;
  spec: string;
  error?: string;
};

const URL_PREFIX =
  Platform.OS === 'ios' ? 'http://127.0.0.1:3000' : 'file:///android_asset';

const VPL_STATE_KEY = 'vpl3State';
const VPL_DEFAULT_STATE: VPLState = {
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
  disabledUI: ['src:language', 'vpl:exportToHTML', 'vpl:flash', 'vpl:teacher-save'],
  program: [],
};

async function requestStoragePermission() {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: i18n.t('storage_permission_title'),
          message: i18n.t('storage_permission_description'),
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return true;
      } else {
        Toast.showWithGravity(
          i18n.t('storage_permission_description'),
          Toast.LONG,
          Toast.BOTTOM,
        );
        return false;
      }
    } catch (err) {
      console.warn(err);
      return false;
    }
  } else {
    return true;
  }
}

const onBackPress = (webViewRef: MutableRefObject<any>, i18n: I18n) => {
  Alert.alert(
    i18n.t('vpl3_confirm_quit1'),
    i18n.t('vpl3_confirm_quit2'),
    [
      {
        text: i18n.t('vpl3_quit_cancel'),
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

function App(props: any): JSX.Element {
  const navigation = useNavigation();
  const {language, i18n} = useLanguage();

  const {name, uuid, address, port} = props.route.params;
  const appURI = `${URL_PREFIX}/vpl3/index.html?robot=thymio-tdm&role=teacher&uilanguage=${language}#uuid=${uuid}&w=ws://${address}:${port}&name=${name}`;
  const encodedURI = encodeURI(appURI);

  const webViewRef = useRef<any>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const [webview, setWebview] = useState('scanner');
  const [dialogVisible, setDialogVisible] = useState<VPLState | null>(null);
  const [fileName, setFileName] = useState('vpl3-program');
  const [quit, setQuit] = useState(false);
  const [vplState, setVPLState] = useState(VPL_DEFAULT_STATE);

  useEffect(() => {
    const loadFromStorage = async () => {
      try {
        const storedState = await AsyncStorage.getItem(VPL_STATE_KEY);

        if (storedState !== null) {
          setVPLState(JSON.parse(storedState));
        }
      } catch (error) {
        console.error('Error to load saved state:', error);
      }
    };

    loadFromStorage();
  }, []);

  const asyncSetState = async (newState: VPLState, callback = () => {}) => {
    try {
      const stateToSave = newState !== undefined ? newState : vplState;
      await AsyncStorage.setItem(VPL_STATE_KEY, JSON.stringify(stateToSave));
      callback();
    } catch (error) {
      Alert.alert(i18n.t('vpl3_error_to_saved_program'), JSON.stringify(error));
    }
  };

  if (Platform.OS === 'ios') {
    useEffect(() => {
      const path = `${MainBundlePath}/www`;

      const server = new Server({
        fileDir: path,
        port: 3000,
        stopInBackground: false,
      });

      server.start().then((url: string) => {
        console.log('Server running at:', url);
      });

      // Stop the server when the component unmounts
      return () => {
        server.stop().then(() => console.log('Server stopped'));
      };
    }, []);
  }

  const loadFile = async () => {
    try {
      const results = await DocumentPicker.pick({
        type: [DocumentPicker.types.allFiles],
      });

      const res = results[0];

      if (res.name === null) {
        throw new Error('File could not be loaded');
      }

      const fileExtension = res.name.split('.').pop();
      if (fileExtension !== 'vpl3') {
        throw new Error(i18n.t('vpl3_can_only_read_vpl_files'));
      }

      let filePath: string;
      if (Platform.OS === 'ios') {
        let arr = res.uri.split('/');
        filePath = `${DocumentDirectoryPath}/${arr[arr.length - 1]}`;
      } else {
        const destPath = `${TemporaryDirectoryPath}/${res.name}`;
        await copyFile(res.uri, destPath);
        filePath = `file://${destPath}`;
      }

      const file = await readFile(filePath, 'utf8');

      console.log('File:', file);

      setVPLState(JSON.parse(file));

      console.log('Programa cargado');

      // TODO Investigate the different behaviour between the platforms
      if (Platform.OS === 'ios') {
        webViewRef.current.reload();
      } else {
        webViewRef.current.postMessage(
          JSON.stringify({action: 'setProgram', program: file}),
        );
      }
    } catch (err: unknown) {
      if (isErrorWithCode(err)) {
        switch(err.code) {
          case errorCodes.OPERATION_CANCELED:
            console.log('File selection cancelled');
            break;
          default:
            console.log('Error selecting file:', err);
            Toast.showWithGravity(
              (err as Error).message,
              Toast.SHORT,
              Toast.BOTTOM,
            );
        }
      } else {
        console.log('Error selecting file:', err);
        Toast.showWithGravity(
          (err as Error).message,
          Toast.SHORT,
          Toast.BOTTOM,
        );
      }
    }
  };

  const saveFile = async (
    jsonData: string,
    filename: string,
    quit: boolean,
  ) => {
    try {
      console.log('JSON', jsonData);

      let documentDir;
      if (Platform.OS === 'ios') {
        documentDir = DocumentDirectoryPath;
      } else {
        documentDir = DownloadDirectoryPath;
      }

      console.log('The document directory is: ', documentDir);
      if (!documentDir) {
        console.error('The document directory is not available');
        return;
      }

      const path = `${documentDir}/${filename}`;
      console.log('THE path is', path);

      await writeFile(path, jsonData, 'utf8');
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

      Alert.alert(
        i18n.t('scratch_save_success'),
        i18n.t('scratch_save_options'),
        [
          {text: i18n.t('scratch_save_continue'), onPress: () => {}},
          {text: i18n.t('scratch_save_share'), onPress: () => shareFile(path)},
        ],
      );

      return path;
    } catch (error: unknown) {
      console.error('Error saving the JSON file:', error);
      Toast.showWithGravity(
        (error as Error).message,
        Toast.SHORT,
        Toast.BOTTOM,
      );
    }
  };

  const handleSave = async () => {
    const hasPermission = await requestStoragePermission();
    if (hasPermission) {
      await saveFile(JSON.stringify(dialogVisible), fileName + '.vpl3', quit);
      setDialogVisible(null);
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

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.titleContainer}>
          <LauncherIcon />
          <Text style={styles.titleBar}>{name}</Text>
        </View>
      ),
      headerLeft: () => (
        <View>
          <TouchableOpacity onPressOut={() => onBackPress(webViewRef, i18n)}>
            <BackIcon />
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={styles.titleContainer}>
          <TouchableOpacity
            onPressOut={() =>
              Linking.openURL(
                'https://www.thymio.org/fr/produits/programmer-avec-thymio-suite/programmer-en-vpl3/',
              )
            }>
            <HelpIcon />
          </TouchableOpacity>
          <View style={{width: 10}} />
        </View>
      ),
      headerTitleAlign: 'center',
      headerBackVisible: false,
    });
  }, [webview, webViewRef]);

  const injectedJavaScript = useMemo(() => {
    const js = `

      function handleMessage(event) {
        try {
          const data = JSON.parse(event.data);
          if (data.action === 'getProgram') {
            const programJSON = window.vplGetProgramAsJSON();
            window.ReactNativeWebView.postMessage(JSON.stringify({ state: programJSON, spec: data.spec }));
          } else if (data.action === 'setProgram') {
            window.vplApp.loadProgramFile(JSON.parse(data.program));
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
            window.ReactNativeWebView.postMessage(JSON.stringify({ state: data, spec: undefined }));
          }).catch(error => {
            console.error('Error fetching blob data:', error);
            window.ReactNativeWebView.postMessage(JSON.stringify({ state: null, spec: null, error: error.toString() }));
          });
        }
      }, false);

      window["vplStorageGetFunction"] = function (filename, load) {
        program = JSON.stringify(${JSON.stringify(vplState, null, 2)});
        load(program);
      };

      true; // nota: siempre termina con true para evitar warnings
    `;

    return js;
  }, [vplState]);

  const handleOnMessage = (event: {nativeEvent: {data: string}}) => {
    const dataString = event.nativeEvent.data;

    if (
      !dataString ||
      dataString === 'null' ||
      dataString === 'undefined' ||
      dataString[0] === '<'
    ) {
      return;
    }

    const dataObject = JSON.parse(dataString) as WebViewMessage;
    console.log('DATA OBJECT', dataObject);

    let state: VPLState | undefined;
    if (dataObject.state) {
      state = JSON.parse(dataObject.state);
    }

    if (dataObject.spec === 'toSaveAndQuit' && state) {
      asyncSetState(state, () => {
        setQuit(true);
        setDialogVisible(state);
      });
    } else if (dataObject.spec === 'toQuit') {
      if (state) {
        asyncSetState(state, () => {
          navigation.dispatch(CommonActions.goBack());
        });
      } else {
        navigation.dispatch(CommonActions.goBack());
      }
    } else {
      Alert.alert(
        i18n.t('vpl3_program_management'),
        i18n.t('vpl3_program_info'),
        [
          {
            text: i18n.t('vpl3_program_new'),
            onPress: () => {
              setVPLState(VPL_DEFAULT_STATE);

              webViewRef.current.reload();
            },
          },
          {
            text: i18n.t('vpl3_program_load'),
            onPress: async () => {
              const hasPermission = await requestStoragePermission();
              if (hasPermission) {
                loadFile();
              }
            },
          },
          {
            text: i18n.t('vpl3_program_save'),
            onPress: () => {
              if (state) {
                setDialogVisible(state);
              } else {
                setDialogVisible(VPL_DEFAULT_STATE);
              }
            },
          },
          {
            text: i18n.t('scratch_cancel'),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const isDownloadAction = useCallback((_url: string) => {
    return _url.includes('blob:');
  }, []);

  const handleNavigationStateChange = useCallback(
    (event: any) => {
      if (isDownloadAction(event.url)) {
        // Detiene la carga en el WebView y maneja la descarga
        webViewRef.current?.stopLoading();
      } else {
        // Si no es una descarga, pasa el evento a la función onChange propuesta

        setWebview(getPathAfterLocalhost(event.url));
      }
    },
    [isDownloadAction],
  );

  const openURL = (_url: string) => {
    Linking.canOpenURL(_url)
      .then(supported => {
        if (supported) {
          Linking.openURL(_url);
        } else {
          Alert.alert(i18n.t('error'), i18n.t('can_not_open_url'));
        }
      })
      .catch(err => console.error('An error occurred', err));
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor="#201439"
      />
      <View style={{marginTop: 22}}>
        <Dialog.Container
          visible={dialogVisible !== null}
          supportedOrientations={['landscape']}>
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
            label={i18n.t('scratch_saveForm_labelButton_cancel')}
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
            source={{
              uri: encodedURI,
            }}
            onMessage={handleOnMessage}
            ref={webViewRef}
            startInLoadingState
            originWhitelist={['*']}
            javaScriptEnabled={true}
            domStorageEnabled={true}
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

              if (Platform.OS === 'ios' && request.url.includes('127.0.0.1')) {
                return true;
              }

              if (
                Platform.OS === 'android' &&
                request.url.includes('file:///android_asset')
              ) {
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

export default App;
