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
import { useBudgetStore } from "@/stores/budgetStore";
import { Category, createBudget, getCategories } from "@/api";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const now = new Date();

export default function AddBudgetScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [limit, setLimit] = useState("");
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((state) => state.token);
  const addBudget = useBudgetStore((state) => state.addBudget);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      getCategories(token, "EXPENSE").then((data) => {
        setCategories(data);
        setCategoryId((current) => current ?? data[0]?.id ?? null);
      });
    }, [token]),
  );

  const handleSave = async () => {
    if (!categoryId) {
      Alert.alert("Select a category");
      return;
    }
    const parsedLimit = parseFloat(limit);
    if (!parsedLimit || parsedLimit <= 0) {
      Alert.alert("Invalid limit", "Enter an amount greater than 0");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      const budget = await createBudget(token, {
        categoryId,
        limit: parsedLimit,
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      addBudget({ ...budget, spent: "0" });
      router.back();
    } catch (err: any) {
      Alert.alert("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
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
          onPress={() => router.push(`/categories/add?type=EXPENSE`)}
        >
          <Text style={styles.addChipText}>+ New</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.label}>Monthly Limit</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
        value={limit}
        onChangeText={setLimit}
      />

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Save Budget"}
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
      backgroundColor: colors.surface,
    },
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
