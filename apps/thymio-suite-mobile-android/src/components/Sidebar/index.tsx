/* eslint-disable react-native/no-inline-styles */
/* eslint-disable prettier/prettier */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-shadow */
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Linking,
} from 'react-native';

import CloseIcon from '../../assets/launcher-icon-close';
import {LanguageSelector, useLanguage} from '../../i18n';
import MangoIcon from '../../assets/mango-icon';
import PCIcon from '../../assets/pc-icon';
import {CheckBox} from './checkBox';
import useAsyncStorageArray from './useAccesTDM'; // Asegúrate de que la ruta del import sea correcta
import {Button} from 'react-native-share';

const sortServices = (
  a: {name: string | string[]},
  b: {name: string | string[]},
) => {
  // Verificar que 'name' existe y es un string antes de llamar a 'includes'
  const aIncludesThymio =
    a.name && typeof a.name === 'string' && a.name.includes('Thymio');
  const bIncludesThymio =
    b.name && typeof b.name === 'string' && b.name.includes('Thymio');

  if (aIncludesThymio && !bIncludesThymio) {
    return 1; // a viene antes que b
  } else if (!aIncludesThymio && bIncludesThymio) {
    return -1; // b viene antes que a
  } else {
    return 0; // no cambia el orden
  }
};

const IOSStyleComponent = ({data}: {data: any}) => {
  const openURL = async (url: any) => {
    try {
      Linking.openURL(url);
    } catch (error) {
      console.log('error to open link:', url, error);
    }
  };

  return (
    <View style={stylesDataRow.container}>
      <DataRow label="Name" value={data.name.replace('.home', '')} />
      <DataRow label="Port" value={data.port} />
      <DataRow label="IP" value={data.ip} />
      {data.name.includes('Thymio') ? (
        <>
          <DataRow label="Firmware Version" value={`v${data.version}`} />
          <TouchableOpacity
            style={stylesDataRow.button}
            onPress={() => {
              openURL(`http://${data.ip}/dashboard`);
            }}>
            <Text style={stylesDataRow.text}>Go to config page</Text>
          </TouchableOpacity>
        </>
      ) : null}
    </View>
  );
};

const DataRow = ({label, value}: {label: string; value: string}) => {
  return (
    <View style={stylesDataRow.dataRow}>
      <Text style={stylesDataRow.label}>{label}:</Text>
      <Text style={stylesDataRow.value}>{value}</Text>
    </View>
  );
};

const stylesDataRow = StyleSheet.create({
  container: {
    padding: 0,
    width: 300,
  },
  dataRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  label: {
    fontWeight: '600',
  },
  value: {
    color: '#333',
  },
  button: {
    backgroundColor: '#007AFF', // Color azul característico de los botones de iOS
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5, // Solo para Android, para simular la sombra
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export const ItemAcordeon = ({
  option,
  index,
  data,
  addData,
  removeDataByName,
}: {
  option: any;
  index: number;
  data: any;
  addData: (data: any) => void;
  removeDataByName: (name: string) => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const animationController = useRef(new Animated.Value(0)).current;

  const toggleExpanded = () => {
    if (expanded) {
      Animated.timing(animationController, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false,
      }).start();
    } else {
      Animated.timing(animationController, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }).start();
    }
    setExpanded(!expanded);
  };

  const maxHeight = animationController.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 300], // Asumiendo un máximo de 300 de altura. Ajusta según necesidad
  });

  return (
    <View style={styles.containerItemAcordeon}>
      <TouchableOpacity
        key={index}
        style={styles.menuItem}
        onPress={toggleExpanded}>
        <View style={styles.itemContainer}>
          <CheckBox
            isChecked={
              [...data].filter((item: any) => item.name === option.name)[0]
                ?.isAceepted
            }
            onCheck={value =>
              value
                ? addData({...option, isAceepted: true})
                : removeDataByName(option.name)
            }
          />
          {`${option.name}`.includes('Thymio') ? <MangoIcon /> : <PCIcon />}
          <Text style={styles.menuOptions}>
            {`${option.name}`.replace(/.home/g, '')}
          </Text>
        </View>
      </TouchableOpacity>
      <Animated.View style={[styles.acordeon, {maxHeight}]}>
        <View style={styles.inner}>
          <IOSStyleComponent data={option} />
        </View>
      </Animated.View>
    </View>
  );
};

export const Sidebar = ({
  isVisible,
  onClose,
  onSelect,
}: {
  isVisible: boolean;
  onClose: () => void;
  options?: {label: string; value: string}[];
  onSelect: (option: any) => void;
}) => {
  const [data, setData] = useAsyncStorageArray('accessTDMServices', []);
  const [firstUse, setFirstUse] = useAsyncStorageArray('firstUse', true);

  const {i18n} = useLanguage();
  const [width] = useState(350); // Ancho del menú lateral
  const translateX = useRef(new Animated.Value(width)).current; // Posición inicial fuera de la pantalla
  const overlayOpacity = useRef(new Animated.Value(0)).current; // Opacidad inicial para el overlay

  const addData = (data: any) => {
    // busca el elemento y cambia la propiedad isAceepted a true, en caso de no existir lo agrega con isAceepted a true
    setData((prev: any) =>
      prev.filter((item: any) => item.name === data.name).length > 0
        ? prev.map((item: any) =>
          item.name === data.name ? {...item, isAceepted: true} : item,
        )
        : [...prev, {...data, isAceepted: true}],
    );
  };

  const removeDataByName = (name: string) => {
    setData((prev: any) =>
      prev.map((item: any) =>
        item.name === name ? {...item, isAceepted: false} : item,
      ),
    );
  };

  // Efecto para manejar la animación de apertura/cierre
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isVisible ? 0 : width,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.timing(overlayOpacity, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isVisible, width, translateX, overlayOpacity]);

  return (
    <View
      style={StyleSheet.absoluteFillObject}
      pointerEvents={isVisible ? 'auto' : 'none'}>
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: overlayOpacity,
          },
        ]}
        pointerEvents={isVisible ? 'auto' : 'none'}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}>
          {/* Este TouchableOpacity cubre el área fuera del Sidebar y cierra el menú al hacer clic */}
        </TouchableOpacity>
      </Animated.View>
      <Animated.View
        style={[
          styles.container,
          {
            transform: [{translateX}],
          },
        ]}>
        <View style={styles.menuHead}>
          <TouchableOpacity onPress={onClose}>
            <CloseIcon />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: 'white',
    width: 350,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    marginBottom: 20,
  },
  menuItem: {
    marginBottom: 4,
    marginTop: 4,
  },
  itemContainer: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    height: 30,
  },
  menuHead: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleMenuHead: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuOptions: {
    fontSize: 14,
    padding: 2,
  },
  containerItemAcordeon: {
    flex: 0,
    flexDirection: 'column',
    borderBottomWidth: 1,
    borderBottomColor: '#00000050',
  },
  acordeon: {
    overflow: 'hidden',
  },
  inner: {
    padding: 2,
    paddingBottom: 20,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
