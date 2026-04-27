import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { roleLabels } from "../../navigation/routes";
import type { RootStackParamList, RouteName } from "../../navigation/routes";
import type {
  AccessRoleRule,
  AdminSettings,
  ScenarioAdminItem,
  UserAccessSetting
} from "../../types/academy";
import { AppBottomSheet } from "../../components/ui/AppBottomSheet";
import { AppButton } from "../../components/ui/AppButton";
import { AppCard } from "../../components/ui/AppCard";
import { MetricCard } from "../../components/ui/MetricCard";
import { StatusPill } from "../../components/ui/StatusPill";
import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";
import { useTheme } from "../../theme/useTheme";

interface AdminScreenProps {
  settings: AdminSettings;
  onNavigate: <T extends RouteName>(route: T, params?: RootStackParamList[T]) => void;
}

type AdminSheetState =
  | { kind: "role"; user: UserAccessSetting }
  | { kind: "permissions"; user: UserAccessSetting }
  | { kind: "material"; title: string; lines: string[] }
  | { kind: "scenario"; scenario: ScenarioAdminItem }
  | { kind: "reports"; title: string; lines: string[] }
  | null;

const nextRoleMap: Record<UserAccessSetting["role"], UserAccessSetting["role"]> = {
  student: "manager",
  manager: "hr",
  hr: "admin",
  admin: "student"
};

export function AdminScreen({ settings, onNavigate }: AdminScreenProps) {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.settings.map((item) => [item.id, item.enabled]))
  );
  const [userRoles, setUserRoles] = useState<Record<string, UserAccessSetting["role"]>>(
    Object.fromEntries(settings.userAccessSettings.map((item) => [item.id, item.role]))
  );
  const [sheetState, setSheetState] = useState<AdminSheetState>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const metricWidth = layout.isWide ? "23.5%" : layout.isDesktop ? "31.5%" : layout.isTablet ? "48%" : "100%";

  return (
    <>
      <View style={[styles.metricGrid, (layout.isTablet || layout.isDesktop) && styles.wrapGrid]}>
        {settings.metrics.map((metric) => (
          <View key={metric.id} style={{ width: metricWidth }}>
            <MetricCard metric={metric} />
          </View>
        ))}
      </View>

      <AppCard tone="mint">
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Системные действия</Text>
        <View style={styles.buttonRow}>
          <AppButton
            label="Настроить отправку отчетов"
            onPress={() =>
              setSheetState({
                kind: "reports",
                title: "Правила отправки отчетов",
                lines: settings.reportRules.map(
                  (rule) => `${rule.audience}: ${rule.title} · ${rule.frequencyLabel}`
                )
              })
            }
            tone="primary"
          />
          <AppButton
            label="Добавить материал"
            onPress={() =>
              setSheetState({
                kind: "material",
                title: "Добавить материал",
                lines: [
                  "Название: новый материал базы знаний",
                  "Категория: навыки продаж",
                  "Статус: черновик сохранен"
                ]
              })
            }
            tone="secondary"
          />
          <AppButton
            label="Добавить сценарий"
            onPress={() =>
              setSheetState({
                kind: "scenario",
                scenario: settings.scenarioItems[0]
              })
            }
            tone="ghost"
          />
        </View>
      </AppCard>

      {successMessage ? (
        <AppCard>
          <Text style={[styles.successText, { color: theme.semantic.success }]}>{successMessage}</Text>
        </AppCard>
      ) : null}

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Профили пользователей и уровни доступа</Text>
        {settings.userAccessSettings.map((user) => (
          <View key={user.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{user.userName}</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Роль: {roleLabels[userRoles[user.id]]} · Доступ: {user.accessScope}
            </Text>
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
              Отчеты: {user.reportAccessLabel}
            </Text>
            <View style={styles.buttonRow}>
              <AppButton
                label="Изменить роль"
                onPress={() => setSheetState({ kind: "role", user })}
                tone="secondary"
              />
              <AppButton
                label="Настроить доступ"
                onPress={() => setSheetState({ kind: "permissions", user })}
                tone="ghost"
              />
            </View>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Матрица ролей</Text>
        {settings.roleRules.map((rule: AccessRoleRule) => (
          <View key={rule.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>
              {roleLabels[rule.role]} · {rule.accessLevel}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {rule.permissions.join(" · ")}
            </Text>
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
              Форматы выгрузки: {rule.exportTargets.map((item) => item.toUpperCase()).join(", ")}
            </Text>
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>База знаний: import и статус</Text>
        {settings.knowledgeImports.map((item) => (
          <View key={item.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Материалов: {item.materialsCount}
            </Text>
            <StatusPill
              label={item.statusLabel}
              tone={item.statusLabel.includes("Синхро") ? "success" : "warning"}
            />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Сценарии и кейсы</Text>
        {settings.scenarioItems.map((scenario) => (
          <View key={scenario.id} style={styles.blockRow}>
            <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{scenario.title}</Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {scenario.difficulty} · {scenario.ownerLabel}
            </Text>
            <StatusPill
              label={scenario.statusLabel}
              tone={scenario.statusLabel === "Активен" ? "success" : "warning"}
            />
            <AppButton
              label="Добавить сценарий"
              onPress={() => setSheetState({ kind: "scenario", scenario })}
              tone="ghost"
            />
          </View>
        ))}
      </AppCard>

      <AppCard>
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Системные настройки</Text>
        {settings.settings.map((item) => {
          const enabled = enabledMap[item.id];

          return (
            <View key={item.id} style={styles.blockRow}>
              <Text style={[styles.label, { color: theme.semantic.textPrimary }]}>{item.title}</Text>
              <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>{item.description}</Text>
              <StatusPill label={enabled ? "Включено" : "Выключено"} tone={enabled ? "success" : "warning"} />
              <AppButton
                label={enabled ? "Отключить" : "Включить"}
                onPress={() => setEnabledMap((current) => ({ ...current, [item.id]: !current[item.id] }))}
                tone="secondary"
              />
            </View>
          );
        })}
        <AppButton
          label="Сохранить настройки"
          onPress={() => setSuccessMessage("Настройки сохранены. Правила доступа обновлены в текущем контуре.")}
          tone="primary"
          fullWidth
        />
      </AppCard>

      <AppBottomSheet
        visible={sheetState !== null}
        title={
          sheetState?.kind === "role"
            ? `Изменить роль: ${sheetState.user.userName}`
            : sheetState?.kind === "permissions"
              ? `Доступ: ${sheetState.user.userName}`
              : sheetState?.kind === "scenario"
                ? "Добавить сценарий"
                : sheetState?.title ?? ""
        }
        description={
          sheetState?.kind === "role"
            ? "Выберите следующую роль для пользователя."
            : sheetState?.kind === "permissions"
              ? "Настройка прав и области доступа."
              : sheetState?.kind === "scenario"
                ? "Создание или обновление сценария."
                : "Изменения фиксируются в текущем рабочем контуре."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "role" ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Текущая роль: {roleLabels[userRoles[sheetState.user.id]]}
            </Text>
            <AppButton
              label={`Переключить на ${roleLabels[nextRoleMap[userRoles[sheetState.user.id]]]}`}
              onPress={() => {
                const nextRole = nextRoleMap[userRoles[sheetState.user.id]];
                setUserRoles((current) => ({ ...current, [sheetState.user.id]: nextRole }));
                setSuccessMessage(`Роль пользователя ${sheetState.user.userName} изменена на ${roleLabels[nextRole]}.`);
                setSheetState(null);
              }}
              tone="primary"
              fullWidth
            />
          </>
        ) : null}

        {sheetState?.kind === "permissions" ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Область доступа: {sheetState.user.accessScope}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Отчеты: {sheetState.user.reportAccessLabel}
            </Text>
            <AppButton
              label="Сохранить права"
              onPress={() => {
                setSuccessMessage(`Права для ${sheetState.user.userName} обновлены.`);
                setSheetState(null);
              }}
              tone="primary"
              fullWidth
            />
          </>
        ) : null}

        {sheetState?.kind === "material" || sheetState?.kind === "reports" ? (
          <>
            {sheetState.lines.map((line) => (
              <Text key={line} style={[styles.listItem, { color: theme.semantic.textPrimary }]}>
                • {line}
              </Text>
            ))}
          </>
        ) : null}

        {sheetState?.kind === "scenario" ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Название: {sheetState.scenario.title}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Сложность: {sheetState.scenario.difficulty}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              Статус: {sheetState.scenario.statusLabel}
            </Text>
            <AppButton
              label="Сохранить сценарий"
              onPress={() => {
                setSuccessMessage(`Сценарий "${sheetState.scenario.title}" сохранен.`);
                setSheetState(null);
              }}
              tone="primary"
              fullWidth
            />
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  metricGrid: {
    gap: 12
  },
  wrapGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12
  },
  title: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800"
  },
  label: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700"
  },
  body: {
    fontSize: 15,
    lineHeight: 22
  },
  meta: {
    fontSize: 12,
    fontWeight: "600"
  },
  listItem: {
    fontSize: 14,
    lineHeight: 20
  },
  buttonRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
  },
  blockRow: {
    gap: 8
  },
  successText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700"
  }
});
