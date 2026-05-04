import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import { BottomTabs } from "../components/layout/BottomTabs";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { AppScreen } from "../components/ui/AppScreen";
import { roleWorkspaceOptions } from "../data/academyData";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { LandingScreen } from "../screens/landing/LandingScreen";
import { ReportViewerScreen } from "../screens/reports/ReportViewerScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { ScenariosScreen } from "../screens/scenarios/ScenariosScreen";
import { SimulatorScreen } from "../screens/simulator/SimulatorScreen";
import { academyDataService } from "../services/academyDataService";
import { useTheme } from "../theme/useTheme";
import type {
  AcademyUser,
  ReportCard,
  SimulatorEvaluationPayloadDto,
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
  const [routeState, setRouteState] = useState<RouteState>({ name: "Simulator" });
  const [currentUser, setCurrentUser] = useState<AcademyUser | null>(null);
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeScenarioId, setActiveScenarioId] = useState<string | undefined>();

  useEffect(() => {
    async function loadWorkspace() {
      setLoading(true);
      const [user, reportData] = await Promise.all([
        academyDataService.getCurrentUser(activeRole),
        academyDataService.getReports(activeRole)
      ]);
      setCurrentUser(user);
      setReports(reportData);
      setLoading(false);
    }

    loadWorkspace().catch(() => setLoading(false));
  }, [activeRole]);

  function navigate<T extends RouteName>(route: T, params?: RootStackParamList[T]) {
    if (!isRouteAllowedForRole(route, activeRole)) {
      setRouteState({ name: roleHomeRoute[activeRole] });
      return;
    }

    setRouteState({ name: route, params });
  }

  function goToLanding() {
    setRouteState({ name: "Landing" });
  }

  function enterWorkspace(role: UserRole) {
    setActiveRole(role);
    setRouteState({ name: roleHomeRoute[role] });
  }

  function launchScenario(scenarioId: string) {
    setActiveScenarioId(scenarioId);
    navigate("Simulator", { scenarioId });
  }

  function continueChat(scenarioId?: string) {
    if (scenarioId) {
      launchScenario(scenarioId);
      return;
    }

    navigate("Simulator");
  }

  function openReport(reportId?: string) {
    if (reportId) {
      navigate("ReportViewer", { reportId });
      return;
    }

    navigate("Reports");
  }

  async function handleSimulatorReportSaved(payload: {
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
  }): Promise<ReportCard[]> {
    const allReports = await academyDataService.saveLatestSimulatorReport({
      role: activeRole,
      scenarioTitle: payload.scenarioTitle,
      evaluation: payload.evaluation
    });
    setReports(allReports);
    return allReports;
  }

  const visibleRoutes = useMemo(() => visibleRoutesForRole(activeRole), [activeRole]);
  const navActiveRoute = routeState.name === "ReportViewer" ? "Reports" : routeState.name;
  const footer = useMemo(
    () =>
      layout.isDesktop || routeState.name === "Landing" ? null : (
        <BottomTabs
          routes={visibleRoutes}
          activeRoute={navActiveRoute}
          onNavigate={(route) => navigate(route)}
        />
      ),
    [layout.isDesktop, navActiveRoute, routeState.name, visibleRoutes]
  );

  if (loading || !currentUser) {
    return (
      <AppScreen variant="app">
        <View style={styles.loader}>
          <ActivityIndicator size="large" color={theme.semantic.actionPrimary} />
          <Text style={[styles.loaderText, { color: theme.semantic.textSecondary }]}>
            Загружаем рабочее пространство...
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
  const reportViewerParams =
    routeState.name === "ReportViewer"
      ? (routeState.params as RootStackParamList["ReportViewer"] | undefined)
      : undefined;
  const openedReport = reports.find((report) => report.id === reportViewerParams?.reportId);
  const isLanding = routeState.name === "Landing";
  const showMobileHeader = !layout.isDesktop && routeState.name !== "Simulator" && !isLanding;

  return (
    <AppScreen
      footer={footer ?? undefined}
      variant={isLanding ? "landing" : "app"}
      disableBottomPadding={isLanding && layout.isDesktop}
      sidebar={
        layout.isDesktop && !isLanding ? (
          <DesktopSidebar
            activeRole={activeRole}
            activeRoute={navActiveRoute}
            user={currentUser}
            routes={visibleRoutes}
            onNavigate={navigate}
            onGoToLanding={goToLanding}
          />
        ) : undefined
      }
    >
      {isLanding ? (
        <LandingScreen roleOptions={roleWorkspaceOptions} onEnterRole={enterWorkspace} />
      ) : null}

      {showMobileHeader ? (
        <MobileHeader
          title={currentRouteConfig.title}
          subtitle={currentRouteConfig.description}
          user={currentUser}
        />
      ) : null}

      {routeState.name === "Simulator" ? (
        <SimulatorScreen
          activeScenarioId={simulatorParams?.scenarioId ?? activeScenarioId}
          onOpenReport={openReport}
          onReportSaved={handleSimulatorReportSaved}
        />
      ) : null}

      {routeState.name === "Scenarios" ? (
        <ScenariosScreen
          activeScenarioId={activeScenarioId}
          onLaunchScenario={launchScenario}
        />
      ) : null}

      {routeState.name === "Reports" ? (
        <ReportsScreen
          activeRole={activeRole}
          reports={reports}
          highlightReportId={reportParams?.highlightReportId}
          onOpenReport={(reportId) => openReport(reportId)}
          onContinueChat={continueChat}
        />
      ) : null}

      {routeState.name === "ReportViewer" ? (
        <ReportViewerScreen
          report={openedReport}
          onBack={() => navigate("Reports")}
          onContinueChat={continueChat}
        />
      ) : null}
    </AppScreen>
  );
}

function visibleRoutesForRole(role: UserRole): RouteName[] {
  return tabsByRole[role];
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
