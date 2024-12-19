import React, { useEffect, useState } from "react";
import { ActivityIndicator, Dimensions, FlatList, Image, Linking, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";
import { ConnectedRobot, RobotService } from "./services/RobotService";
import { RobotButton } from "./components/RobotButton";
import { NodeStatus } from "@mobsya-association/thymio-api/dist/thymio_generated/mobsya/fb";
import { useLanguage } from "./i18n";

function RobotSelect(props: any): JSX.Element {
  const { programmingEnv } = props.route.params;

  const { i18n } = useLanguage();

  const robotService = new RobotService();

  const [robots, setRobots] = useState<ConnectedRobot[]>([]);

  useEffect(() => {
    robotService.scan();
    const robotSub = robotService.connectedRobots$.subscribe(robots => {
      console.log(robots.map(robot => robot.node.name))
      setRobots(robots);
    });

    return () => {
      robotSub.unsubscribe();
      robotService.close();
    }
  }, [])

  const robotButtonList = robots.map(robot =>
    <RobotButton
      key={robot.node.id.toString()}
      name={robot.node.name}
      disabled={robot.node.status === NodeStatus.busy}
      onPress={() => props.navigation.navigate(programmingEnv, {
        name: robot.node.name,
        uuid: robot.node.id.toString(),
        host: robot.host,
        address: robot.address,
        port: robot.port
      })}
    ></RobotButton>
  );

  return (
    <SafeAreaView>
      <StatusBar />
      <View style={styles.rootContainer}>
        <View style={styles.descriptionContainer}>
          <View style={styles.imageContainer}>
            {programmingEnv === 'VPL3' ?
              <Image source={require('./assets/vpl3-description.jpeg')} style={styles.image} /> :
              <Image source={require('./assets/scratch-description.jpeg')} style={styles.image} />
            }
          </View>
          <View style={styles.descriptionPadding}>
            <Text style={styles.title}>
              {programmingEnv === 'VPL3' ?
                i18n.t('vpl3_description_title') :
                i18n.t('scratch_description_title')
              }
            </Text>
            <View
              style={{
                margin: 15,
                borderBottomColor: 'white',
                borderBottomWidth: StyleSheet.hairlineWidth,
              }}
            />
            <View style={styles.descriptionText}>
              <FlatList
                data={programmingEnv === 'VPL3' ?
                  [
                    {key: i18n.t('vpl3_description_bullet_1')},
                    {key: i18n.t('vpl3_description_bullet_2')},
                    {key: i18n.t('vpl3_description_bullet_3')},
                    {key: i18n.t('vpl3_description_bullet_4')}
                  ]
                  :
                  [
                    {key: i18n.t('scratch_description_bullet_1')},
                    {key: i18n.t('scratch_description_bullet_2')},
                    {key: i18n.t('scratch_description_bullet_3')},
                    {key: i18n.t('scratch_description_bullet_4')}
                  ]
                }
                renderItem={({item}) => {
                  return (
                    <View style={{ marginBottom: 10 }}>
                      <Text style={{ fontSize: 15, color: 'white' }}>{`\u2022 ${item.key}`}</Text>
                    </View>
                  )
                }}
              />
              <Text>{"\n"}</Text>
              <Text
                style={{color: 'lightblue'}}
                onPress={
                  () => {
                    programmingEnv ?
                      Linking.openURL('https://www.thymio.org/products/programming-with-thymio-suite/program-thymio-vpl3/') :
                      Linking.openURL('https://www.thymio.org/products/programming-with-thymio-suite/program-thymio-scratch/')
                  }
                }>
                  {i18n.t('description_help_and_tips')}
              </Text>
              <Text>{"\n"}</Text>
              <Text style={{color: 'white'}}>
                {i18n.t('description_materials')}
                <Text
                  style={{color: 'lightblue'}}
                  onPress={() => Linking.openURL('https://www.thymio.org')}>
                    https://www.thymio.org
                </Text>
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.robotContainer}>
          <View style={styles.scannerContainer}>
            <ActivityIndicator size='large' />
            <Text style={styles.title}>{i18n.t('searching_robots')}</Text>
          </View>
          <View style={styles.robotList}>
            {robotButtonList}
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

export default RobotSelect;

const styles = StyleSheet.create({
  rootContainer: {
    backgroundColor: '#271845',
    display: 'flex',
    flexDirection: 'row',
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width
  },
  descriptionContainer: {
    flex: 1,
    color: 'white',
  },
  imageContainer: {
    width: Dimensions.get('screen').width / 2,
    height: Dimensions.get('screen').height / 3
  },
  image: {
    flex: 1,
    width: undefined,
    height: undefined,
    resizeMode: 'cover'
  },
  descriptionPadding: {
    padding: 15
  },
  title: {
    fontWeight: 'bold',
    fontSize: 20,
    color: 'white'
  },
  descriptionText: {
    color: 'white',
    padding: 20
  },
  robotContainer: {
    padding: 20,
    flex: 1,
    height: '100%',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: 20
  },
  scannerContainer: {
    paddingLeft: 20,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    gap: 20
  },
  robotList: {
    padding: 20,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    gap: 40
  }
})
