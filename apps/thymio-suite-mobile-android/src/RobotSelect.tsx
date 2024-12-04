import React from "react";
import { Dimensions, SafeAreaView, StatusBar, StyleSheet, Text, View } from "react-native";

function RobotSelect(): JSX.Element {

  return (
    <SafeAreaView>
      <StatusBar />
      <View style={styles.rootContainer}>
        <View style={styles.orange}>
          <Text style={styles.title}>
            LOREM IPSUM
          </Text>
          <Text>
          Le Lorem Ipsum est simplement du faux texte employé dans la composition et la mise en page avant impression. Le Lorem Ipsum est le faux texte standard de l'imprimerie depuis les années 1500, quand un imprimeur anonyme assembla ensemble des morceaux de texte pour réaliser un livre spécimen de polices de texte. Il n'a pas fait que survivre cinq siècles, mais s'est aussi adapté à la bureautique informatique, sans que son contenu n'en soit modifié. Il a été popularisé dans les années 1960 grâce à la vente de feuilles Letraset contenant des passages du Lorem Ipsum, et, plus récemment, par son inclusion dans des applications de mise en page de texte, comme Aldus PageMaker.
          </Text>
        </View>
        <View style={styles.blue}></View>

      </View>
    </SafeAreaView>
  );

}

export default RobotSelect;

const styles = StyleSheet.create({
  rootContainer: {
    display: 'flex',
    flexDirection: 'row',
    height: Dimensions.get('screen').height,
    width: Dimensions.get('screen').width
  },
  orange: {
    flex: 1,
    color: 'white',
    backgroundColor: 'orange'
  },
  blue: {
    flex: 1,
    backgroundColor: 'blue'
  },
  title: {
    fontWeight: 'bold',
    fontSize: 30
  }
})
