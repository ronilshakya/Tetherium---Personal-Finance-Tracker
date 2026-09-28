import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useAuthStore } from "@/stores/authStore";
import { createSavingsGoal } from "@/api";
import { useTheme } from "@/theme/useTheme";
import { ThemeColors } from "@/theme/colors";
import { fonts } from "@/theme/typography";

const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
];

export default function AddGoalScreen() {
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  const openPicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: targetDate ?? new Date(),
        mode: "date",
        minimumDate: new Date(),
        onValueChange: (event, date) => {
          if (date) setTargetDate(date);
        },
      });
    } else {
      setShowPicker(true);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Enter a goal name");
      return;
    }
    const parsedTarget = parseFloat(targetAmount);
    if (!parsedTarget || parsedTarget <= 0) {
      Alert.alert("Invalid amount", "Enter a target amount greater than 0");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      await createSavingsGoal(token, {
        name: name.trim(),
        targetAmount: parsedTarget,
        targetDate: targetDate?.toISOString(),
        color,
      });
      router.back();
    } catch (err: any) {
      Alert.alert("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Goal Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Emergency Fund"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Target Amount</Text>
      <TextInput
        style={styles.input}
        keyboardType="decimal-pad"
        placeholder="0.00"
        placeholderTextColor={colors.textSecondary}
        value={targetAmount}
        onChangeText={setTargetAmount}
      />

      <Text style={styles.label}>Target Date (optional)</Text>
      <TouchableOpacity style={styles.dateButton} onPress={openPicker}>
        <Text style={styles.dateButtonText}>
          {targetDate ? targetDate.toLocaleDateString() : "No deadline set"}
        </Text>
      </TouchableOpacity>

      {Platform.OS === "ios" && showPicker && (
        <DateTimePicker
          value={targetDate ?? new Date()}
          mode="date"
          minimumDate={new Date()}
          display="default"
          onValueChange={(event, date) => {
            setShowPicker(false);
            if (date) setTargetDate(date);
          }}
          onDismiss={() => setShowPicker(false)}
        />
      )}

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorRow}>
        {COLORS.map((c) => (
          <TouchableOpacity
            key={c}
            style={[
              styles.colorSwatch,
              { backgroundColor: c },
              color === c && styles.colorSelected,
            ]}
            onPress={() => setColor(c)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : "Create Goal"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

function getStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: colors.background },
    label: {
      fontSize: 14,
      fontFamily: fonts.semibold,
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      color: colors.text,
      fontFamily: fonts.regular,
      backgroundColor: colors.surface,
    },
    dateButton: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: 12,
      backgroundColor: colors.surface,
    },
    dateButtonText: { color: colors.text, fontFamily: fonts.regular },
    colorRow: { flexDirection: "row", gap: 12 },
    colorSwatch: { width: 36, height: 36, borderRadius: 18 },
    colorSelected: { borderWidth: 3, borderColor: colors.text },
    saveButton: {
      marginTop: 32,
      backgroundColor: colors.primary,
      padding: 16,
      borderRadius: 8,
      alignItems: "center",
    },
    saveButtonText: {
      color: colors.white,
      fontFamily: fonts.bold,
      fontSize: 16,
    },
  });
}
