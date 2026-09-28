import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuthStore } from "@/stores/authStore";
import { createCategory, updateCategory, getCategories } from "@/api";
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

const ICONS = [
  "cart-outline",
  "restaurant-outline",
  "home-outline",
  "car-outline",
  "film-outline",
  "medkit-outline",
  "airplane-outline",
  "school-outline",
  "fitness-outline",
  "gift-outline",
  "cash-outline",
  "game-controller-outline",
  "phone-portrait-outline",
  "shirt-outline",
  "paw-outline",
  "ellipsis-horizontal",
] as const;

export default function AddCategoryScreen() {
  const { type, id } = useLocalSearchParams<{
    type: "INCOME" | "EXPENSE";
    id?: string;
  }>();
  const isEditMode = !!id;

  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [icon, setIcon] = useState<string>(ICONS[0]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(isEditMode);

  const token = useAuthStore((state) => state.token);
  const router = useRouter();
  const { colors } = useTheme();
  const styles = getStyles(colors);

  useEffect(() => {
    if (!isEditMode || !token || !id) return;
    // No single getCategory endpoint exists yet, so fetch the list and find it
    getCategories(token)
      .then((cats) => {
        const existing = cats.find((c) => c.id === id);
        if (existing) {
          setName(existing.name);
          setColor(existing.color ?? COLORS[0]);
          setIcon(existing.icon ?? ICONS[0]);
        }
      })
      .finally(() => setLoading(false));
  }, [isEditMode, token, id]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Enter a category name");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      if (isEditMode && id) {
        await updateCategory(token, id, { name: name.trim(), color, icon });
      } else {
        await createCategory(token, {
          name: name.trim(),
          type: type ?? "EXPENSE",
          color,
          icon,
        });
      }
      router.back();
    } catch (err: any) {
      Alert.alert("Failed to save", err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Subscriptions"
        placeholderTextColor={colors.textSecondary}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Icon</Text>
      <View style={styles.iconRow}>
        {ICONS.map((i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.iconSwatch,
              icon === i && {
                backgroundColor: color + "26",
                borderColor: color,
              },
            ]}
            onPress={() => setIcon(i)}
          >
            <Ionicons
              name={i as any}
              size={22}
              color={icon === i ? color : colors.textSecondary}
            />
          </TouchableOpacity>
        ))}
      </View>

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

      <View style={styles.previewRow}>
        <View
          style={[styles.previewIconCircle, { backgroundColor: color + "26" }]}
        >
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        <Text style={styles.previewText}>{name || "Category preview"}</Text>
      </View>

      <TouchableOpacity
        style={styles.saveButton}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={styles.saveButtonText}>
          {saving ? "Saving..." : isEditMode ? "Save Changes" : "Save Category"}
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
    iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    iconSwatch: {
      width: 44,
      height: 44,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    colorRow: { flexDirection: "row", gap: 12 },
    colorSwatch: { width: 36, height: 36, borderRadius: 18 },
    colorSelected: { borderWidth: 3, borderColor: colors.text },
    previewRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 24,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
    },
    previewIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: "center",
      justifyContent: "center",
    },
    previewText: { fontSize: 14, fontFamily: fonts.medium, color: colors.text },
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
