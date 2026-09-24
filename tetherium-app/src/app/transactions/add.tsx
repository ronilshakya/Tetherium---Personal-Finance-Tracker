import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { Category, createTransaction, getCategories } from "@/api";

export default function AddTransactionScreen() {
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"INCOME" | "EXPENSE">("EXPENSE");
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((state) => state.token);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      getCategories(token, type).then((data) => {
        setCategories(data);
        setCategoryId((current) => current ?? data[0]?.id ?? null);
      });
    }, [token, type]),
  );

  const handleSave = async () => {
    if (!categoryId) {
      Alert.alert("Select a category");
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      const transaction = await createTransaction(token, {
        amount: parsedAmount,
        type,
        categoryId,
        description: description || undefined,
      });
      addTransaction(transaction);
      router.back();
    } catch (err: any) {
      Alert.alert("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Type</Text>
      <View style={styles.typeRow}>
        <TouchableOpacity
          style={[styles.typeButton, type === "EXPENSE" && styles.typeActive]}
          onPress={() => setType("EXPENSE")}
        >
          <Text
            style={type === "EXPENSE" ? styles.typeActiveText : styles.typeText}
          >
            Expense
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeButton, type === "INCOME" && styles.typeActive]}
          onPress={() => setType("INCOME")}
        >
          <Text
            style={type === "INCOME" ? styles.typeActiveText : styles.typeText}
          >
            Income
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0.00"
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
        <TouchableOpacity
          style={styles.addChip}
          onPress={() => router.push(`/categories/add?type=${type}`)}
        >
          <Text style={styles.addChipText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Description (optional)</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Weekly shop"
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Transaction"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    alignItems: "center",
  },
  typeActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  typeText: { color: "#374151" },
  typeActiveText: { color: "white", fontWeight: "600" },
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
  addChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#2563eb",
    borderStyle: "dashed",
  },
  addChipText: { color: "#2563eb", fontWeight: "600" },
});
