import { useAuthStore } from "@/stores/authStore";
import { View, Text, Button } from "react-native";

export default function TransactionsScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <Text>{user?.name}</Text>
      <Text>{user?.email}</Text>
      <Button title="Log Out" onPress={logout} />
    </View>
  );
}
