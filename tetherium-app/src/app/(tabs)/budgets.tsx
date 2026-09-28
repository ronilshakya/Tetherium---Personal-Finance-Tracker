import { useCallback, useEffect } from "react";
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
import { useBudgetStore } from "@/stores/budgetStore";
import { getBudgets } from "@/api";
import { formatCurrency } from "@/utils/currency";
import { ThemeColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

export default function BudgetsScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { budgets, loading, setBudgets, setLoading } = useBudgetStore();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const loadBudgets = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getBudgets(token, CURRENT_MONTH, CURRENT_YEAR);
      setBudgets(data);
    } catch (err) {
      console.error("Failed to load budgets", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  return (
    <View style={styles.container}>
      <FlatList
        data={budgets}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadBudgets} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No budgets set for this month</Text>
        }
        renderItem={({ item }) => {
          const limit = parseFloat(item.limit);
          const spent = parseFloat(item.spent);
          const percent = Math.min(spent / limit, 1);
          const isOver = spent > limit;
          const barColor = item.category.color ?? colors.primary;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.categoryLabel}>
                  <View style={[styles.dot, { backgroundColor: barColor }]} />
                  <Text style={styles.category}>{item.category.name}</Text>
                </View>
                <Text style={[styles.amounts, isOver && styles.overText]}>
                  {formatCurrency(spent.toFixed(0), user?.currency)} /{" "}
                  {formatCurrency(limit.toFixed(0), user?.currency)}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percent * 100}%`,
                      backgroundColor: isOver ? colors.danger : barColor,
                    },
                  ]}
                />
              </View>
              {isOver && <Text style={styles.overLabel}>Over budget</Text>}
            </View>
          );
        }}
      />
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/budgets/add")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    listContent: { padding: 16 },
    empty: { textAlign: "center", color: colors.textSecondary, marginTop: 40 },
    card: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    cardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    categoryLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    category: { fontSize: 16, fontWeight: "600", color: colors.text },
    amounts: { fontSize: 14, color: colors.textSecondary },
    overText: { color: colors.danger, fontWeight: "600" },
    progressTrack: {
      height: 8,
      backgroundColor: colors.borderLight,
      borderRadius: 4,
      overflow: "hidden",
    },
    progressFill: {
      height: "100%",
      borderRadius: 4,
    },
    overLabel: {
      fontSize: 12,
      color: colors.danger,
      marginTop: 4,
      fontWeight: "600",
    },
    fab: {
      position: "absolute",
      right: 20,
      bottom: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      elevation: 4,
    },
    fabText: { color: colors.white, fontSize: 28, lineHeight: 30 },
  });
}
