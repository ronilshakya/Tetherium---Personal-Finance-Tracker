import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  Platform,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useAuthStore } from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { getTransactions, getCategories, Category } from "@/api";
import { ThemeColors } from "@/theme/colors";
import { useTheme } from "@/theme/useTheme";
import { formatCurrency } from "@/utils/currency";

type FilterPreset = "week" | "month" | "custom" | "all";

function getPresetRange(preset: FilterPreset): { from?: Date; to?: Date } {
  const now = new Date();
  if (preset === "week") {
    const day = now.getDay();
    const from = new Date(now);
    from.setDate(now.getDate() - day);
    from.setHours(0, 0, 0, 0);
    return { from, to: now };
  }
  if (preset === "month") {
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    return { from, to: now };
  }
  return {};
}

export default function TransactionsScreen() {
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const { transactions, loading, setTransactions, setLoading } =
    useTransactionStore();
  const router = useRouter();

  const [preset, setPreset] = useState<FilterPreset>("month");
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

  const { colors } = useTheme();
  const styles = getStyles(colors);

  // Debounce search input so we don't fire a request on every keystroke
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timeout);
  }, [search]);

  useEffect(() => {
    if (!token) return;
    getCategories(token).then(setCategories);
  }, [token]);

  const loadTransactions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      let range: { from?: Date; to?: Date };
      if (preset === "custom") {
        range = { from: customFrom ?? undefined, to: customTo ?? undefined };
      } else {
        range = getPresetRange(preset);
      }
      const data = await getTransactions(token, {
        ...range,
        categoryId: selectedCategoryId ?? undefined,
        search: debouncedSearch || undefined,
      });
      setTransactions(data);
    } catch (err) {
      console.error("Failed to load transactions", err);
    } finally {
      setLoading(false);
    }
  }, [
    token,
    preset,
    customFrom,
    customTo,
    selectedCategoryId,
    debouncedSearch,
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

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search description..."
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <View style={styles.filterRow}>
        {(["week", "month", "all", "custom"] as FilterPreset[]).map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.filterChip, preset === p && styles.filterChipActive]}
            onPress={() => setPreset(p)}
          >
            <Text
              style={
                preset === p
                  ? styles.filterChipActiveText
                  : styles.filterChipText
              }
            >
              {p === "week"
                ? "This Week"
                : p === "month"
                  ? "This Month"
                  : p === "all"
                    ? "All"
                    : "Custom"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {preset === "custom" && (
        <View style={styles.customRow}>
          <TouchableOpacity style={styles.dateButton} onPress={openFromPicker}>
            <Text style={styles.dateButtonText}>
              {customFrom ? customFrom.toLocaleDateString() : "From date"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateButton} onPress={openToPicker}>
            <Text style={styles.dateButtonText}>
              {customTo ? customTo.toLocaleDateString() : "To date"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {Platform.OS === "ios" && showFromPicker && (
        <DateTimePicker
          value={customFrom ?? new Date()}
          mode="date"
          display="default"
          onValueChange={(event, selectedDate) => {
            setShowFromPicker(false);
            if (selectedDate) setCustomFrom(selectedDate);
          }}
          onDismiss={() => setShowFromPicker(false)}
        />
      )}
      {Platform.OS === "ios" && showToPicker && (
        <DateTimePicker
          value={customTo ?? new Date()}
          mode="date"
          display="default"
          onValueChange={(event, selectedDate) => {
            setShowToPicker(false);
            if (selectedDate) setCustomTo(selectedDate);
          }}
          onDismiss={() => setShowToPicker(false)}
        />
      )}

      <FlatList
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilterList}
        contentContainerStyle={styles.categoryFilterContent}
        data={categories}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
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
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategoryId === item.id && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategoryId(item.id)}
          >
            <Text
              style={
                selectedCategoryId === item.id
                  ? styles.categoryChipActiveText
                  : styles.categoryChipText
              }
            >
              {item.name}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadTransactions} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.empty}>No transactions match these filters</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            onPress={() => router.push(`/transactions/${item.id}`)}
          >
            <View>
              <Text style={styles.category}>{item.category.name}</Text>
              {item.description ? (
                <Text style={styles.description}>{item.description}</Text>
              ) : null}
            </View>
            <Text
              style={[
                styles.amount,
                item.type === "INCOME" ? styles.income : styles.expense,
              ]}
            >
              {item.type === "INCOME" ? "+" : "-"}
              {formatCurrency(
                parseFloat(item.amount).toFixed(2),
                user?.currency,
              )}
            </Text>
          </TouchableOpacity>
        )}
      />
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
    container: { flex: 1, backgroundColor: colors.background },
    searchRow: { paddingHorizontal: 16, paddingTop: 12 },
    searchInput: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      fontSize: 14,
      color: colors.text,
      backgroundColor: colors.surface,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
      flexWrap: "wrap",
    },
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
    filterChipText: { color: colors.text, fontSize: 13 },
    filterChipActiveText: {
      color: colors.white,
      fontSize: 13,
      fontWeight: "600",
    },
    customRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: 16,
      paddingTop: 10,
    },
    dateButton: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 10,
      alignItems: "center",
    },
    dateButtonText: { color: colors.text, fontSize: 13 },
    categoryFilterList: { marginTop: 10, flexGrow: 0 },
    categoryFilterContent: { paddingHorizontal: 16, gap: 8 },
    categoryChip: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 8,
    },
    categoryChipActive: {
      backgroundColor: colors.primaryLight,
      borderColor: colors.primary,
    },
    categoryChipText: { color: colors.text, fontSize: 13 },
    categoryChipActiveText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: "600",
    },
    listContent: { padding: 16 },
    empty: { textAlign: "center", color: colors.textSecondary, marginTop: 40 },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderLight,
    },
    category: { fontSize: 16, fontWeight: "600", color: colors.text },
    description: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
    amount: { fontSize: 16, fontWeight: "700" },
    income: { color: colors.success },
    expense: { color: colors.danger },
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
