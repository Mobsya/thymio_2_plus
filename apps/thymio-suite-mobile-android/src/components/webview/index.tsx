import React, {useCallback, useEffect, useRef} from 'react';
import {WebView} from 'react-native-webview';

type LangWenViewProps = {
  source: any;
  onNavigationStateChange: (event: any) => void;
  style?: any;
  onError?: (syntheticEvent: any) => void;
  type?: string;
  injectedJavaScript?: string;
  onSaved?: (data: any) => void;
};

const LangWebview = ({
  source,
  onNavigationStateChange,
  style,
  onError,
  type,
  injectedJavaScript,
  onSaved,
}: LangWenViewProps) => {
  const webViewRef = useRef<any>(null);

  // Función para determinar si una URL debería llevar a una descarga
  const deberíaDescargar = useCallback((url: string) => {
    // Ajusta esta lógica según tus necesidades
    return url.includes('blob:'); // Ejemplo para archivos JSON
  }, []);

  // Manejador para el evento onNavigationStateChange
  const handleNavigationStateChange = useCallback(
    (event: any) => {
      // console.log('Evento de navegación:', event.url);
      if (deberíaDescargar(event.url)) {
        // Detiene la carga en el WebView y maneja la descarga
        webViewRef.current?.stopLoading();
      } else {
        // Si no es una descarga, pasa el evento a la función onChange propuesta
        onNavigationStateChange(event);
      }
    },
    [onNavigationStateChange, deberíaDescargar],
  );

  const handleOnMessage = (event: {nativeEvent: {data: string}}) => {
    const datos = event.nativeEvent.data;
    // console.log('Datos recibidos:', datos);
    onSaved && onSaved(datos);
  };

  useEffect(() => {
    console.log('Inyectando JavaScript...');
    // webViewRef.current?.reload();
    // console.log('JavaScript inyectado', injectedJavaScript);
  }, [injectedJavaScript]);

  return (
    <WebView
      source={source}
      onNavigationStateChange={handleNavigationStateChange}
      injectedJavaScript={injectedJavaScript}
      onMessage={handleOnMessage}
      ref={webViewRef}
      startInLoadingState
      originWhitelist={['*']}
      javaScriptEnabled={true}
      domStorageEnabled={true}
      style={style}
      onError={onError}
    />
  );
};

export default LangWebview;
