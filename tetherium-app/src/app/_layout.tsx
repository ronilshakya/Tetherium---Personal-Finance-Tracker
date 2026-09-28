import { getMe, updatePushToken } from "@/api";
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from "@expo-google-fonts/inter";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/theme/useTheme";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { registerForPushNotifications } from "@/utils/pushNotifications";
import { ThemeColors } from "@/theme/colors";
import { StyleSheet } from "react-native";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const segments = useSegments();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors);

  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (!hasHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
    if (isAuthenticated && token) {
      getMe(token)
        .then((user) => {
          login(user, token);
          // registerForPushNotifications().then((pushToken) => {
          //   if (pushToken) {
          //     updatePushToken(token, pushToken).catch(console.error);
          //   }
          // });
        })
        .catch(() => logout());
    }
  }, [isAuthenticated, hasHydrated, segments]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: styles.header,
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            color: colors.text,
          },
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)/login" />
        <Stack.Screen name="(auth)/register" />
        <Stack.Screen
          name="transactions/add"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Add Transaction",
          }}
        />
        <Stack.Screen
          name="transactions/[id]"
          options={{ headerShown: true, title: "Transaction Details" }}
        />
        <Stack.Screen
          name="budgets/add"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Add Budget",
          }}
        />
        <Stack.Screen
          name="categories/add"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "Category",
          }}
        />
        <Stack.Screen
          name="categories/index"
          options={{ headerShown: true, title: "Categories" }}
        />
        <Stack.Screen
          name="settings/index"
          options={{ headerShown: true, title: "Settings" }}
        />
        <Stack.Screen
          name="notifications"
          options={{ headerShown: true, title: "Notifications" }}
        />
        <Stack.Screen
          name="goals/add"
          options={{
            presentation: "modal",
            headerShown: true,
            title: "New Goal",
          }}
        />
        <Stack.Screen
          name="goals/[id]"
          options={{ headerShown: true, title: "Goal Details" }}
        />
      </Stack>
    </>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    header: { backgroundColor: colors.background },
  });
}
