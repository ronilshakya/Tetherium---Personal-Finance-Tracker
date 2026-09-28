import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuthStore } from "../stores/authStore";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export function TopBar() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 8 }]}>
      <Text style={styles.logo}>Tetherium</Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/notifications")}
        >
          <Ionicons
            name="notifications-outline"
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => router.push("/settings")}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push("/(tabs)/profile")}
        >
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? "?"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingBottom: 12,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    logo: {
      fontSize: 20,
      fontFamily: fonts.bold,
      color: colors.text,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    iconButton: {
      padding: 4,
    },
    avatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      color: "white",
      fontWeight: "700",
      fontSize: 14,
    },
  });
}
