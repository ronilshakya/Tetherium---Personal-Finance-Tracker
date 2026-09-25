import { useAuthStore } from "@/stores/authStore";
import { router } from "expo-router";
import { View, Text, Button, TouchableOpacity, StyleSheet } from "react-native";

export default function TransactionsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
      <Button title="Log Out" onPress={logout} />
      <TouchableOpacity
        onPress={() => router.push("/categories")}
        style={styles.menuItem}
      >
        <Text style={styles.menuItemText}>Manage Categories</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  menuItem: { backgroundColor: "#000" },
  menuItemText: { color: "#fff" },
});
