import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "@/stores/authStore";
import { createCategory } from "@/api";
const COLORS = [
  "#2563eb",
  "#16a34a",
  "#dc2626",
  "#9333ea",
  "#ea580c",
  "#0891b2",
];

export default function AddCategoryScreen() {
  const { type } = useLocalSearchParams<{ type: "INCOME" | "EXPENSE" }>();
  const [name, setName] = useState("");
  const [color, setColor] = useState(COLORS[0]);
  const [saving, setSaving] = useState(false);

  const token = useAuthStore((state) => state.token);
  const router = useRouter();

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Enter a category name");
      return;
    }
    if (!token) return;

    setSaving(true);
    try {
      await createCategory(token, {
        name: name.trim(),
        type: type ?? "EXPENSE",
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
      <Text style={styles.label}>Category Name</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Subscriptions"
        value={name}
        onChangeText={setName}
      />

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
          {saving ? "Saving..." : "Save Category"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#fff" },
  label: { fontSize: 14, fontWeight: "600", marginTop: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
  },
  colorRow: { flexDirection: "row", gap: 12 },
  colorSwatch: { width: 36, height: 36, borderRadius: 18 },
  colorSelected: { borderWidth: 3, borderColor: "#111827" },
  saveButton: {
    marginTop: 32,
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  saveButtonText: { color: "white", fontWeight: "700", fontSize: 16 },
});
