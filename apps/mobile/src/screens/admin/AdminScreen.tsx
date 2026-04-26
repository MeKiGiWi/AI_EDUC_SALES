import React, { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

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
import { SectionHeader } from "../../components/ui/SectionHeader";
import { StatusPill } from "../../components/ui/StatusPill";
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
  const [enabledMap, setEnabledMap] = useState<Record<string, boolean>>(
    Object.fromEntries(settings.settings.map((item) => [item.id, item.enabled]))
  );
  const [userRoles, setUserRoles] = useState<Record<string, UserAccessSetting["role"]>>(
    Object.fromEntries(settings.userAccessSettings.map((item) => [item.id, item.role]))
  );
  const [sheetState, setSheetState] = useState<AdminSheetState>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <>
      <SectionHeader
        eyebrow="Администрирование"
        title="Пользователи, роли и системные правила"
        description="Mobile-first админка для управления ролями, доступами, знаниями, сценариями и отправкой отчетов без backend-интеграции."
      />

      <View style={styles.metricGrid}>
        {settings.metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </View>

      <AppCard tone="mint">
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Системные действия MVP</Text>
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
                  "Статус: mock draft сохранен"
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
              Роль: {userRoles[user.id]} · Доступ: {user.accessScope}
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
              {rule.role} · {rule.accessLevel}
            </Text>
            <Text style={[styles.body, { color: theme.semantic.textSecondary }]}>
              {rule.permissions.join(" · ")}
            </Text>
            <Text style={[styles.meta, { color: theme.semantic.textMuted }]}>
              Export: {rule.exportTargets.map((item) => item.toUpperCase()).join(", ")}
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
        <Text style={[styles.title, { color: theme.semantic.textPrimary }]}>Системные настройки MVP</Text>
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
          onPress={() => setSuccessMessage("Mock настройки сохранены. Позже это подключится к admin access settings API.")}
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
            ? "Mock select роли для пользователя."
            : sheetState?.kind === "permissions"
              ? "Настройка прав и scope доступа."
              : sheetState?.kind === "scenario"
                ? "Mock form создания или обновления сценария."
                : "Форма работает локально и пока не сохраняется в backend."
        }
        onClose={() => setSheetState(null)}
      >
        {sheetState?.kind === "role" ? (
          <>
            <Text style={[styles.body, { color: theme.semantic.textPrimary }]}>
              Текущая роль: {userRoles[sheetState.user.id]}
            </Text>
            <AppButton
              label={`Переключить на ${nextRoleMap[userRoles[sheetState.user.id]]}`}
              onPress={() => {
                const nextRole = nextRoleMap[userRoles[sheetState.user.id]];
                setUserRoles((current) => ({ ...current, [sheetState.user.id]: nextRole }));
                setSuccessMessage(`Роль пользователя ${sheetState.user.userName} изменена на ${nextRole}.`);
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
              Scope: {sheetState.user.accessScope}
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
              label="Сохранить mock сценарий"
              onPress={() => {
                setSuccessMessage(`Сценарий "${sheetState.scenario.title}" сохранен как mock update.`);
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
