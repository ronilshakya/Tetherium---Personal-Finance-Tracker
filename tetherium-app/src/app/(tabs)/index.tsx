import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { PieChart } from "react-native-chart-kit";
import { useAuthStore } from "@/stores/authStore";
import {
  getDashboardSummary,
  getSpendingByCategory,
  DashboardSummary,
  CategorySpending,
} from "@/api";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import { fonts } from "@/theme/typography";

const screenWidth = Dimensions.get("window").width;
const now = new Date();
const CURRENT_MONTH = now.getMonth() + 1;
const CURRENT_YEAR = now.getFullYear();

export default function DashboardScreen() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categoryData, setCategoryData] = useState<CategorySpending[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [summaryData, spending] = await Promise.all([
        getDashboardSummary(token, CURRENT_MONTH, CURRENT_YEAR),
        getSpendingByCategory(token, CURRENT_MONTH, CURRENT_YEAR),
      ]);
      setSummary(summaryData);
      setCategoryData(spending);
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

  const pieChartData = categoryData.map((c) => ({
    name: c.categoryName,
    population: Number(c.total),
    color: c.color ?? "#6b7280",
    legendFontColor: "#374151",
    legendFontSize: 13,
  }));

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
          {formatCurrency(summary.totalBalance, user?.currency)}
        </Text>

        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.incomeCard]}>
            <Text style={styles.summaryLabel}>This Month Income</Text>
            <Text style={[styles.summaryAmount, styles.incomeText]}>
              +
              {formatCurrency(
                Number(summary.monthIncome).toFixed(2),
                user?.currency,
              )}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.expenseCard]}>
            <Text style={styles.summaryLabel}>This Month Expense</Text>
            <Text style={[styles.summaryAmount, styles.expenseText]}>
              -
              {formatCurrency(
                Number(summary.monthExpense).toFixed(2),
                user?.currency,
              )}
            </Text>
          </View>
        </View>
      </View>

      <Text style={styles.sectionHeader}>Spending by Category</Text>
      {pieChartData.length === 0 ? (
        <Text style={styles.empty}>No expenses this month</Text>
      ) : (
        <PieChart
          data={pieChartData}
          width={screenWidth - 32}
          height={200}
          chartConfig={chartConfig}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="0"
        />
      )}

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
              {tx.type === "INCOME" ? "+" : "-"}
              {formatCurrency(parseFloat(tx.amount).toFixed(2), user?.currency)}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#fff",
  backgroundGradientTo: "#fff",
  color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
  labelColor: () => "#374151",
  decimalPlaces: 0,
};

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: 16, paddingBottom: 40 },
    loadingText: {
      textAlign: "center",
      marginTop: 40,
      color: colors.textSecondary,
    },
    greeting: {
      fontSize: 20,
      fontFamily: fonts.bold,
      marginBottom: 16,
      color: colors.text,
    },
    balanceCard: {
      backgroundColor: colors.primary,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
    },
    balanceLabel: {
      color: colors.primaryLight,
      fontFamily: fonts.regular,
      fontSize: 14,
    },
    balanceAmount: {
      color: colors.white,
      fontSize: 32,
      fontFamily: fonts.bold,
      marginTop: 4,
    },
    summaryRow: { flexDirection: "row", gap: 12, marginTop: 24 },
    summaryCard: { flex: 1, borderRadius: 12, padding: 14 },
    incomeCard: { backgroundColor: colors.successLight },
    expenseCard: { backgroundColor: colors.dangerLight },
    summaryLabel: { fontSize: 12, color: colors.textSecondary },
    summaryAmount: { fontSize: 18, fontWeight: "700", marginTop: 4 },
    incomeText: { color: colors.success },
    expenseText: { color: colors.danger },
    sectionHeader: {
      fontSize: 16,
      fontWeight: "700",
      marginTop: 8,
      marginBottom: 12,
      color: colors.text,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 24,
      marginBottom: 12,
    },
    sectionLink: { fontSize: 13, color: colors.primary, fontWeight: "600" },
    empty: { color: colors.textSecondary, marginBottom: 16 },
    budgetRow: { marginBottom: 14 },
    budgetRowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    budgetCategory: { fontSize: 14, fontWeight: "600", color: colors.text },
    budgetAmounts: { fontSize: 13, color: colors.textSecondary },
    overText: { color: colors.danger, fontWeight: "600" },
    progressTrack: {
      height: 6,
      backgroundColor: colors.borderLight,
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
      borderBottomColor: colors.borderLight,
    },
    txLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    txCategory: { fontSize: 15, fontWeight: "600", color: colors.text },
    txDescription: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
    txAmount: { fontSize: 15, fontWeight: "700" },
  });
}
