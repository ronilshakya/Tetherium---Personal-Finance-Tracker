import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";
import { login as loginApi } from "../../api";
import { useAuthStore } from "../../stores/authStore";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { user, token } = await loginApi(email, password);
      login(user, token);
      router.replace("/(tabs)");
    } catch (err: any) {
      Alert.alert("Login failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tetherio</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={colors.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Button
        title={loading ? "Logging in..." : "Log In"}
        onPress={handleLogin}
        disabled={loading}
      />
      <TouchableOpacity
        onPress={() => router.push("/(auth)/register")}
        style={styles.linkContainer}
      >
        <Text style={styles.link}>Don't have an account? Sign up</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, justifyContent: "center", padding: 24 },
    title: {
      fontSize: 32,
      fontFamily: fonts.bold,
      marginBottom: 32,
      textAlign: "center",
      color: colors.text,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    linkContainer: { marginTop: 20, alignItems: "center" },
    link: { color: colors.primary, fontWeight: "600" },
  });
}
