import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import StaticServer from 'react-native-static-server';
import RNFS from 'react-native-fs';

const App = () => {
  const [serverUrl, setServerUrl] = useState<string|null>(null);

  useEffect(() => {
    const path = `${RNFS.MainBundlePath}/www`;

    // for debug
    RNFS.readDir(path).then((files) => {
      console.log('Files in www directory: ', JSON.stringify(files.map(({name})=>name), null, 2));
    });

    const server = new StaticServer(8080, path, { localOnly: false, keepAlive : true });

    server.start().then((url:string) => {
      setServerUrl(`${url}/scranner/index.html`);
      console.log('Server running at:', url);
    });

    // Stop the server when the component unmounts
    return () => server.stop();
  }, []);

  return (
    <View style={styles.container}>
      {serverUrl && (
        <WebView
          source={{ uri: serverUrl }}  // Load HTML from the local server
          style={styles.webview}
        />
      )}
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width,
    height,
    backgroundColor: '#F5FCFF',
  },
  webview: {
    flex: 1,
    width,
    height,
  },
});

export default App;
