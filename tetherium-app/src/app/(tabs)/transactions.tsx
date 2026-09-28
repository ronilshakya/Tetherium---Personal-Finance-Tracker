import { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useAuthStore } from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import {
  getTransactions,
  getCategories,
  getSpendingByCategory,
  Category,
  Transaction,
} from "@/api";
import { ThemeColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";
import { formatCurrency } from "@/utils/currency";
import { fonts } from "@/theme/typography";
import { DonutChart } from "@/components/DonutChart";

type DateMode = "month" | "week" | "custom" | "all";

function getDateLabel(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  if (d.getTime() === today.getTime()) return "Today";
  if (d.getTime() === yesterday.getTime()) return "Yesterday";
  return Intl.DateTimeFormat(undefined, {
    month: "long",
    day: "numeric",
  }).format(date);
}

function getTimeLabel(dateStr: string): string {
  return Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

const CHART_COLORS = [
  "#6366f1",
  "#10b981",
  "#f43f5e",
  "#8083ff",
  "#f59e0b",
  "#06b6d4",
];

export default function TransactionsScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { transactions, loading, setTransactions, setLoading } =
    useTransactionStore();
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const [monthDate, setMonthDate] = useState(new Date());
  const [dateMode, setDateMode] = useState<DateMode>("month");
  const [showTune, setShowTune] = useState(false);
  const [customFrom, setCustomFrom] = useState<Date | null>(null);
  const [customTo, setCustomTo] = useState<Date | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [spendSummary, setSpendSummary] = useState<
    { categoryName: string; color: string | null; total: number }[]
  >([]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    getCategories(token).then(setCategories);
  }, [token]);

  const getRange = useCallback((): { from?: Date; to?: Date } => {
    const now = new Date();
    if (dateMode === "week") {
      const day = now.getDay();
      const from = new Date(now);
      from.setDate(now.getDate() - day);
      from.setHours(0, 0, 0, 0);
      return { from, to: now };
    }
    if (dateMode === "custom") {
      return { from: customFrom ?? undefined, to: customTo ?? undefined };
    }
    if (dateMode === "all") {
      return {};
    }
    // month
    const from = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const to = new Date(
      monthDate.getFullYear(),
      monthDate.getMonth() + 1,
      0,
      23,
      59,
      59,
    );
    return { from, to };
  }, [dateMode, monthDate, customFrom, customTo]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const range = getRange();
      const data = await getTransactions(token, {
        ...range,
        categoryId: selectedCategoryId ?? undefined,
        search: debouncedSearch || undefined,
      });
      setTransactions(data);

      if (dateMode === "month") {
        const spending = await getSpendingByCategory(
          token,
          monthDate.getMonth() + 1,
          monthDate.getFullYear(),
        );
        setSpendSummary(spending);
      } else {
        setSpendSummary([]);
      }
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    dateMode,
    monthDate,
    selectedCategoryId,
    debouncedSearch,
    getRange,
  ]);

  useFocusEffect(
    useCallback(() => {
      loadTransactions();
    }, [loadTransactions]),
  );

  const openFromPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: customFrom ?? new Date(),
        mode: "date",
        onValueChange: (event, selectedDate) => {
          if (selectedDate) setCustomFrom(selectedDate);
        },
      });
    } else {
      setShowFromPicker(true);
    }
  };

  const openToPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: customTo ?? new Date(),
        mode: "date",
        onValueChange: (event, selectedDate) => {
          if (selectedDate) setCustomTo(selectedDate);
        },
      });
    } else {
      setShowToPicker(true);
    }
  };

  const groups = useMemo(() => {
    const map = new Map<string, Transaction[]>();
    for (const tx of transactions) {
      const key = new Date(tx.date).toDateString();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(tx);
    }
    return Array.from(map.values()).map((txs) => ({
      label: getDateLabel(txs[0].date),
      total: txs.reduce(
        (sum, t) =>
          sum +
          (t.type === "EXPENSE" ? -parseFloat(t.amount) : parseFloat(t.amount)),
        0,
      ),
      transactions: txs,
    }));
  }, [transactions]);

  const totalSpend = spendSummary.reduce((sum, s) => sum + Number(s.total), 0);
  const donutSegments = spendSummary.map((s, i) => ({
    value: Number(s.total),
    color: s.color ?? CHART_COLORS[i % CHART_COLORS.length],
  }));

  const monthLabel = Intl.DateTimeFormat(undefined, {
    month: "long",
    year: "numeric",
  }).format(monthDate);

  const goPrevMonth = () =>
    setMonthDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() - 1, 1),
    );
  const goNextMonth = () =>
    setMonthDate(
      new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 1),
    );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
        }
      >
        {/* Search + filter toggle */}
        <View style={styles.searchRow}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search" size={18} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search transactions..."
              placeholderTextColor={colors.textSecondary}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <TouchableOpacity
            style={styles.tuneButton}
            onPress={() => setShowTune((v) => !v)}
          >
            <Ionicons name="options-outline" size={20} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Expandable panel: switch between Month / Week / Custom / All */}
        {showTune && (
          <View style={styles.tunePanel}>
            <View style={styles.filterRow}>
              {(["month", "week", "all", "custom"] as DateMode[]).map((m) => (
                <TouchableOpacity
                  key={m}
                  style={[
                    styles.filterChip,
                    dateMode === m && styles.filterChipActive,
                  ]}
                  onPress={() => setDateMode(m)}
                >
                  <Text
                    style={
                      dateMode === m
                        ? styles.filterChipActiveText
                        : styles.filterChipText
                    }
                  >
                    {m === "month"
                      ? "By Month"
                      : m === "week"
                        ? "This Week"
                        : m === "all"
                          ? "All Time"
                          : "Custom"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {dateMode === "custom" && (
              <View style={styles.customRow}>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={openFromPicker}
                >
                  <Text style={styles.dateButtonText}>
                    {customFrom ? customFrom.toLocaleDateString() : "From date"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={openToPicker}
                >
                  <Text style={styles.dateButtonText}>
                    {customTo ? customTo.toLocaleDateString() : "To date"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {Platform.OS === "ios" && showFromPicker && (
          <DateTimePicker
            value={customFrom ?? new Date()}
            mode="date"
            display="default"
            onValueChange={(e, d) => {
              setShowFromPicker(false);
              if (d) setCustomFrom(d);
            }}
            onDismiss={() => setShowFromPicker(false)}
          />
        )}
        {Platform.OS === "ios" && showToPicker && (
          <DateTimePicker
            value={customTo ?? new Date()}
            mode="date"
            display="default"
            onValueChange={(e, d) => {
              setShowToPicker(false);
              if (d) setCustomTo(d);
            }}
            onDismiss={() => setShowToPicker(false)}
          />
        )}

        {/* Month navigator — only meaningful in month mode */}
        {dateMode === "month" && (
          <View style={styles.monthNav}>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={goPrevMonth}
            >
              <Ionicons name="chevron-back" size={18} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.monthNavLabel}>
              <Ionicons
                name="calendar-outline"
                size={16}
                color={colors.primary}
              />
              <Text style={styles.monthNavText}>{monthLabel}</Text>
            </View>
            <TouchableOpacity
              style={styles.monthNavButton}
              onPress={goNextMonth}
            >
              <Ionicons name="chevron-forward" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        )}

        {/* Spending summary with donut — only for month mode, since it's month-scoped data */}
        {dateMode === "month" && spendSummary.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Monthly Spend</Text>
            <Text style={styles.summaryAmount}>
              {formatCurrency(totalSpend, user?.currency)}
            </Text>

            <View style={styles.summaryBody}>
              <DonutChart
                segments={donutSegments}
                // centerLabel="Spent"
                // centerValue={formatCurrency(totalSpend, user?.currency)}
              />
              <View style={styles.legend}>
                {spendSummary.map((s, i) => {
                  const percent =
                    totalSpend > 0
                      ? Math.round((Number(s.total) / totalSpend) * 100)
                      : 0;
                  return (
                    <View key={s.categoryName} style={styles.legendRow}>
                      <View style={styles.legendLeft}>
                        <View
                          style={[
                            styles.legendDot,
                            {
                              backgroundColor:
                                s.color ??
                                CHART_COLORS[i % CHART_COLORS.length],
                            },
                          ]}
                        />
                        <Text style={styles.legendName} numberOfLines={1}>
                          {s.categoryName}
                        </Text>
                      </View>
                      <View style={styles.legendRight}>
                        <Text style={styles.legendValue}>
                          {formatCurrency(s.total, user?.currency)}
                        </Text>
                        <Text style={styles.legendPercent}>({percent}%)</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Category filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryFilterList}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategoryId && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategoryId(null)}
          >
            <Text
              style={
                !selectedCategoryId
                  ? styles.categoryChipActiveText
                  : styles.categoryChipText
              }
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((c) => (
            <TouchableOpacity
              key={c.id}
              style={[
                styles.categoryChip,
                selectedCategoryId === c.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategoryId(c.id)}
            >
              <Text
                style={
                  selectedCategoryId === c.id
                    ? styles.categoryChipActiveText
                    : styles.categoryChipText
                }
              >
                {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Grouped transaction list */}
        {groups.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="receipt-outline"
                size={32}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No matching transactions</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term, category, or time range.
            </Text>
          </View>
        ) : (
          groups.map((group) => (
            <View key={group.label} style={styles.group}>
              <View style={styles.groupHeaderRow}>
                <Text style={styles.groupLabel}>{group.label}</Text>
                <Text
                  style={[
                    styles.groupTotal,
                    group.total >= 0 ? styles.income : styles.expense,
                  ]}
                >
                  {group.total >= 0 ? "+" : "-"}
                  {formatCurrency(Math.abs(group.total), user?.currency)}
                </Text>
              </View>
              <View style={styles.groupCard}>
                {group.transactions.map((tx, i) => (
                  <View key={tx.id}>
                    <TouchableOpacity
                      style={styles.row}
                      onPress={() => router.push(`/transactions/${tx.id}`)}
                    >
                      <View style={styles.rowLeft}>
                        <View
                          style={[
                            styles.iconCircle,
                            {
                              backgroundColor:
                                (tx.category.color ?? colors.textSecondary) +
                                "26",
                            },
                          ]}
                        >
                          <Ionicons
                            name={
                              (tx.category.icon as any) ?? "pricetag-outline"
                            }
                            size={18}
                            color={tx.category.color ?? colors.textSecondary}
                          />
                        </View>
                        <View style={styles.rowTextBlock}>
                          <Text style={styles.rowTitle} numberOfLines={1}>
                            {tx.description || tx.category.name}
                          </Text>
                          <View style={styles.badgeRow}>
                            <View
                              style={[
                                styles.categoryBadge,
                                {
                                  backgroundColor:
                                    (tx.category.color ??
                                      colors.textSecondary) + "26",
                                },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.categoryBadgeText,
                                  {
                                    color:
                                      tx.category.color ?? colors.textSecondary,
                                  },
                                ]}
                              >
                                {tx.category.name}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                      <View style={styles.rowRight}>
                        <Text
                          style={[
                            styles.rowAmount,
                            tx.type === "INCOME"
                              ? styles.income
                              : styles.expense,
                          ]}
                        >
                          {tx.type === "INCOME" ? "+" : "-"}
                          {formatCurrency(tx.amount, user?.currency)}
                        </Text>
                        <Text style={styles.rowTime}>
                          {getTimeLabel(tx.date)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                    {i < group.transactions.length - 1 && (
                      <View style={styles.divider} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/transactions/add")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 16, paddingBottom: 100, gap: 12 },

    searchRow: { flexDirection: "row", gap: 8 },
    searchInputWrapper: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingHorizontal: 12,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.text,
    },
    tuneButton: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
    },

    tunePanel: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 12,
      gap: 10,
    },
    filterRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
    filterChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    filterChipText: {
      color: colors.text,
      fontSize: 13,
      fontFamily: fonts.medium,
    },
    filterChipActiveText: {
      color: colors.white,
      fontSize: 13,
      fontFamily: fonts.semibold,
    },
    customRow: { flexDirection: "row", gap: 8 },
    dateButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      padding: 10,
      alignItems: "center",
    },
    dateButtonText: {
      color: colors.text,
      fontSize: 13,
      fontFamily: fonts.regular,
    },

    monthNav: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.background,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderLight,
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    monthNavButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
    },
    monthNavLabel: { flexDirection: "row", alignItems: "center", gap: 6 },
    monthNavText: {
      fontSize: 16,
      fontFamily: fonts.semibold,
      color: colors.text,
    },

    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
    },
    summaryLabel: {
      fontSize: 12,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
      marginBottom: 4,
    },
    summaryAmount: { fontSize: 28, fontFamily: fonts.bold, color: colors.text },
    summaryBody: {
      flexDirection: "row",
      alignItems: "center",
      gap: 16,
      marginTop: 16,
    },
    legend: { flex: 1, gap: 8 },
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

    categoryFilterList: { flexGrow: 0 },

    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      marginRight: 8,
    },
    categoryChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    categoryChipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontFamily: fonts.medium,
    },
    categoryChipActiveText: {
      color: colors.white,
      fontSize: 13,
      fontFamily: fonts.semibold,
    },

    group: { gap: 6 },
    groupHeaderRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 2,
    },
    groupLabel: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.textSecondary,
    },
    groupTotal: { fontSize: 13, fontFamily: fonts.semibold },
    groupCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 12,
    },

    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 10,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      flex: 1,
      minWidth: 0,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    rowTextBlock: { flex: 1, minWidth: 0 },
    rowTitle: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
    badgeRow: { flexDirection: "row", marginTop: 4 },
    categoryBadge: {
      paddingVertical: 2,
      paddingHorizontal: 8,
      borderRadius: 6,
    },
    categoryBadgeText: { fontSize: 11, fontFamily: fonts.medium },
    rowRight: { alignItems: "flex-end", paddingLeft: 8 },
    rowAmount: { fontSize: 14, fontFamily: fonts.semibold, color: colors.text },
    rowTime: {
      fontSize: 11,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    income: { color: colors.success },
    expense: { color: colors.text },
    divider: { height: 1, backgroundColor: colors.borderLight },

    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      padding: 40,
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
    },
    emptyIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surfaceAlt,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 12,
    },
    emptyTitle: {
      fontSize: 16,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 4,
    },
    emptySubtitle: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      textAlign: "center",
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
