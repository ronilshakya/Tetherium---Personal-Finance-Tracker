import { getMe } from "@/api";
import { useAuthStore } from "@/stores/authStore";
import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";

export default function RootLayout() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const token = useAuthStore((state) => state.token);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const segments = useSegments();
  const router = useRouter();

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
        .then((user) => login(user, token))
        .catch(() => logout());
    }
  }, [isAuthenticated, hasHydrated, segments]);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: "#fff" },
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
          title: "New Category",
        }}
      />
      <Stack.Screen
        name="categories/index"
        options={{ headerShown: true, title: "Categories" }}
      />
      <Stack.Screen
        name="notifications"
        options={{ headerShown: true, title: "Notifications" }}
      />
    </Stack>
  );
}
