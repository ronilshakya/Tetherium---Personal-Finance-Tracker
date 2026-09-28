import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import {
  getSavingsGoal,
  addGoalContribution,
  deleteSavingsGoal,
  SavingsGoalDetail,
} from "@/api";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import { fonts } from "@/theme/typography";
import { DonutChart } from "@/components/DonutChart";

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [goal, setGoal] = useState<SavingsGoalDetail | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [adding, setAdding] = useState(false);

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const load = useCallback(async () => {
    if (!token || !id) return;
    try {
      const data = await getSavingsGoal(token, id);
      setGoal(data);
    } catch (err: any) {
      Alert.alert("Failed to load", err.message);
    }
  }, [token, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const handleAddContribution = async () => {
    const amount = parseFloat(contributionAmount);
    if (!amount || amount <= 0) {
      Alert.alert("Invalid amount", "Enter an amount greater than 0");
      return;
    }
    if (!token || !id) return;

    setAdding(true);
    try {
      await addGoalContribution(token, id, { amount });
      setContributionAmount("");
      load();
    } catch (err: any) {
      Alert.alert("Failed to add", err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete goal",
      "This will also delete all its contributions. This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (!token || !id) return;
            try {
              await deleteSavingsGoal(token, id);
              router.back();
            } catch (err: any) {
              Alert.alert("Failed to delete", err.message);
            }
          },
        },
      ],
    );
  };

  if (!goal) return <View style={styles.container} />;

  const target = parseFloat(goal.targetAmount);
  const current = parseFloat(goal.currentAmount);
  const percent = Math.min(current / target, 1);
  const remaining = Math.max(target - current, 0);
  const color = goal.color ?? colors.primary;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.summaryCard}>
        <DonutChart
          segments={[{ value: current, color }]}
          total={target}
          size={120}
          strokeWidth={12}
          centerLabel="Saved"
          centerValue={`${Math.round(percent * 100)}%`}
        />
        <Text style={styles.currentAmount}>
          {formatCurrency(current, user?.currency)}
        </Text>
        <Text style={styles.targetText}>
          of {formatCurrency(target, user?.currency)} goal
        </Text>
        {remaining > 0 && (
          <Text style={styles.remainingText}>
            {formatCurrency(remaining, user?.currency)} remaining
          </Text>
        )}
        {goal.targetDate && (
          <Text style={styles.dateText}>
            Target date: {new Date(goal.targetDate).toLocaleDateString()}
          </Text>
        )}
      </View>

      <View style={styles.addCard}>
        <Text style={styles.sectionHeader}>Add Contribution</Text>
        <View style={styles.contributionRow}>
          <TextInput
            style={styles.contributionInput}
            keyboardType="decimal-pad"
            placeholder="Amount"
            placeholderTextColor={colors.textSecondary}
            value={contributionAmount}
            onChangeText={setContributionAmount}
          />
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddContribution}
            disabled={adding}
          >
            <Text style={styles.addButtonText}>{adding ? "..." : "Add"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.historyCard}>
        <Text style={styles.sectionHeader}>Contribution History</Text>
        {goal.contributions.length === 0 ? (
          <Text style={styles.empty}>No contributions yet</Text>
        ) : (
          goal.contributions.map((c, i) => (
            <View key={c.id}>
              <View style={styles.historyRow}>
                <Text style={styles.historyDate}>
                  {new Date(c.date).toLocaleDateString()}
                </Text>
                <Text style={styles.historyAmount}>
                  +{formatCurrency(c.amount, user?.currency)}
                </Text>
              </View>
              {i < goal.contributions.length - 1 && (
                <View style={styles.divider} />
              )}
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
        <Text style={styles.deleteButtonText}>Delete Goal</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 16, gap: 16 },
    summaryCard: {
      backgroundColor: colors.background,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 24,
      alignItems: "center",
    },
    currentAmount: {
      fontSize: 28,
      fontFamily: fonts.bold,
      color: colors.text,
      marginTop: 16,
    },
    targetText: {
      fontSize: 14,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    remainingText: {
      fontSize: 13,
      fontFamily: fonts.medium,
      color: colors.primary,
      marginTop: 8,
    },
    dateText: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 4,
    },
    addCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
    },
    sectionHeader: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginBottom: 12,
    },
    contributionRow: { flexDirection: "row", gap: 8 },
    contributionInput: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      fontFamily: fonts.regular,
      backgroundColor: colors.surface,
    },
    addButton: {
      backgroundColor: colors.primary,
      borderRadius: 8,
      paddingHorizontal: 20,
      alignItems: "center",
      justifyContent: "center",
    },
    addButtonText: { color: colors.white, fontFamily: fonts.semibold },
    historyCard: {
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 16,
    },
    empty: { color: colors.textSecondary, fontFamily: fonts.regular },
    historyRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 10,
    },
    historyDate: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
    },
    historyAmount: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.success,
    },
    divider: { height: 1, backgroundColor: colors.borderLight },
    deleteButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      padding: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.danger,
    },
    deleteButtonText: { color: colors.danger, fontFamily: fonts.semibold },
  });
}
