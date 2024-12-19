import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import ThymioIcon from "../assets/thymio";

export const RobotButton = (props: any): JSX.Element => {
  const { name, disabled, onPress } = props;

  return (
    <TouchableOpacity
      disabled={disabled}
      style={disabled ? { opacity: 0.4 } : { opacity: 1.0 }}
      onPress={onPress}>
      <View style={styles.root}>
        <ThymioIcon />
        <Text style={styles.text}>{name}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  root: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10
  },
  text: {
    fontWeight: 'bold',
    color: 'white'
  },
  disabled: {
    opacity: 0.4
  }
})
