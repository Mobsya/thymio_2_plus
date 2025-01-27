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
import Share from 'react-native-share';
import Dialog from 'react-native-dialog';

import {WebView, WebViewNavigation} from 'react-native-webview';
import LauncherIcon from '../assets/launcher-icon-scratch';
import BackIcon from '../assets/back-icon';
import HelpIcon from '../assets/launcher-icon-help-blue';
import {CommonActions, useNavigation} from '@react-navigation/native';
import Toast from 'react-native-simple-toast';

import {useLanguage} from '../i18n';
import { DocumentDirectoryPath, DownloadDirectoryPath, exists, writeFile } from '@dr.pogodin/react-native-fs';


function App(props: any): JSX.Element {
  const navigation = useNavigation();
  const {i18n} = useLanguage();

  const { uuid, name, address, port } = props.route.params;
  const appURI = `file:///android_asset/scratch/index.html?device=${uuid}&ws=ws://${address}:${port}`
  const encodedURI = encodeURI(appURI);

  const webViewRef = useRef<any>(null);
  const isDarkMode = useColorScheme() === 'dark';
  const [url, setUrl] = useState<string>('');
  const [dialogVisible, setDialogVisible] = useState<string | null>(null);
  const [fileName, setFileName] = useState('vpl3-program');

  const backgroundStyle = {
    backgroundColor: '#201439',
  };

  const onBackPress = () => {
    Alert.alert(
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
    try {
      const shareResponse = await Share.open({
        url: `file://${filePath}`,
      });
      console.log('File shared successfully:', shareResponse);
    } catch (error) {
      console.log('Could not share file:', error);
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
          <View style={{width: 10}} />
        </View>
      ),
      headerTitleAlign: 'center',
      headerBackVisible: false,
    });
  }, [webViewRef]);

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

  const handleSave = () => {
    saveFile(dialogVisible, fileName + '.sb3');
    setDialogVisible(null);
  };

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
              uri: encodedURI,
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
