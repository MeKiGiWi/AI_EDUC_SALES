import React, { useMemo, useState } from "react";

import { BottomTabs } from "../components/layout/BottomTabs";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { AppScreen } from "../components/ui/AppScreen";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { salesAcademyMock } from "../data/salesAcademyMock";
import { SimulatorScreen } from "../screens/simulator/SimulatorScreen";
import { StudentHomeScreen } from "../screens/student/StudentHomeScreen";
import { useTheme } from "../theme/useTheme";
import type { UserRole } from "../types/academy";
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
  const layout = useResponsiveLayout();
  useTheme();
  const [activeRole, setActiveRole] = useState<UserRole>("student");
  const [routeState, setRouteState] = useState<RouteState>({ name: "StudentHome" });
  const [activeScenarioId, setActiveScenarioId] = useState<string>(
    salesAcademyMock.activeDialogue.selectedScenarioId
  );
  const [trainerMode, setTrainerMode] = useState<"catalog" | "dialogue">("catalog");

  function navigate<T extends RouteName>(route: T, params?: RootStackParamList[T]) {
    if (!isRouteAllowedForRole(route, activeRole)) {
      setRouteState({ name: roleHomeRoute[activeRole] });
      return;
    }

    setRouteState({ name: route, params });
  }

  function launchScenario(scenarioId: string) {
    setActiveScenarioId(scenarioId);
    setTrainerMode("dialogue");
    navigate("Simulator", { scenarioId });
  }
  function openTrainerCatalog() {
    setTrainerMode("catalog");
    navigate("Simulator");
  }
  function completeScenario() {
    setTrainerMode("catalog");
    navigate("StudentHome");
  }

  const visibleRoutes = useMemo(() => visibleRoutesForRole(activeRole), [activeRole]);
  const navActiveRoute = routeState.name;
  const footer = useMemo(
    () =>
      layout.isDesktop ? null : (
        <BottomTabs
          routes={visibleRoutes}
          activeRoute={navActiveRoute}
          onNavigate={(route) => navigate(route)}
        />
      ),
    [layout.isDesktop, navActiveRoute, visibleRoutes]
  );
  const currentRouteConfig = routeConfig[routeState.name];
  const simulatorParams =
    routeState.name === "Simulator"
      ? (routeState.params as RootStackParamList["Simulator"] | undefined)
      : undefined;
  const showMobileHeader = !layout.isDesktop && routeState.name !== "Simulator";
  const disableAppScroll = routeState.name === "Simulator" && trainerMode === "dialogue";

  return (
    <AppScreen
      footer={footer ?? undefined}
      variant="app"
      scrollEnabled={!disableAppScroll}
      sidebar={
        layout.isDesktop ? (
          <DesktopSidebar
            activeRole={activeRole}
            activeRoute={navActiveRoute}
            user={salesAcademyMock.user}
            routes={visibleRoutes}
            onNavigate={navigate}
          />
        ) : undefined
      }
    >
      {showMobileHeader ? (
        <MobileHeader
          title={currentRouteConfig.title}
          subtitle={currentRouteConfig.description}
          user={salesAcademyMock.user}
        />
      ) : null}

      {routeState.name === "StudentHome" ? (
        <StudentHomeScreen
          data={salesAcademyMock}
          onNavigate={navigate}
          onOpenTrainer={(scenarioId) => launchScenario(scenarioId)}
        />
      ) : null}

      {routeState.name === "Simulator" ? (
        <SimulatorScreen
          data={salesAcademyMock}
          activeScenarioId={simulatorParams?.scenarioId ?? activeScenarioId}
          mode={trainerMode}
          onBackToCatalog={openTrainerCatalog}
          onStartScenario={launchScenario}
          onFinishScenario={completeScenario}
        />
      ) : null}
    </AppScreen>
  );
}

function visibleRoutesForRole(role: UserRole): RouteName[] {
  return tabsByRole[role];
}
