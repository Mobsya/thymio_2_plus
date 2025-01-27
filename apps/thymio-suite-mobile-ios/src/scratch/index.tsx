import React, {useEffect, useRef, useState} from 'react';
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

function App(props: any): JSX.Element {
  const navigation = useNavigation();
  const {language, i18n} = useLanguage();

  const { uuid, name, address, port } = props.route.params;
  const appURI = `http://127.0.0.1:3000/scratch/index.html?device=${uuid}&ws=ws://${address}:${port}`;
  const encodedURI = encodeURI(appURI);

  const webViewRef = useRef<any>(null);
  const isDarkMode = useColorScheme() === 'dark';

  const [dialogVisible, setDialogVisible] = useState<string | null>(null);
  const [fileName, setFileName] = useState('scratch-program');

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

  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  const showDialog = (base64Data: string) => {
    setDialogVisible(base64Data);
  };

  const handleSave = () => {
    setDialogVisible(null);
    if (dialogVisible) {
      saveFile(dialogVisible, fileName + '.sb3');
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
          <TouchableOpacity onPress={() => onBackPress()}>
            <BackIcon />
          </TouchableOpacity>
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
        </View>
      ),
      headerTitleAlign: 'center',
      headerBackVisible: false,
    });
  }, [webViewRef]);

  const handleOnMessage = async (event: {nativeEvent: {data: any}}) => {
    const _data = event.nativeEvent.data;
    const {type, payload} = JSON.parse(_data);

    const base64Data = payload;

    console.log('HandleOnMessage:', type);
    showDialog(base64Data);
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
      </View>
      <View style={styles.rootHiddenContainer}>
        <View style={styles.hiddenContainer}>
          <View style={{height: 25}} />
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
