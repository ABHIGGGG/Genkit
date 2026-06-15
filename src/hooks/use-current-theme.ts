//it is a custom hook to get the current theme (light/dark) considering system preference
import { useTheme } from "next-themes";

export const useCurrentTheme = () => {
  const { theme, systemTheme } = useTheme();

  if (theme === "dark" || theme === "light") {
    return theme;
  }

  return systemTheme;
};
