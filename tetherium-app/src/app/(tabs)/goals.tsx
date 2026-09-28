import { useCallback, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { getSavingsGoals, SavingsGoal } from "@/api";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { formatCurrency } from "@/utils/currency";
import { fonts } from "@/theme/typography";
import { DonutChart } from "@/components/DonutChart";

export default function GoalsScreen() {
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
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
      const data = await getSavingsGoals(token);
      setGoals(data);
    } catch (err) {
      console.error("Failed to load goals", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={load} />
        }
      >
        {goals.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
              <Ionicons
                name="flag-outline"
                size={32}
                color={colors.textSecondary}
              />
            </View>
            <Text style={styles.emptyTitle}>No savings goals yet</Text>
            <Text style={styles.emptySubtitle}>
              Set a target and start tracking your progress.
            </Text>
          </View>
        ) : (
          goals.map((goal) => {
            const target = parseFloat(goal.targetAmount);
            const current = parseFloat(goal.currentAmount);
            const percent = Math.min(current / target, 1);
            const isComplete = current >= target;
            const color = goal.color ?? colors.primary;

            return (
              <TouchableOpacity
                key={goal.id}
                style={styles.card}
                onPress={() => router.push(`/goals/${goal.id}`)}
              >
                <DonutChart
                  segments={[{ value: current, color }]}
                  total={target}
                  size={72}
                  strokeWidth={8}
                  centerLabel=""
                  centerValue={`${Math.round(percent * 100)}%`}
                />
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={styles.goalName} numberOfLines={1}>
                      {goal.name}
                    </Text>
                    {isComplete && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color={colors.success}
                      />
                    )}
                  </View>
                  <Text style={styles.goalAmounts}>
                    {formatCurrency(current, user?.currency)} of{" "}
                    {formatCurrency(target, user?.currency)}
                  </Text>
                  {goal.targetDate && (
                    <Text style={styles.goalDate}>
                      Target:{" "}
                      {new Date(goal.targetDate).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                  )}
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/goals/add")}
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.surface },
    content: { padding: 16, gap: 12, paddingBottom: 100 },
    card: {
      flexDirection: "row",
      alignItems: "center",
      gap: 14,
      backgroundColor: colors.background,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.borderLight,
      padding: 14,
    },
    cardBody: { flex: 1, minWidth: 0 },
    cardHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    goalName: {
      fontSize: 15,
      fontFamily: fonts.semibold,
      color: colors.text,
      flexShrink: 1,
    },
    goalAmounts: {
      fontSize: 13,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    goalDate: {
      fontSize: 12,
      fontFamily: fonts.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
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
