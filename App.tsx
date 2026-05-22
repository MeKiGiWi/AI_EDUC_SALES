import React, { useEffect } from "react";
import { Platform, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppNavigator } from "./src/navigation/AppNavigator";
import { colors } from "./src/theme/tokens";

export default function App() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") {
      return;
    }

    const styleId = "ai-sales-academy-scrollbar-style";
    if (document.getElementById(styleId)) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      [data-testid="simulator-message-list"] {
        scrollbar-width: thin;
        scrollbar-color: rgba(80, 124, 91, 0.55) transparent;
      }

      [data-testid="simulator-message-list"]::-webkit-scrollbar {
        width: 8px;
      }

      [data-testid="simulator-message-list"]::-webkit-scrollbar-track {
        background: transparent;
      }

      [data-testid="simulator-message-list"]::-webkit-scrollbar-thumb {
        background: rgba(80, 124, 91, 0.55);
        border-radius: 999px;
      }

      [data-testid="simulator-message-list"]::-webkit-scrollbar-button {
        display: none;
        width: 0;
        height: 0;
      }
    `;
    document.head.appendChild(styleElement);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
