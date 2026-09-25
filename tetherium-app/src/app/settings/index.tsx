import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useAuthStore } from "@/stores/authStore";
import { useThemeStore, ThemePreference } from "@/stores/themeStore";
import { useTheme } from "@/theme/useTheme";
import { updateProfile } from "@/api";
import { ThemeColors } from "@/theme/colors";

const CURRENCIES = ["NPR", "USD", "EUR", "GBP", "INR"];
const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const login = useAuthStore((state) => state.login);

  const handleCurrencyChange = async (currency: string) => {
    if (!token) return;
    try {
      const updatedUser = await updateProfile(token, { currency });
      login(updatedUser, token);
    } catch (err: any) {
      Alert.alert("Failed to update", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>Appearance</Text>
      <View style={styles.row}>
        {THEME_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.chip, preference === opt.value && styles.chipActive]}
            onPress={() => setPreference(opt.value)}
          >
            <Text
              style={
                preference === opt.value
                  ? styles.chipActiveText
                  : styles.chipText
              }
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionHeader}>Currency</Text>
      <View style={styles.row}>
        {CURRENCIES.map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.chip, user?.currency === c && styles.chipActive]}
            onPress={() => handleCurrencyChange(c)}
          >
            <Text
              style={
                user?.currency === c ? styles.chipActiveText : styles.chipText
              }
            >
              {c}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, padding: 20 },
    sectionHeader: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginTop: 20,
      marginBottom: 12,
    },
    row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    chipText: { color: colors.text },
    chipActiveText: { color: colors.primary, fontWeight: "600" },
  });
}
