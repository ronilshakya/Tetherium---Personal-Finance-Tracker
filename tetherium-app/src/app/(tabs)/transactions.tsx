import { useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { getTransactions } from "@/api";

export default function TransactionsScreen() {
  const token = useAuthStore((state) => state.token);
  const { transactions, loading, setTransactions, setLoading } =
    useTransactionStore();
  const router = useRouter();

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getTransactions(token);
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  return (
    <View style={styles.container}>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions yet</Text>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.category}>{item.category.name}</Text>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.amount,
                item.type === "INCOME" ? styles.income : styles.expense,
              ]}
            >
              {item.type === "INCOME" ? "+" : "-"}$
              {parseFloat(item.amount).toFixed(2)}
            </Text>
          </View>
        )}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/transactions/add")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  listContent: { padding: 16 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  category: { fontSize: 16, fontWeight: "600" },
  description: { fontSize: 13, color: "#6b7280", marginTop: 2 },
  amount: { fontSize: 16, fontWeight: "700" },
  income: { color: "#16a34a" },
  expense: { color: "#dc2626" },
  fab: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  fabText: { color: "white", fontSize: 28, lineHeight: 30 },
});
