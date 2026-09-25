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

export default function CategoriesScreen() {
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<Category[]>([]);
  const token = useAuthStore((state) => state.token);
  const router = useRouter();

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
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: item.color ?? "#6b7280" },
                ]}
              />
              <Text style={styles.name}>{item.name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8}>
              <Ionicons name="trash-outline" size={20} color="#dc2626" />
            </TouchableOpacity>
          </View>
        )}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { padding: 16, paddingBottom: 100 },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: "#6b7280",
    textTransform: "uppercase",
    marginTop: 20,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  name: { fontSize: 16 },
  empty: { textAlign: "center", color: "#9ca3af", marginTop: 40 },
  addButton: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
  },
  addButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
