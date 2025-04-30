import React, {JSX, useEffect, useRef, useState} from 'react';
import {
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
} from 'react-native';
import Dialog from 'react-native-dialog';
import {WebView, WebViewNavigation} from 'react-native-webview';
import LauncherIcon from '../assets/launcher-icon-scratch';
import BackIcon from '../assets/back-icon';
import HelpIcon from '../assets/launcher-icon-help-blue';
import {CommonActions, useNavigation} from '@react-navigation/native';

import {useLanguage} from '../i18n';

import Share from 'react-native-share';

import Server from '@dr.pogodin/react-native-static-server';
import { DocumentDirectoryPath, DownloadDirectoryPath, exists, MainBundlePath, writeFile } from '@dr.pogodin/react-native-fs';
import Toast from 'react-native-simple-toast';
import { SafeAreaView } from 'react-native-safe-area-context';

const URL_PREFIX =
  Platform.OS === 'ios' ? 'http://127.0.0.1:3000' : 'file:///android_asset';

function App(props: any): JSX.Element {
  const navigation = useNavigation();
  const {i18n} = useLanguage();

  const { uuid, name, address, port } = props.route.params;

  const appURI = `${URL_PREFIX}/scratch/index.html?device=${uuid}&ws=ws://${address}:${port}`;
  const encodedURI = encodeURI(appURI);

  const webViewRef = useRef<any>(null);
  const isDarkMode = useColorScheme() === 'dark';

  const [dialogVisible, setDialogVisible] = useState<string | null>(null);
  const [fileName, setFileName] = useState('scratch-program');

  if(Platform.OS === 'ios') {
    useEffect(() => {
      const path = `${MainBundlePath}/www`;

      const server = new Server({
        fileDir: path,
        port: 3000,
        stopInBackground: false
      });

      server.start().then((url:string) => {
        console.log('Server running at:', url);
      });

      // Stop the server when the component unmounts
      return () => {
        server.stop().then(() => console.log('Server stopped'));
      };
    }, []);
  }

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <View style={styles.titleContainer}>
          <LauncherIcon />
          <Text style={styles.titleBar}>
            {name}
          </Text>
        </View>
      ),
      headerLeft: () => (
        <View>
          <TouchableOpacity onPressOut={() => onBackPress()}>
            <BackIcon />
          </TouchableOpacity>
        </View>
      ),
      headerRight: () => (
        <View style={styles.titleContainer}>
          <TouchableOpacity
            onPressOut={() =>
              Linking.openURL(
                'https://www.thymio.org/fr/produits/programmer-avec-thymio-suite/programmer-avec-scratch/',
              )
            }>
            <HelpIcon />
          </TouchableOpacity>
        </View>
      ),
      headerTitleAlign: 'center',
      headerBackVisible: false,
    });
  }, [webViewRef]);

  const onBackPress = () => {
    // Mostrar una alerta al usuario antes de ir hacia atrás
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
          onPress: () => {
            navigation.dispatch(CommonActions.goBack())
          }
        },
      ],
      {cancelable: true}, // Permite cerrar la alerta tocando fuera de ella
    );
  };

  const handleSave = () => {
    if (dialogVisible) {
      saveFile(dialogVisible, fileName + '.sb3');
    }
    setDialogVisible(null);
  };

  const shareFile = async (filePath: any) => {
    console.log(`Intentando compartir archivo: ${filePath}`);
    try {
      const shareResponse = await Share.open({
        url: `file://${filePath}`,
      });
      console.log('Archivo compartido con éxito:', shareResponse);
    } catch (error) {
      console.log('Error al compartir el archivo:', error);
      Toast.showWithGravity((error as Error).message, Toast.SHORT, Toast.BOTTOM);
    }
  };

  const saveFile = async (base64Data: string | null, filename: string) => {
    try {
      let documentDir;
      if (Platform.OS === 'ios') {
        documentDir = DocumentDirectoryPath;
      } else {
        documentDir = DownloadDirectoryPath;
      }

      if (!documentDir) {
        console.error('The document directory is not available');
        return;
      }

      if (!base64Data) {
        console.error('No data to save');
        return;
      }

      const base64 = base64Data.split('base64,')[1];
      let path = `${documentDir}/${filename}`;
      let fileExists = await exists(path);
      let index = 0;

      while (fileExists) {
        index++;
        const newPath = `${documentDir}/${filename.split('.').slice(0, -1).join('.') + '(' + index + ')' + '.' + filename.split('.').pop()}`;
        fileExists = await exists(newPath);
        if (!fileExists) {
          Alert.alert(
            i18n.t('file_exist'),
            i18n.t('file_exist_message', {name: filename}),
            [
              {
                text: 'No',
                onPress: () => {
                  setDialogVisible(base64Data);
                },
                style: 'cancel',
              },
              {
                text: 'OK',
                onPress: async () => {
                  await writeFile(
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

      await writeFile(path, base64, 'base64');

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
      Toast.showWithGravity((error as Error).message, Toast.SHORT, Toast.BOTTOM);
    }
  };

  const handleOnMessage = async (event: {nativeEvent: {data: any}}) => {
    const _data = event.nativeEvent.data;

    if (
      !_data ||
      _data === 'null' ||
      _data === 'undefined' ||
      _data[0] === '<'
    ) {
      return;
    }

    const {type, payload} = JSON.parse(_data);

    const base64Data = payload;

    console.log('HandleOnMessage:', type);

    setDialogVisible(base64Data);
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
        backgroundColor={styles.root.backgroundColor}
      />
      <View style={styles.rootContainer}>
        <Dialog.Container
          visible={dialogVisible !== null}
          supportedOrientations={['landscape']}>
          <Dialog.Title>
            {i18n.t('scratch_saveForm_title')}
          </Dialog.Title>
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
        <WebView
          source={{
            uri: encodedURI
          }}
          onMessage={handleOnMessage}
          ref={webViewRef}
          startInLoadingState
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          style={{flex: 1}}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          onShouldStartLoadWithRequest={(request: WebViewNavigation) => {
            console.log('request.url::--->', request.url);

            if (request.url.includes('localhost')) {
              return true;
            }

            if (request.url.includes('blob:')) {
              return true;
            }

            if (request.url.includes('127.0.0.1')) {
              return true;
            }

            if (request.url.includes('file:///android_asset')) {
              return true;
            }

            openURL(request.url);
            return true;
          }}
        />
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
    backgroundColor: '#201439',
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
