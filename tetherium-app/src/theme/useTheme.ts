import { useColorScheme } from "react-native";
import { lightColors, darkColors, ThemeColors } from "./colors";
import { useThemeStore } from "@/stores/themeStore";

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const systemScheme = useColorScheme();
  const preference = useThemeStore((state) => state.preference);

  const isDark =
    preference === "system" ? systemScheme === "dark" : preference === "dark";

  return {
    colors: isDark ? darkColors : lightColors,
    isDark,
  };
}
