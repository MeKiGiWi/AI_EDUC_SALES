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

    const viewportMeta = document.querySelector('meta[name="viewport"]');
    if (viewportMeta) {
      const content = viewportMeta.getAttribute("content") ?? "";
      if (!content.includes("interactive-widget")) {
        viewportMeta.setAttribute(
          "content",
          "width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content"
        );
      }
    }

    if (!document.querySelector('link[href*="fonts.googleapis.com/css2?family=Inter"]')) {
      const preconnectGoogle = document.createElement("link");
      preconnectGoogle.rel = "preconnect";
      preconnectGoogle.href = "https://fonts.googleapis.com";
      document.head.appendChild(preconnectGoogle);

      const preconnectGstatic = document.createElement("link");
      preconnectGstatic.rel = "preconnect";
      preconnectGstatic.href = "https://fonts.gstatic.com";
      preconnectGstatic.crossOrigin = "anonymous";
      document.head.appendChild(preconnectGstatic);

      const fontLink = document.createElement("link");
      fontLink.rel = "stylesheet";
      fontLink.href =
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap";
      document.head.appendChild(fontLink);
    }

    if (!document.getElementById("ai-sales-academy-inter-font")) {
      const interStyle = document.createElement("style");
      interStyle.id = "ai-sales-academy-inter-font";
      interStyle.textContent =
        "html body, html body * { font-family: 'Inter', system-ui, sans-serif !important }";
      document.head.appendChild(interStyle);
    }

    const styleId = "ai-sales-academy-scrollbar-style";
    if (document.getElementById(styleId)) {
      return;
    }

    const styleElement = document.createElement("style");
    styleElement.id = styleId;
    styleElement.textContent = `
      [data-testid="simulator-message-list"] {
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
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
