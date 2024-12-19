import React, {useEffect, useState} from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import {Sidebar} from './Sidebar'; // Asegúrate de que la ruta de importación sea correcta
import MenuIcon from '../assets/menu-icon';
import {LanguageSelector} from '../i18n';

export const Menu = ({
  setLoading,
}: {
  setLoading: (value: boolean) => void;
}) => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [selectable, setSelectable] = useState(true);

  useEffect(() => {
    if (!isSidebarVisible) {
      setTimeout(() => {
        setSelectable(true);
      }, 300);
    } else {
      setSelectable(false);
    }
  }, [isSidebarVisible]);

  return (
    <View
      style={{
        ...styles.container,
        zIndex: selectable ? 0 : 1,
      }}>
      <View
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-end',
          width: Dimensions.get('window').width,
        }}>
        {!isSidebarVisible ? (
          <LanguageSelector
            setLoading={setLoading}
            setShow={(v: boolean) => setSelectable(!v)}
          />
        ) : null}
        <TouchableOpacity onPress={() => setSidebarVisible(true)}>
          <View style={styles.menuIconContainer}>
            <MenuIcon />
          </View>
        </TouchableOpacity>
      </View>
      <Sidebar
        isVisible={isSidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height + 50, // Ajuste para que ocupe toda la altura
    backgroundColor: '#f7f5f610',
    position: 'absolute',
    top: 0,
    left: 0,
    paddingRight: 20,
    zIndex: 1,
  },
  menuIconContainer: {
    borderRadius: 50,
    borderColor: '#000000',
    borderWidth: 2,
    width: 30,
    height: 30,
    // backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    // shadowOpacity: 0.25,
    // shadowRadius: 3.84,
    // elevation: 5,
    margin: 20,
  },
});
