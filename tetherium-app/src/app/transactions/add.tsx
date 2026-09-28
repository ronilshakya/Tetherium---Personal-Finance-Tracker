import { useCallback, useState } from "react";
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
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

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
  const { colors } = useTheme();
  const styles = getStyles(colors);

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
        placeholderTextColor={colors.textSecondary}
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
        placeholderTextColor={colors.textSecondary}
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

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: colors.background },
    label: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      fontFamily: fonts.regular,
      backgroundColor: colors.surface,
    },
    typeRow: { flexDirection: "row", gap: 8 },
    typeButton: {
      flex: 1,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
    },
    typeActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    typeText: { color: colors.text, fontFamily: fonts.medium },
    typeActiveText: { color: colors.white, fontFamily: fonts.semibold },
    categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
    chipText: { color: colors.text, fontFamily: fonts.medium },
    chipActiveText: { color: colors.primary, fontFamily: fonts.semibold },
    saveButton: {
      marginTop: 32,
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
    },
    saveButtonText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
    addChip: {
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.primary,
      borderStyle: "dashed",
    },
    addChipText: { color: colors.primary, fontFamily: fonts.semibold },
  });
}
