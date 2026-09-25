import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { getDashboardSummary, DashboardSummary } from "@/api";

const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await getDashboardSummary(
        token,
        CURRENT_MONTH,
        CURRENT_YEAR,
      );
      setSummary(data);
    } catch (err) {
      console.error("Failed to load dashboard", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  if (!summary) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
    >
      <Text style={styles.greeting}>Welcome back, {user?.name}</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Balance</Text>
        <Text style={styles.balanceAmount}>
          ${summary.totalBalance.toFixed(2)}
        </Text>
      </View>

      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, styles.incomeCard]}>
          <Text style={styles.summaryLabel}>This Month Income</Text>
          <Text style={[styles.summaryAmount, styles.incomeText]}>
            +${Number(summary.monthIncome).toFixed(2)}
          </Text>
        </View>
        <View style={[styles.summaryCard, styles.expenseCard]}>
          <Text style={styles.summaryLabel}>This Month Expense</Text>
          <Text style={[styles.summaryAmount, styles.expenseText]}>
            -${Number(summary.monthExpense).toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Budget Overview</Text>
        <Text
          style={styles.sectionLink}
          onPress={() => router.push("/(tabs)/budgets")}
        >
          See all
        </Text>
      </View>
      {summary.budgets.length === 0 ? (
        <Text style={styles.empty}>No budgets set for this month</Text>
      ) : (
        summary.budgets.slice(0, 3).map((budget) => {
          const limit = parseFloat(budget.limit);
          const spent = parseFloat(budget.spent);
          const percent = Math.min(spent / limit, 1);
          const isOver = spent > limit;
          return (
            <View key={budget.id} style={styles.budgetRow}>
              <View style={styles.budgetRowHeader}>
                <Text style={styles.budgetCategory}>
                  {budget.category.name}
                </Text>
                <Text style={[styles.budgetAmounts, isOver && styles.overText]}>
                  ${spent.toFixed(0)} / ${limit.toFixed(0)}
                </Text>
              </View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${percent * 100}%`,
                      backgroundColor: isOver
                        ? "#dc2626"
                        : (budget.category.color ?? "#2563eb"),
                    },
                  ]}
                />
              </View>
            </View>
          );
        })
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={styles.sectionHeader}>Recent Transactions</Text>
        <Text
          style={styles.sectionLink}
          onPress={() => router.push("/(tabs)/transactions")}
        >
          See all
        </Text>
      </View>
      {summary.recentTransactions.length === 0 ? (
        <Text style={styles.empty}>No transactions yet</Text>
      ) : (
        summary.recentTransactions.map((tx) => (
          <View key={tx.id} style={styles.txRow}>
            <View style={styles.txLeft}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: tx.category.color ?? "#6b7280" },
                ]}
              />
              <View>
                <Text style={styles.txCategory}>{tx.category.name}</Text>
                {tx.description ? (
                  <Text style={styles.txDescription}>{tx.description}</Text>
                ) : null}
              </View>
            </View>
            <Text
              style={[
                styles.txAmount,
                tx.type === "INCOME" ? styles.incomeText : styles.expenseText,
              ]}
            >
              {tx.type === "INCOME" ? "+" : "-"}$
              {parseFloat(tx.amount).toFixed(2)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  content: { padding: 16, paddingBottom: 40 },
  loadingText: { textAlign: "center", marginTop: 40, color: "#9ca3af" },
  greeting: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  balanceCard: {
    backgroundColor: "#2563eb",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: { color: "#dbeafe", fontSize: 14 },
  balanceAmount: {
    color: "white",
    fontSize: 32,
    fontWeight: "700",
    marginTop: 4,
  },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
  incomeCard: { backgroundColor: "#f0fdf4" },
  expenseCard: { backgroundColor: "#fef2f2" },
  summaryLabel: { fontSize: 12, color: "#6b7280" },
  summaryAmount: { fontSize: 18, fontWeight: "700", marginTop: 4 },
  incomeText: { color: "#16a34a" },
  expenseText: { color: "#dc2626" },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHeader: { fontSize: 16, fontWeight: "700" },
  sectionLink: { fontSize: 13, color: "#2563eb", fontWeight: "600" },
  empty: { color: "#9ca3af", marginBottom: 16 },
  budgetRow: { marginBottom: 14 },
  budgetRowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  budgetCategory: { fontSize: 14, fontWeight: "600" },
  budgetAmounts: { fontSize: 13, color: "#6b7280" },
  overText: { color: "#dc2626", fontWeight: "600" },
  progressTrack: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  txRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  txLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  txCategory: { fontSize: 15, fontWeight: "600" },
  txDescription: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "700" },
});
