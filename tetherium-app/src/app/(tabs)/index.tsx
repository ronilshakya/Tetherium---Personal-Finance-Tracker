import { useAuthStore } from "@/stores/authStore";
import { Text, View, StyleSheet } from "react-native";

export default function Index() {
  const user = useAuthStore((state) => state.user);
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tetherio</Text>
      <Text>{user ? `Welcome, ${user.name}` : "Not logged in"}</Text>
      <Text>{user?.email}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
  },
});
