import { ThemeColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";
import { View, Text, StyleSheet } from "react-native";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.notificationText}>No notifications yet</Text>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, alignItems: "center", justifyContent: "center" },
    notificationText: { color: colors.text },
  });
}
