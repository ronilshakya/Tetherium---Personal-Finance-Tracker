import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import {
  getTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
  Category,
  Transaction,
} from "@/api";

export default function TransactionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((state) => state.token);
  const removeTransaction = useTransactionStore(
    (state) => state.removeTransaction,
  );
  const router = useRouter();

  useEffect(() => {
    if (!token || !id) return;
    Promise.all([getTransaction(token, id), getCategories(token)])
      .then(([tx, cats]) => {
        setTransaction(tx);
        setAmount(tx.amount);
        setDescription(tx.description ?? "");
        setCategoryId(tx.category.id);
        setCategories(cats.filter((c) => c.type === tx.type)); // only same-type categories
      })
      .catch((err) => Alert.alert("Failed to load", err.message))
      .finally(() => setLoading(false));
  }, [token, id]);

  const handleSave = async () => {
    if (!token || !id || !categoryId) return;
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0");
      return;
    }

    setSaving(true);
    try {
      await updateTransaction(token, id, {
        amount: parsedAmount,
        categoryId,
        description: description || undefined,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert("Delete transaction", "This cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          if (!token || !id) return;
          try {
            await deleteTransaction(token, id);
            removeTransaction(id);
            router.back();
          } catch (err: any) {
            Alert.alert("Failed to delete", err.message);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.centered}>
        <Text>Transaction not found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.typeLabel}>
        {transaction.type === "INCOME" ? "Income" : "Expense"}
      </Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryRow}>
        {categories.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, categoryId === c.id && styles.chipActive]}
            onPress={() => setCategoryId(c.id)}
          >
            <Text
              style={
                categoryId === c.id ? styles.chipActiveText : styles.chipText
              }
            >
              {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Description</Text>
      <TextInput
        style={styles.input}
        placeholder="Optional"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Changes"}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete Transaction</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  typeLabel: {
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "600",
    marginBottom: 16,
    textTransform: "uppercase",
  },
  label: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
  },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  chipActive: { backgroundColor: "#dbeafe", borderColor: "#2563eb" },
  chipText: { color: "#374151" },
  chipActiveText: { color: "#2563eb", fontWeight: "600" },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
  deleteButton: {
    marginTop: 12,
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#dc2626",
  },
  deleteButtonText: { color: "#dc2626", fontWeight: "700", fontSize: 16 },
});
