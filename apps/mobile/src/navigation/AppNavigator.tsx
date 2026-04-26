import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  hrDashboardData,
  scheduledReportRules
} from "../data/mockAcademyData";
import { academyMockService } from "../services/academyMockService";
import { useTheme } from "../theme/useTheme";
import type {
  AcademyUser,
  AdminSettings,
  HrDashboard,
  KnowledgeSection,
  ManagerDashboard,
  ReportCard,
  Scenario,
  StudentDashboard,
  UserRole
} from "../types/academy";
import { BottomTabs } from "../components/layout/BottomTabs";
import { MobileHeader } from "../components/layout/MobileHeader";
import { RoleSwitcher } from "../components/layout/RoleSwitcher";
import { AppScreen } from "../components/ui/AppScreen";
import {
  roleHomeRoute,
  routeConfig,
  tabsByRole,
  type RootStackParamList,
  type RouteName
} from "./routes";
import { StudentHomeScreen } from "../screens/student/StudentHomeScreen";
import { KnowledgeBaseScreen } from "../screens/knowledge/KnowledgeBaseScreen";
import { SimulatorScreen } from "../screens/simulator/SimulatorScreen";
import { ManagerDashboardScreen } from "../screens/manager/ManagerDashboardScreen";
import { HrDashboardScreen } from "../screens/hr/HrDashboardScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";

type RouteState = {
  name: RouteName;
  params?: RootStackParamList[RouteName];
};

export function AppNavigator() {
  const theme = useTheme();
  const [activeRole, setActiveRole] = useState<UserRole>("student");
  const [routeState, setRouteState] = useState<RouteState>({ name: "StudentHome" });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AcademyUser | null>(null);
  const [studentDashboard, setStudentDashboard] = useState<StudentDashboard | null>(null);
  const [knowledgeSections, setKnowledgeSections] = useState<KnowledgeSection[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [managerDashboard, setManagerDashboard] = useState<ManagerDashboard | null>(null);
  const [hrDashboard, setHrDashboard] = useState<HrDashboard | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [reports, setReports] = useState<ReportCard[]>([]);

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [
        studentData,
        knowledgeData,
        scenarioData,
        managerData,
        hrData,
        adminData,
        reportData
      ] = await Promise.all([
        academyMockService.getStudentDashboard(),
        academyMockService.getKnowledgeSections(),
        academyMockService.getScenarios(),
        academyMockService.getManagerDashboard(),
        academyMockService.getHrDashboard(),
        academyMockService.getAdminSettings(),
        academyMockService.getReports()
      ]);

      setStudentDashboard(studentData);
      setKnowledgeSections(knowledgeData);
      setScenarios(scenarioData);
      setManagerDashboard(managerData);
      setHrDashboard(hrData);
      setAdminSettings(adminData);
      setReports(reportData);
      setLoading(false);
    }

    loadData().catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    academyMockService.getCurrentUser(activeRole).then(setCurrentUser);
    setRouteState({ name: roleHomeRoute[activeRole] });
  }, [activeRole]);

  const footer = useMemo(
    () => (
      <BottomTabs
        routes={tabsByRole[activeRole]}
        activeRoute={routeState.name}
        onNavigate={(route) => setRouteState({ name: route })}
      />
    ),
    [activeRole, routeState.name]
  );

  if (loading || !currentUser || !studentDashboard || !managerDashboard || !hrDashboard || !adminSettings) {
    return (
      <AppScreen>
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.semantic.actionPrimary} />
          <Text style={[styles.loaderText, { color: theme.semantic.textSecondary }]}>
            Загружаем mobile mock-контур Академии продаж...
          </Text>
        </View>
      </AppScreen>
    );
  }

  const currentRouteConfig = routeConfig[routeState.name];
  const knowledgeParams =
    routeState.name === "KnowledgeBase"
      ? (routeState.params as RootStackParamList["KnowledgeBase"] | undefined)
      : undefined;
  const simulatorParams =
    routeState.name === "Simulator"
      ? (routeState.params as RootStackParamList["Simulator"] | undefined)
      : undefined;
  const reportParams =
    routeState.name === "Reports"
      ? (routeState.params as RootStackParamList["Reports"] | undefined)
      : undefined;

  return (
    <AppScreen footer={footer}>
      <MobileHeader title={currentRouteConfig.title} subtitle={currentRouteConfig.description} user={currentUser} />
      <RoleSwitcher activeRole={activeRole} onChangeRole={setActiveRole} />

      {routeState.name === "StudentHome" ? (
        <StudentHomeScreen
          dashboard={studentDashboard}
          onNavigate={(route, params) => setRouteState({ name: route, params })}
        />
      ) : null}

      {routeState.name === "KnowledgeBase" ? (
        <KnowledgeBaseScreen
          sections={knowledgeSections}
          initialCategoryId={knowledgeParams?.categoryId}
          initialMaterialId={knowledgeParams?.materialId}
          onNavigate={(route, params) => setRouteState({ name: route, params })}
        />
      ) : null}

      {routeState.name === "Simulator" ? (
        <SimulatorScreen
          scenarios={scenarios}
          activeScenarioId={simulatorParams?.scenarioId}
          activeMaterialId={simulatorParams?.materialId}
          onNavigate={(route, params) => setRouteState({ name: route, params })}
        />
      ) : null}

      {routeState.name === "ManagerDashboard" ? (
        <ManagerDashboardScreen
          dashboard={managerDashboard}
          onNavigate={(route, params) => setRouteState({ name: route, params })}
        />
      ) : null}

      {routeState.name === "HrDashboard" ? (
        <HrDashboardScreen
          dashboard={hrDashboardDataOverride(hrDashboard)}
          onNavigate={(route, params) => setRouteState({ name: route, params })}
        />
      ) : null}

      {routeState.name === "Admin" ? (
        <AdminScreen
          settings={adminSettings}
          onNavigate={(route, params) => setRouteState({ name: route, params })}
        />
      ) : null}

      {routeState.name === "Reports" ? (
        <ReportsScreen
          reports={reports}
          rules={adminSettings.reportRules.length > 0 ? adminSettings.reportRules : scheduledReportRules}
          highlightReportId={reportParams?.highlightReportId}
        />
      ) : null}
    </AppScreen>
  );
}

function hrDashboardDataOverride(dashboard: HrDashboard): HrDashboard {
  return dashboard.tracks.length > 0 ? dashboard : hrDashboardData;
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    minHeight: 420,
    alignItems: "center",
    justifyContent: "center",
    gap: 16
  },
  loaderText: {
    fontSize: 15,
    fontWeight: "600"
  }
});
