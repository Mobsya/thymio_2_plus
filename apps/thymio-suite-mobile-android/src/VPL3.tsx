import React from "react";
import { SafeAreaView, StatusBar, View, Dimensions, StyleSheet } from "react-native";
import {WebView, WebViewNavigation} from 'react-native-webview';

import {useLanguage} from './i18n/index';

function VPL3({route, navigation}: any): JSX.Element {
  const {language, i18n} = useLanguage();

  const { name, uuid, host, port } = route.params;
  const appURI = `file:///android_asset/vpl3/index.html?robot=thymio-tdm&uilanguage=${language}#uuid=${uuid}&w=ws://${host}:${port}&name=${name}`;
  const encodedURI = encodeURI(appURI);
  console.log(encodedURI)


  return (
    <SafeAreaView style={styles.root}>
      <StatusBar
        barStyle={'light-content'}
      />
      <View style={styles.container}>
        <WebView
          style={{
            flex: 1,
            width: Dimensions.get('screen').width,
            height: Dimensions.get('screen').height,
          }}
          startInLoadingState
          originWhitelist={['*']}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          source={{
            uri: encodedURI
          }}
          onError={syntheticEvent => {
            const {nativeEvent} = syntheticEvent;
            console.warn('WebView error: ', nativeEvent);
          }}
          incognito={true}
        />
      </View>
    </SafeAreaView>

  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
  },
  container: {
    flex: 1,
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width,
    backgroundColor: 'white',
  },
});

export default VPL3;
