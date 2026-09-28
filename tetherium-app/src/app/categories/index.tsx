import { useCallback, useState } from "react";
import {
  View,
  Text,
  SectionList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { getCategories, deleteCategory, Category } from "@/api";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

export default function CategoriesScreen() {
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const load = useCallback(async () => {
    if (!token) return;
    const [expenses, income] = await Promise.all([
      getCategories(token, "EXPENSE"),
      getCategories(token, "INCOME"),
    ]);
    setExpenseCategories(expenses);
    setIncomeCategories(income);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleDelete = (category: Category) => {
    Alert.alert(
      "Delete category",
      `Delete "${category.name}"? This can't be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token) return;
            try {
              await deleteCategory(token, category.id);
              load();
            } catch (err: any) {
              Alert.alert("Cannot delete", err.message);
            }
          },
        },
      ],
    );
  };

  const sections = [
    { title: "Expense Categories", data: expenseCategories },
    { title: "Income Categories", data: incomeCategories },
  ];

  return (
    <View style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderSectionHeader={({ section }) => (
          <Text style={styles.sectionHeader}>{section.title}</Text>
        )}
        renderItem={({ item }) => {
          const color = item.color ?? colors.textSecondary;
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() => router.push(`/categories/add?id=${item.id}`)}
            >
              <View style={styles.rowLeft}>
                <View
                  style={[styles.iconCircle, { backgroundColor: color + "26" }]}
                >
                  <Ionicons
                    name={(item.icon as any) ?? "pricetag-outline"}
                    size={18}
                    color={color}
                  />
                </View>
                <Text style={styles.name}>{item.name}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={styles.empty}>No categories yet</Text>}
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/categories/add?type=EXPENSE")}
      >
        <Text style={styles.addButtonText}>+ New Category</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    listContent: { padding: 16, paddingBottom: 100 },
    sectionHeader: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginTop: 20,
      marginBottom: 8,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
      paddingHorizontal: 14,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      marginBottom: 8,
    },
    rowLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    name: { fontSize: 15, fontFamily: fonts.medium, color: colors.text },
    empty: {
      textAlign: "center",
      color: colors.textSecondary,
      fontFamily: fonts.regular,
      marginTop: 40,
    },
    addButton: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 10,
      alignItems: "center",
    },
    addButtonText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
  });
}
