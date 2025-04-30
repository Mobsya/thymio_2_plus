import React, {useState, useEffect, useRef} from 'react';
import {I18n} from 'i18n-js';
import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  FlatList,
} from 'react-native';

import {en} from './translations/en';
import {fr} from './translations/fr';
import {it} from './translations/it';
import {de} from './translations/de';
import {es} from './translations/es';
import {useLoading} from '../App';

// Inicialización de i18n-js con los diccionarios de traducción
const translations: any = {
  en,
  fr,
  it,
  de,
  es,
};
export const i18n = new I18n(translations);

const initializeLocale = async () => {
  // Intenta obtener el idioma guardado del almacenamiento local
  const storedLocale = await AsyncStorage.getItem('userLanguage');

  // Obtiene el idioma del sistema y normaliza los códigos de idioma
  let systemLocale = RNLocalize.getLocales()[0].languageTag;
  let languageCode = systemLocale.split('-')[0]; // Extrae la parte principal del idioma

  // Verifica si el idioma normalizado está soportado; si no, usa el idioma predeterminado
  const initialLocale =
    storedLocale || (translations[languageCode] ? languageCode : 'en');

  i18n.locale = initialLocale;
  i18n.defaultLocale = 'en'; // Fallback a 'en' si no se encuentra ninguno

  return initialLocale;
};

// Hook personalizado para manejar el cambio de idioma
export const useLanguage = () => {
  const {loading, setLoading} = useLoading();
  const [language, setLanguageState] = useState(i18n.locale);

  useEffect(() => {
    // Establecer el idioma inicial al cargar el componente
    const setInitialLocale = async () => {
      const initialLocale = await initializeLocale();
      setLanguageState(initialLocale);
    };
    setInitialLocale();
  }, []);

  const setLanguage = async (languageTag: any) => {
    i18n.locale = languageTag;
    i18n.defaultLocale = languageTag; // Opcional, establecer también el idioma predeterminado
    await AsyncStorage.setItem('userLanguage', languageTag); // Guardar el idioma seleccionado
    setLanguageState(languageTag); // Actualizar el estado para reflejar el cambio en la UI
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 600);
    // RNRestart.Restart();
  };

  return {language, setLanguage, i18n};
};

// Componente selector de idioma
export const LanguageSelector = () => {
  const {language, setLanguage} = useLanguage();
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef<any>(null);
  const menuRef = useRef<any>(null);

  const languages = [
    {i: 0, label: 'English', value: 'en'},
    {i: 1, label: 'Français', value: 'fr'},
    {i: 2, label: 'Italiano', value: 'it'},
    {i: 3, label: 'Deutsch', value: 'de'},
    {i: 4, label: 'Español', value: 'es'},
  ];

  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  const selectLanguage = (lang: {label?: string; value: any}) => {
    setLanguage(lang.value);
    setShowMenu(false);
  };

  const handleOutsidePress = (event: any) => {
    try {
      if (
        menuRef &&
        menuRef?.current &&
        menuRef?.current?.contains &&
        !menuRef?.current?.contains(event.target) &&
        !buttonRef?.current?.contains(event.target)
      ) {
        setShowMenu(false);
      }
    } catch (error) {
      console.log('ERROR:::handleOutsidePress::', error);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={toggleMenu}
        style={styles.button}
        ref={buttonRef}>
        <Text style={styles.buttonText}>
          {languages.find(lang => lang.value === language)?.label || 'Language'}
        </Text>
      </TouchableOpacity>
      {showMenu && (
        <View style={styles.menuContainer} onTouchStart={handleOutsidePress}>
          <View
            style={[
              styles.menu,
              {top: buttonRef.current?.clientHeight + 1 || 0},
            ]}
            ref={menuRef}>
            <FlatList
              data={languages.filter(lang => lang.value !== language)}
              renderItem={({item}) => (
                <TouchableOpacity
                  onPress={() => selectLanguage(item)}
                  // eslint-disable-next-line react-native/no-inline-styles
                  style={{
                    ...styles.menuItem,
                    borderBottomWidth: item.i !== 4 ? 1 : 0,
                  }}>
                  <Text>{item.label}</Text>
                </TouchableOpacity>
              )}
              keyExtractor={item => item.value}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  button: {
    padding: 10,
    backgroundColor: 'transparent',
    borderRadius: 5,
    marginBottom: 0,
  },
  buttonText: {
    fontSize: 16,
    color: '#0A9EEB',
  },
  menuContainer: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  menu: {
    position: 'absolute',
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    padding: 10,
    borderBottomColor: '#ccc',
  },
});
