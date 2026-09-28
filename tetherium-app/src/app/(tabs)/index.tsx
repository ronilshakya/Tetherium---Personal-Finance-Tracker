import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import {
  getDashboardSummary,
  getSpendingByCategory,
  getSavingsGoals,
  DashboardSummary,
  CategorySpending,
  SavingsGoal,
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
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(false);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const styles = getStyles(colors, isDark);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [summaryData, spending, goalsData] = await Promise.all([
        getDashboardSummary(token, CURRENT_MONTH, CURRENT_YEAR),
        getSpendingByCategory(token, CURRENT_MONTH, CURRENT_YEAR),
        getSavingsGoals(token),
      ]);
      setSummary(summaryData);
      setCategoryData(spending);
      setGoals(goalsData);
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
    color: c.color ?? colors.textSecondary,
    legendFontColor: colors.text,
    legendFontSize: 13,
  }));

  const chartConfig = {
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: (opacity = 1) =>
      isDark
        ? `rgba(255, 255, 255, ${opacity})`
        : `rgba(17, 24, 39, ${opacity})`,
    labelColor: () => colors.text,
    decimalPlaces: 0,
  };

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
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconRow}>
              <Ionicons
                name="arrow-down-circle"
                size={16}
                color={colors.successFixed}
              />
              <Text style={styles.summaryLabel}>Income</Text>
            </View>
            <Text style={styles.summaryAmount}>
              {formatCurrency(
                Number(summary.monthIncome).toFixed(2),
                user?.currency,
              )}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <View style={styles.summaryIconRow}>
              <Ionicons
                name="arrow-up-circle"
                size={16}
                color={colors.dangerFixed}
              />
              <Text style={styles.summaryLabel}>Expense</Text>
            </View>
            <Text style={styles.summaryAmount}>
              {formatCurrency(
                Number(summary.monthExpense).toFixed(2),
                user?.currency,
              )}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.sectionWrapper}>
        <Text style={styles.sectionHeader}>Spending by Category</Text>
        {pieChartData.length === 0 ? (
          <Text style={styles.empty}>No expenses this month</Text>
        ) : (
          <View>
            <PieChart
              data={pieChartData}
              width={screenWidth - 64}
              height={140}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft={String((screenWidth - 64) / 4)} // centers the now-legend-less ring
              hasLegend={false}
            />
            <View style={styles.legend}>
              {categoryData.map((c, i) => {
                const total = categoryData.reduce(
                  (sum, item) => sum + Number(item.total),
                  0,
                );
                const percent =
                  total > 0 ? Math.round((Number(c.total) / total) * 100) : 0;
                return (
                  <View key={c.categoryName} style={styles.legendRow}>
                    <View style={styles.legendLeft}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: c.color ?? colors.textSecondary },
                        ]}
                      />
                      <Text style={styles.legendName} numberOfLines={1}>
                        {c.categoryName}
                      </Text>
                    </View>
                    <View style={styles.legendRight}>
                      <Text style={styles.legendValue}>
                        {formatCurrency(c.total, user?.currency)}
                      </Text>
                      <Text style={styles.legendPercent}>({percent}%)</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </View>

      <View style={styles.sectionWrapper}>
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
                  <Text
                    style={[styles.budgetAmounts, isOver && styles.overText]}
                  >
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
                          ? colors.danger
                          : (budget.category.color ?? colors.primary),
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.sectionWrapper}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Savings Goals</Text>
          <Text
            style={styles.sectionLink}
            onPress={() => router.push("/(tabs)/goals")}
          >
            See all
          </Text>
        </View>
        {goals.length === 0 ? (
          <Text style={styles.empty}>No savings goals yet</Text>
        ) : (
          goals.slice(0, 3).map((goal) => {
            const target = parseFloat(goal.targetAmount);
            const current = parseFloat(goal.currentAmount);
            const percent = Math.min(current / target, 1);
            const remaining = Math.max(target - current, 0);
            const color = goal.color ?? colors.primary;

            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.goalCard}
                onPress={() => router.push(`/goals/${goal.id}`)}
              >
                <View style={styles.goalCardHeader}>
                  <View style={styles.goalCardLeft}>
                    <View
                      style={[
                        styles.goalIconCircle,
                        { backgroundColor: color + "26" },
                      ]}
                    >
                      <Ionicons
                        name={(goal.icon as any) ?? "flag-outline"}
                        size={20}
                        color={color}
                      />
                    </View>
                    <View style={styles.goalTextBlock}>
                      <Text style={styles.goalName} numberOfLines={1}>
                        {goal.name}
                      </Text>
                      <Text style={styles.goalTarget}>
                        Target: {formatCurrency(target, user?.currency)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.goalCurrent, { color }]}>
                    {formatCurrency(current, user?.currency)}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${percent * 100}%`, backgroundColor: color },
                    ]}
                  />
                </View>

                <View style={styles.goalFooterRow}>
                  <Text style={styles.goalRemaining}>
                    {remaining > 0
                      ? `${formatCurrency(remaining, user?.currency)} to go`
                      : "Goal reached!"}
                  </Text>
                  <Text style={[styles.goalPercent, { color }]}>
                    {Math.round(percent * 100)}%
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.sectionWrapper}>
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
          summary.recentTransactions.map((tx, index) => (
            <View
              key={tx.id}
              style={[
                styles.txRow,
                index === summary.recentTransactions.length - 1 &&
                  styles.txRowLast,
              ]}
            >
              <View style={styles.txLeft}>
                <View
                  style={[
                    styles.dot,
                    {
                      backgroundColor:
                        tx.category.color ?? colors.textSecondary,
                    },
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
                {formatCurrency(
                  parseFloat(tx.amount).toFixed(2),
                  user?.currency,
                )}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function getStyles(colors: ThemeColors, isDark: boolean) {
  // Glass tint adapts to theme: white overlay reads as "frosted" on any base color,
  // but a touch more opacity in dark mode keeps text legible against the darker primary.
  const glassFill = isDark
    ? "rgba(255, 255, 255, 0.10)"
    : "rgba(255, 255, 255, 0.16)";
  const glassBorder = isDark
    ? "rgba(255, 255, 255, 0.18)"
    : "rgba(255, 255, 255, 0.28)";

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 16, paddingBottom: 40, gap: 16 },
    loadingText: {
      textAlign: "center",
      marginTop: 40,
      color: colors.textSecondary,
      fontFamily: fonts.regular,
    },
    greeting: { fontSize: 20, fontFamily: fonts.bold, color: colors.text },
    balanceCard: {
      backgroundColor: colors.heroCardBackground, // was: colors.primary
      borderRadius: 20,
      padding: 20,
    },
    balanceLabel: {
      color: colors.heroCardTextMuted, // was: colors.primaryLight
      fontFamily: fonts.medium,
      fontSize: 13,
    },
    balanceAmount: {
      color: colors.heroCardText, // was: colors.white
      fontSize: 34,
      fontFamily: fonts.bold,
      marginTop: 4,
    },
    summaryRow: { flexDirection: "row", gap: 12, marginTop: 20 },
    summaryCard: {
      flex: 1,
      borderRadius: 14,
      padding: 14,
      backgroundColor: glassFill,
      borderWidth: 1,
      borderColor: glassBorder,
    },
    summaryIconRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    summaryLabel: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.heroCardTextMuted, // was: colors.primaryLight
    },
    summaryAmount: {
      fontSize: 17,
      fontFamily: fonts.bold,
      color: colors.heroCardText, // was: colors.white — this was likely the invisible-text culprit
      marginTop: 6,
    },
    sectionWrapper: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    sectionHeader: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      marginBottom: 14,
      color: colors.text,
    },
    sectionHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },
    sectionLink: {
      fontSize: 13,
      color: colors.primary,
      fontFamily: fonts.semibold,
    },
    empty: { color: colors.textSecondary, fontFamily: fonts.regular },
    budgetRow: { marginBottom: 16 },
    budgetRowHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 6,
    },
    budgetCategory: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    budgetAmounts: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    overText: { color: colors.danger, fontFamily: fonts.semibold },
    progressTrack: {
      height: 6,
      backgroundColor: colors.borderLight,
      borderRadius: 3,
      overflow: "hidden",
    },
    progressFill: { height: "100%", borderRadius: 3 },
    goalCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
    },
    goalCardHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 10,
    },
    goalCardLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
      minWidth: 0,
    },
    goalIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    goalTextBlock: { flex: 1, minWidth: 0 },
    goalName: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
    goalTarget: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 1,
    },
    goalCurrent: { fontSize: 15, fontFamily: fonts.bold, paddingLeft: 8 },
    goalFooterRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 6,
    },
    goalRemaining: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    goalPercent: { fontSize: 12, fontFamily: fonts.semibold },
    txRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    txRowLast: { borderBottomWidth: 0, paddingBottom: 0 },
    txLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    txCategory: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    txDescription: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    txAmount: { fontSize: 14, fontFamily: fonts.semibold },
    incomeText: { color: colors.success },
    expenseText: { color: colors.danger },
    legend: { marginTop: 12, gap: 8 },
    legendRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    legendLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
      minWidth: 0,
    },
    legendDot: { width: 10, height: 10, borderRadius: 5 },
    legendName: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.text,
      flexShrink: 1,
    },
    legendRight: { flexDirection: "row", alignItems: "center", gap: 4 },
    legendValue: {
      fontSize: 13,
      fontFamily: fonts.semibold,
      color: colors.text,
    },
    legendPercent: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
  });
}
