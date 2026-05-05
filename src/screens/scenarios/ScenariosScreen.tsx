import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { ScenarioGrid } from "../../components/scenarios/ScenarioGrid";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { ChatStateNotice } from "../../components/chat/ChatStateNotice";
import {
  API_SIMULATOR_MODULE_ID,
  fallbackSimulatorScenarios,
  mapApiScenarioToScenario
} from "../../data/simulatorMvpData";
import { simulatorApiService } from "../../services/simulatorApiService";
import { useTheme } from "../../theme/useTheme";
import type { Scenario } from "../../types/academy";

interface ScenariosScreenProps {
  activeScenarioId?: string;
  onLaunchScenario: (scenarioId: string) => void;
}

export function ScenariosScreen({ activeScenarioId, onLaunchScenario }: ScenariosScreenProps) {
  const theme = useTheme();
  const apiEnabled = simulatorApiService.isEnabled();
  const [scenarios, setScenarios] = useState<Scenario[]>(fallbackSimulatorScenarios);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const activeScenario = useMemo(
    () => scenarios.find((scenario) => scenario.id === activeScenarioId),
    [activeScenarioId, scenarios]
  );

  useEffect(() => {
    let isMounted = true;

    async function loadScenarios() {
      if (!apiEnabled) {
        setErrorText("Диалоговый сервис не подключен. Показаны MVP-сценарии для выбора интерфейса.");
        setScenarios(fallbackSimulatorScenarios);
        return;
      }

      try {
        setLoading(true);
        setErrorText(null);
        const items = await simulatorApiService.fetchSimulatorScenarios();
        if (!isMounted) {
          return;
        }

        const mapped = items.map((item) => mapApiScenarioToScenario(item, API_SIMULATOR_MODULE_ID));
        setScenarios(mapped.length > 0 ? mapped : fallbackSimulatorScenarios);
        if (mapped.length === 0) {
          setErrorText("Backend не вернул сценарии. Показан MVP-набор.");
        }
      } catch {
        if (!isMounted) {
          return;
        }

        setScenarios(fallbackSimulatorScenarios);
        setErrorText("Не удалось загрузить сценарии. Показан MVP-набор, можно повторить позже.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadScenarios();

    return () => {
      isMounted = false;
    };
  }, [apiEnabled, reloadKey]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Сценарии</Text>
          <Text style={[styles.subtitle, { color: theme.semantic.textSecondary }]}>
            Выберите режим работы AI под вашу задачу.
          </Text>
        </View>
        {loading ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color={theme.semantic.actionPrimary} />
            <Text style={[styles.loadingText, { color: theme.semantic.textSecondary }]}>Загружаем</Text>
          </View>
        ) : null}
      </View>

      {activeScenario ? (
        <AppCard tone="mint" style={styles.activeCard}>
          <View style={styles.activeText}>
            <Text style={[styles.activeLabel, { color: theme.semantic.textMuted }]}>Активный сценарий</Text>
            <Text style={[styles.activeTitle, { color: theme.semantic.textPrimary }]}>
              {activeScenario.title}
            </Text>
          </View>
          <AppButton label="Перейти в чат" onPress={() => onLaunchScenario(activeScenario.id)} tone="secondary" />
        </AppCard>
      ) : null}

      {errorText ? (
        <ChatStateNotice
          kind="error"
          text={errorText}
          actionLabel="Повторить"
          onAction={() => setReloadKey((current) => current + 1)}
        />
      ) : null}

      <ScenarioGrid scenarios={scenarios} onLaunch={onLaunchScenario} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    gap: 16
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 16
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 6
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "800"
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24
  },
  loadingInline: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    gap: 8
  },
  loadingText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700"
  },
  activeCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14
  },
  activeText: {
    flex: 1,
    minWidth: 0,
    gap: 4
  },
  activeLabel: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    textTransform: "uppercase"
  },
  activeTitle: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  }
});
