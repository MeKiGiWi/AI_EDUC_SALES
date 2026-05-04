import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { hrDashboardData, roleWorkspaceOptions } from "../data/academyData";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { BottomTabs } from "../components/layout/BottomTabs";
import { AppScreen } from "../components/ui/AppScreen";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { LandingScreen } from "../screens/landing/LandingScreen";
import { StudentHomeScreen } from "../screens/student/StudentHomeScreen";
import { SimulatorScreen } from "../screens/simulator/SimulatorScreen";
import { ManagerDashboardScreen } from "../screens/manager/ManagerDashboardScreen";
import { HrDashboardScreen } from "../screens/hr/HrDashboardScreen";
import { AdminScreen } from "../screens/admin/AdminScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { academyDataService } from "../services/academyDataService";
import { useTheme } from "../theme/useTheme";
import type {
  AcademyUser,
  AdminSettings,
  HrDashboard,
  KnowledgeSection,
  KnowledgeMaterial,
  LearningModule,
  ManagerDashboard,
  ReportCard,
  Scenario,
  SimulatorEvaluationPayloadDto,
  StudentDashboard,
  UserRole
} from "../types/academy";
import {
  isRouteAllowedForRole,
  roleHomeRoute,
  routeConfig,
  tabsByRole,
  type RootStackParamList,
  type RouteName
} from "./routes";

type RouteState = {
  name: RouteName;
  params?: RootStackParamList[RouteName];
};

export function AppNavigator() {
  const theme = useTheme();
  const layout = useResponsiveLayout();
  const [activeRole, setActiveRole] = useState<UserRole>("student");
  const [routeState, setRouteState] = useState<RouteState>({ name: "Landing" });
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<AcademyUser | null>(null);
  const [studentDashboard, setStudentDashboard] = useState<StudentDashboard | null>(null);
  const [knowledgeSections, setKnowledgeSections] = useState<KnowledgeSection[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [learningModules, setLearningModules] = useState<LearningModule[]>([]);
  const [managerDashboard, setManagerDashboard] = useState<ManagerDashboard | null>(null);
  const [hrDashboard, setHrDashboard] = useState<HrDashboard | null>(null);
  const [adminSettings, setAdminSettings] = useState<AdminSettings | null>(null);
  const [reports, setReports] = useState<ReportCard[]>([]);

  async function loadReportsForRole(role: UserRole) {
    const reportData = await academyDataService.getReports(role);
    setReports(reportData);
  }

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const [
        studentData,
        knowledgeData,
        scenarioData,
        managerData,
        hrData,
        adminData
      ] = await Promise.all([
        academyDataService.getStudentDashboard(),
        academyDataService.getKnowledgeSections(),
        academyDataService.getScenarios(),
        academyDataService.getManagerDashboard(),
        academyDataService.getHrDashboard(),
        academyDataService.getAdminSettings()
      ]);

      setStudentDashboard(studentData);
      setLearningModules(studentData.modules);
      setKnowledgeSections(knowledgeData);
      setScenarios(scenarioData);
      setManagerDashboard(managerData);
      setHrDashboard(hrData);
      setAdminSettings(adminData);
      await loadReportsForRole(activeRole);
      setLoading(false);
    }

    loadData().catch(() => setLoading(false));
  }, [activeRole]);

  useEffect(() => {
    if (routeState.name !== "Reports") {
      return;
    }

    loadReportsForRole(activeRole).catch((error) => {
      console.warn("[reports] refresh on Reports route failed", error);
    });
  }, [activeRole, routeState.name]);

  useEffect(() => {
    academyDataService.getCurrentUser(activeRole).then(setCurrentUser);
  }, [activeRole]);

  function goToLanding() {
    setRouteState({ name: "Landing" });
  }

  function enterWorkspace(role: UserRole) {
    setActiveRole(role);
    setRouteState({ name: roleHomeRoute[role] });
  }

  function navigate<T extends RouteName>(route: T, params?: RootStackParamList[T]) {
    if (route === "Landing") {
      goToLanding();
      return;
    }

    if (!isRouteAllowedForRole(route, activeRole)) {
      setRouteState({ name: roleHomeRoute[activeRole] });
      return;
    }

    setRouteState({ name: route, params });
  }

  async function handleSimulatorReportSaved(payload: {
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
    sessionId?: string | null;
  }) {
    const allReports = await academyDataService.saveLatestSimulatorReport({
      role: activeRole,
      scenarioTitle: payload.scenarioTitle,
      evaluation: payload.evaluation,
      sessionId: payload.sessionId
    });
    setReports(allReports);
  }

  const footer = useMemo(
    () =>
      routeState.name === "Landing" || layout.isDesktop ? null : (
        <BottomTabs
          routes={tabsByRole[activeRole]}
          activeRoute={routeState.name}
          onNavigate={(route) => navigate(route)}
        />
      ),
    [activeRole, layout.isDesktop, routeState.name]
  );
  const knowledgeMaterials: KnowledgeMaterial[] = knowledgeSections.flatMap((section) => section.materials);

  if (loading || !currentUser || !studentDashboard || !managerDashboard || !hrDashboard || !adminSettings) {
    return (
      <AppScreen variant="app">
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.semantic.actionPrimary} />
          <Text style={[styles.loaderText, { color: theme.semantic.textSecondary }]}>
            Загружаем рабочее пространство Академии продаж...
          </Text>
        </View>
      </AppScreen>
    );
  }

  const currentRouteConfig = routeConfig[routeState.name];
  const simulatorParams =
    routeState.name === "Simulator"
      ? (routeState.params as RootStackParamList["Simulator"] | undefined)
      : undefined;
  const reportParams =
    routeState.name === "Reports"
      ? (routeState.params as RootStackParamList["Reports"] | undefined)
      : undefined;
  const isLanding = routeState.name === "Landing";

  if (isLanding) {
    return <LandingScreen roleOptions={roleWorkspaceOptions} onEnterRole={enterWorkspace} />;
  }

  return (
    <AppScreen
      footer={footer ?? undefined}
      variant="app"
      disableBottomPadding={false}
      sidebar={
        <DesktopSidebar
          activeRole={activeRole}
          activeRoute={routeState.name}
          user={currentUser}
          routes={tabsByRole[activeRole]}
          onNavigate={navigate}
          onGoToLanding={goToLanding}
        />
      }
    >
      <MobileHeader
        title={currentRouteConfig.title}
        subtitle={currentRouteConfig.description}
        user={currentUser}
        actionLabel="На лендинг"
        onActionPress={goToLanding}
      />

      {routeState.name === "StudentHome" ? (
        <StudentHomeScreen dashboard={studentDashboard} materials={knowledgeMaterials} onNavigate={navigate} />
      ) : null}

      {routeState.name === "Simulator" ? (
        <SimulatorScreen
          scenarios={scenarios}
          modules={learningModules}
          activeScenarioId={simulatorParams?.scenarioId}
          onOpenReports={() => navigate("Reports")}
          onReportSaved={handleSimulatorReportSaved}
          onNavigateToReports={() => navigate("Reports")}
        />
      ) : null}

      {routeState.name === "ManagerDashboard" ? (
        <ManagerDashboardScreen dashboard={managerDashboard} onNavigate={navigate} />
      ) : null}

      {routeState.name === "HrDashboard" ? (
        <HrDashboardScreen dashboard={hrDashboardDataOverride(hrDashboard)} onNavigate={navigate} />
      ) : null}

      {routeState.name === "Admin" ? (
        <AdminScreen settings={adminSettings} onNavigate={navigate} />
      ) : null}

      {routeState.name === "Reports" ? (
        <ReportsScreen
          activeRole={activeRole}
          reports={reports}
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
