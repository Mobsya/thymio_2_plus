import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Linking,
} from 'react-native';

import CloseIcon from '../../assets/launcher-icon-close';
import {useLanguage} from '../../i18n';
import MangoIcon from '../../assets/mango-icon';
import PCIcon from '../../assets/pc-icon';
import { RobotService } from '../../services/RobotService';
import { Service } from 'react-native-zeroconf';
import { distinctUntilChanged, scan } from 'rxjs';

const IOSStyleComponent = ({service}: {service: Service}) => {
  const openURL = async (url: any) => {
    try {
      Linking.openURL(url);
    } catch (error) {
      console.log('error to open link:', url, error);
    }
  };

  return (
    <View style={stylesDataRow.container}>
      <DataRow label="Name" value={service.name.replace('Thymio Device Manager on ', '')} />
      <DataRow label="Port" value={service.port.toString()} />
      <DataRow label="IP" value={service.addresses[0]} />
      {service.name.includes('Thymio') ? (
        <>
          <TouchableOpacity
            style={stylesDataRow.button}
            onPress={() => {
              openURL(`http://${service.addresses[0]}/dashboard`);
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
  service,
}: {
  service: Service;
}) => {
  return (
    <View style={styles.containerItemAcordeon}>
      <View
        key={service.name}
        style={styles.menuItem}>
        <View style={styles.itemContainer}>
          {`${service.name}`.includes('Thymio') ? <MangoIcon /> : <PCIcon />}
          <Text style={styles.menuOptions}>
            {`${service.name}`.replace('Thymio Device Manager on ', '')}
          </Text>
        </View>
      </View>
      <View style={[styles.acordeon]}>
        <View style={styles.inner}>
          <IOSStyleComponent service={service} />
        </View>
      </View>
    </View>
  );
};

export const Sidebar = ({
  isVisible,
  onClose,
}: {
  isVisible: boolean;
  onClose: () => void;
}) => {
  const {i18n} = useLanguage();
  const [width] = useState(350); // Ancho del menú lateral
  const translateX = useRef(new Animated.Value(width)).current; // Posición inicial fuera de la pantalla
  const overlayOpacity = useRef(new Animated.Value(0)).current; // Opacidad inicial para el overlay

  const robotService = new RobotService();
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    robotService.scan();
    const serviceSub = robotService.resolvedService$.pipe(
      distinctUntilChanged((prev, next) => prev.host === next.host),
      scan<Service, Service[]>(
        (services, newService) => [...services, newService],
        []
      ),
    ).subscribe(services => {
      console.log(services.map(service => service.name));
      setServices(services);
    });

    return () => {
      serviceSub.unsubscribe();
      robotService.close();
    }
  }, []);

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
          {services.map(service =>
            <ItemAcordeon
              key={service.name}
              service={service}
            />
          )}
          {services.length === 0 ?
            <View style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              justifyContent: 'flex-start',
              padding: 12,
            }}>
              <Text style={{
                textAlign: 'justify',
                marginBottom: 10,
                fontWeight: 'bold',
              }}>
                {i18n.t('tdm_explorer_no_services_found')}
              </Text>
              <Text
                style={{
                  textAlign: 'justify',
                  marginBottom: 20,
                  color: '#666',
                }}
              >
                {i18n.t('tdm_explorer_scan_again')}
              </Text>
            </View>
            : <></>
          }

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
