import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";

export default function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Log Out", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          {/* Placeholder — swap for <Image source={{ uri: user.avatarUrl }} /> once backend supports it */}
          <Text style={styles.avatarText}>{initials || "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/categories")}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="pricetags-outline" size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Manage Categories</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push("/settings")}
        >
          <View style={styles.menuItemLeft}>
            <Ionicons name="settings-outline" size={20} color={colors.text} />
            <Text style={styles.menuItemText}>Settings</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface, padding: 20 },
    header: { alignItems: "center", marginTop: 20, marginBottom: 32 },
    avatar: {
      width: 88,
      height: 88,
      borderRadius: 44,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    avatarText: { color: colors.white, fontSize: 32, fontWeight: "700" },
    name: { fontSize: 20, fontWeight: "700", color: colors.text },
    email: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    menu: {
      borderRadius: 12,
      backgroundColor: colors.surface,
      overflow: "hidden",
      marginBottom: 24,
    },
    menuItem: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    menuItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    menuItemText: { fontSize: 15, color: colors.text },
    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    logoutText: { color: colors.danger, fontWeight: "600", fontSize: 15 },
  });
}
