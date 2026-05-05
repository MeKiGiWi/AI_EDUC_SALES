import React, { useEffect, useMemo, useRef, useState } from "react";

import { BottomTabs } from "../components/layout/BottomTabs";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { AppCard } from "../components/ui/AppCard";
import { AppScreen } from "../components/ui/AppScreen";
import { roleWorkspaceOptions, simulatorEvaluationByScenarioId } from "../data/academyData";
import { DEFAULT_BACKEND_DIFFICULTY } from "../data/simulatorMvpData";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { LandingScreen } from "../screens/landing/LandingScreen";
import { ReportsScreen } from "../screens/reports/ReportsScreen";
import { ReportViewerScreen } from "../screens/reports/ReportViewerScreen";
import { SimulatorScreen } from "../screens/simulator/SimulatorScreen";
import { StudentHomeScreen } from "../screens/student/StudentHomeScreen";
import { academyDataService } from "../services/academyDataService";
import {
  buildInitialMockDialogue,
  buildMockCustomerFollowUp,
  buildOptimisticManagerMessage,
  countManagerReplies,
  mapApiMessageToDialogueMessage,
  mergeApiMessages
} from "../services/simulatorDialogueService";
import {
  getSafeSimulatorErrorMessage,
  simulatorApiService
} from "../services/simulatorApiService";
import { useTheme } from "../theme/useTheme";
import type {
  ActiveDialogueSession,
  DialogueMessage,
  ReportCard,
  SalesAcademyMock,
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

const MOCK_REPLY_DELAY_MS = 220;

export function AppNavigator() {
  const layout = useResponsiveLayout();
  useTheme();
  const activeRole: UserRole = "student";
  const [routeState, setRouteState] = useState<RouteState>({ name: "Landing" });
  const [workspaceData, setWorkspaceData] = useState<SalesAcademyMock | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("");
  const [trainerMode, setTrainerMode] = useState<"catalog" | "dialogue">("catalog");
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [simulatorStartError, setSimulatorStartError] = useState<string | null>(null);
  const [activeDialogueSession, setActiveDialogueSession] = useState<ActiveDialogueSession | null>(
    null
  );
  const activeSessionKeyRef = useRef<string>("");

  useEffect(() => {
    let isMounted = true;

    void academyDataService
      .getWorkspaceData(activeRole)
      .then((data) => {
        if (!isMounted) {
          return;
        }

        setWorkspaceData(data);
        setActiveScenarioId(data.activeDialogue.selectedScenarioId);
      })
      .catch(() => {
        if (isMounted) {
          setWorkspaceData(null);
        }
      });

    void academyDataService
      .getReports(activeRole)
      .then((items) => {
        if (isMounted) {
          setReports(items);
        }
      })
      .catch(() => {
        if (isMounted) {
          setReports([]);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [activeRole]);

  function navigate<T extends RouteName>(route: T, params?: RootStackParamList[T]) {
    if (route === "Landing") {
      setRouteState({ name: "Landing" });
      return;
    }

    if (!isRouteAllowedForRole(route, activeRole)) {
      setRouteState({ name: roleHomeRoute[activeRole] });
      return;
    }

    setRouteState({ name: route, params });
  }

  function enterWorkspace(_role: UserRole) {
    setRouteState({ name: roleHomeRoute[activeRole] });
  }

  function updateSession(updater: (current: ActiveDialogueSession) => ActiveDialogueSession) {
    setActiveDialogueSession((current) => (current ? updater(current) : current));
  }

  async function launchScenario(scenarioId: string) {
    setSimulatorStartError(null);
    const selectedScenario = workspaceData?.scenarios.find((scenario) => scenario.id === scenarioId);

    if (!selectedScenario) {
      setSimulatorStartError("Выбранный сценарий не найден.");
      setTrainerMode("catalog");
      navigate("Simulator");
      return;
    }

    try {
      let nextSession: ActiveDialogueSession;

      if (simulatorApiService.isEnabled()) {
        const response = await simulatorApiService.startDialogueSession(
          scenarioId,
          DEFAULT_BACKEND_DIFFICULTY
        );
        nextSession = {
          mode: "api",
          sessionId: response.session_id,
          scenarioId,
          scenarioTitle: selectedScenario.title,
          messages: [mapApiMessageToDialogueMessage(response.message)],
          status: "active",
          errorText: null,
          isSending: false,
          isFinishing: false
        };
      } else {
        nextSession = {
          mode: "mock",
          sessionId: buildSessionId(scenarioId),
          scenarioId,
          scenarioTitle: selectedScenario.title,
          messages: buildInitialMockDialogue({
            scenarioId,
            scenarioTitle: selectedScenario.title
          }),
          status: "active",
          errorText: null,
          isSending: false,
          isFinishing: false
        };
      }

      activeSessionKeyRef.current = nextSession.sessionId;
      setActiveDialogueSession(nextSession);
      setActiveScenarioId(scenarioId);
      setTrainerMode("dialogue");
      navigate("Simulator", { scenarioId });
    } catch (error) {
      setActiveDialogueSession(null);
      setTrainerMode("catalog");
      setRouteState({ name: "Simulator" });
      setSimulatorStartError(getSafeSimulatorErrorMessage(error));
    }
  }

  function openTrainerCatalog() {
    setTrainerMode("catalog");
    setSimulatorStartError(null);
    navigate("Simulator");
  }

  function openReportViewer(reportId: string) {
    navigate("ReportViewer", { reportId });
  }

  function openReports(highlightReportId?: string) {
    navigate("Reports", highlightReportId ? { highlightReportId } : undefined);
  }

  function continueChatFromReport(scenarioId?: string) {
    if (scenarioId) {
      void launchScenario(scenarioId);
      return;
    }

    openTrainerCatalog();
  }

  async function sendMessage(text: string): Promise<boolean> {
    const session = activeDialogueSession;
    const selectedScenario = workspaceData?.scenarios.find(
      (scenario) => scenario.id === session?.scenarioId
    );
    const trimmedText = text.trim();

    if (!session || !selectedScenario) {
      return false;
    }

    if (!trimmedText) {
      updateSession((current) => ({
        ...current,
        errorText: "Введите реплику, чтобы продолжить диалог."
      }));
      return false;
    }

    if (session.isSending || session.isFinishing || session.status === "finished") {
      return false;
    }

    const optimisticMessage = buildOptimisticManagerMessage(trimmedText);
    const sessionKey = session.sessionId;

    updateSession((current) => ({
      ...current,
      messages: [...current.messages, optimisticMessage],
      errorText: null,
      isSending: true
    }));

    if (session.mode === "api") {
      try {
        const response = await simulatorApiService.sendDialogueMessage(session.sessionId, trimmedText);
        if (activeSessionKeyRef.current !== sessionKey) {
          return false;
        }

        setActiveDialogueSession((current) => {
          if (!current || current.sessionId !== sessionKey) {
            return current;
          }

          return {
            ...current,
            messages: mergeApiMessages(current.messages, response.messages, optimisticMessage.id),
            status: response.status,
            isSending: false,
            errorText: response.status === "finished" ? "Сессия завершена." : null
          };
        });
        return true;
      } catch (error) {
        if (activeSessionKeyRef.current !== sessionKey) {
          return false;
        }

        updateSession((current) => ({
          ...current,
          messages: current.messages.filter((message) => message.id !== optimisticMessage.id),
          isSending: false,
          errorText: getSafeSimulatorErrorMessage(error)
        }));
        return false;
      }
    }

    await new Promise((resolve) => setTimeout(resolve, MOCK_REPLY_DELAY_MS));
    if (activeSessionKeyRef.current !== sessionKey) {
      return false;
    }

    updateSession((current) => {
      const customerReply: DialogueMessage = {
        id: `mock-customer-${Date.now()}`,
        author: "customer",
        text: buildMockCustomerFollowUp(
          selectedScenario,
          trimmedText,
          countManagerReplies(current.messages)
        ),
        time: optimisticMessage.time
      };

      return {
        ...current,
        messages: [...current.messages, customerReply],
        isSending: false,
        errorText: null
      };
    });
    return true;
  }

  async function finishScenarioAndOpenReport(params: {
    scenarioId: string;
    scenarioTitle: string;
  }) {
    const session = activeDialogueSession;
    if (!session) {
      return;
    }

    const existingReport = reports.find((report) => report.sessionId === session.sessionId);
    if (existingReport) {
      openReportViewer(existingReport.id);
      return;
    }

    if (countManagerReplies(session.messages) < 1) {
      updateSession((current) => ({
        ...current,
        errorText: "Напишите хотя бы одну реплику перед отчетом."
      }));
      return;
    }

    updateSession((current) => ({ ...current, isFinishing: true, errorText: null }));

    try {
      let evaluation: SimulatorEvaluationPayloadDto | undefined;

      if (session.mode === "api") {
        const response = await simulatorApiService.finishDialogueSession(session.sessionId);
        evaluation = response.evaluation;

        if (!evaluation) {
          updateSession((current) => ({
            ...current,
            isFinishing: false,
            errorText: "Не удалось получить оценку от backend. Попробуйте завершить сессию еще раз."
          }));
          return;
        }
      } else {
        evaluation = buildMockEvaluation(params.scenarioTitle, params.scenarioId);
      }

      const syncedReports = await academyDataService.saveLatestSimulatorReport({
        role: activeRole,
        scenarioId: params.scenarioId,
        scenarioTitle: params.scenarioTitle,
        sessionId: session.sessionId,
        evaluation
      });
      setReports(syncedReports);

      setActiveDialogueSession((current) =>
        current && current.sessionId === session.sessionId
          ? { ...current, status: "finished", isFinishing: false, errorText: null }
          : current
      );

      const createdReport =
        syncedReports.find((report) => report.sessionId === session.sessionId) ?? syncedReports[0];

      if (createdReport) {
        openReportViewer(createdReport.id);
        return;
      }

      openReports();
    } catch (error) {
      updateSession((current) => ({
        ...current,
        isFinishing: false,
        errorText: getSafeSimulatorErrorMessage(error)
      }));
    }
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
  const currentRouteConfig = routeConfig[routeState.name];
  const simulatorParams =
    routeState.name === "Simulator"
      ? (routeState.params as RootStackParamList["Simulator"] | undefined)
      : undefined;
  const reportsParams =
    routeState.name === "Reports"
      ? (routeState.params as RootStackParamList["Reports"] | undefined)
      : undefined;
  const reportViewerParams =
    routeState.name === "ReportViewer"
      ? (routeState.params as RootStackParamList["ReportViewer"])
      : undefined;
  const selectedReport = reportViewerParams
    ? reports.find((report) => report.id === reportViewerParams.reportId)
    : undefined;
  const isLanding = routeState.name === "Landing";
  const showMobileHeader =
    !layout.isDesktop && routeState.name !== "Simulator" && routeState.name !== "Landing";
  const disableAppScroll =
    routeState.name === "Simulator" && trainerMode === "dialogue" && layout.isDesktop;

  if (!workspaceData) {
    return (
      <AppScreen variant="app">
        <AppCard>Загрузка рабочего пространства...</AppCard>
      </AppScreen>
    );
  }

  if (isLanding) {
    return <LandingScreen roleOptions={roleWorkspaceOptions} onEnterRole={enterWorkspace} />;
  }

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
            user={workspaceData.user}
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
          user={workspaceData.user}
        />
      ) : null}

      {routeState.name === "StudentHome" ? (
        <StudentHomeScreen
          data={workspaceData}
          reports={reports}
          onOpenReport={openReportViewer}
          onOpenTrainer={(scenarioId) => {
            void launchScenario(scenarioId);
          }}
        />
      ) : null}

      {routeState.name === "Simulator" ? (
        <SimulatorScreen
          data={workspaceData}
          activeScenarioId={simulatorParams?.scenarioId ?? activeScenarioId}
          activeSession={activeDialogueSession}
          mode={trainerMode}
          onBackToCatalog={openTrainerCatalog}
          onStartScenario={(scenarioId) => {
            void launchScenario(scenarioId);
          }}
          onSendMessage={sendMessage}
          onFinishScenario={finishScenarioAndOpenReport}
          startErrorText={simulatorStartError}
          onDismissStartError={() => setSimulatorStartError(null)}
        />
      ) : null}

      {routeState.name === "Reports" ? (
        <ReportsScreen
          activeRole={activeRole}
          reports={reports}
          highlightReportId={reportsParams?.highlightReportId}
          onOpenReport={openReportViewer}
          onContinueChat={continueChatFromReport}
        />
      ) : null}

      {routeState.name === "ReportViewer" ? (
        <ReportViewerScreen
          report={selectedReport}
          onBack={() => openReports()}
          onContinueChat={continueChatFromReport}
        />
      ) : null}
    </AppScreen>
  );
}

function visibleRoutesForRole(role: UserRole): RouteName[] {
  return tabsByRole[role];
}

function buildSessionId(scenarioId: string): string {
  return `session-${scenarioId}-${Date.now()}`;
}

function buildMockEvaluation(
  scenarioTitle: string,
  scenarioId: string
): SimulatorEvaluationPayloadDto {
  const scenarioPresets: Record<string, SimulatorEvaluationPayloadDto> = {
    "price-objection": {
      overall_level: "Middle",
      overall_comment:
        "Вы спокойно отработали ценовое возражение и связали решение с бизнес-эффектом, но можно точнее зафиксировать следующий шаг.",
      overall_recommendations: [
        "Сначала уточняйте, с чем клиент сравнивает цену.",
        "Заканчивайте разговор конкретным шагом с датой и участниками.",
        "Подчеркивайте стоимость простоя раньше, чем переходите к аргументам."
      ],
      competencies: [
        {
          name: "Умение задавать вопросы",
          level: "Middle",
          argument: "Есть вопросы, которые помогают раскрыть контекст сравнения и критерии выбора.",
          quote: ["Какие факторы для вас наиболее критичны при выборе поставщика?"],
          recommendations: ["Добавьте вопрос про последствия ошибки выбора."]
        },
        {
          name: "Диагностика потребности",
          level: "Middle",
          argument: "Хорошо проявлена попытка понять бюджетные ограничения клиента.",
          quote: ["Нам важно уложиться в бюджет этого квартала."],
          recommendations: ["Сильнее уточняйте источник внутреннего давления по бюджету."]
        },
        {
          name: "Формулировка ценности через выгоду",
          level: "Middle",
          argument: "Ценность уже связана с риском простоя и стоимостью владения.",
          quote: [
            "Наши клиенты в среднем экономят до 18% за счёт меньшего простоя оборудования."
          ],
          recommendations: ["Подкрепляйте выгоду одной цифрой под ситуацию клиента."]
        },
        {
          name: "Работа с возражением «подумаю / не сейчас»",
          level: "Middle",
          argument: "Возражение обработано без давления и с сохранением доверия.",
          quote: ["Понимаю ваше опасение."],
          recommendations: [
            "После признания сомнения задавайте один уточняющий вопрос до аргументации."
          ]
        },
        {
          name: "Фиксация следующего шага",
          level: "Junior",
          argument:
            "Следующий шаг пока читается скорее как намерение, чем как договоренность.",
          quote: ["Могу показать расчёт по вашим данным, если интересно."],
          recommendations: ["Предлагайте конкретный созвон или аудит с датой."]
        }
      ]
    }
  };

  const evaluation = scenarioPresets[scenarioId];
  if (evaluation) {
    return evaluation;
  }

  const fallback = simulatorEvaluationByScenarioId["scn-1"];
  if (fallback) {
    return {
      overall_level: "Middle",
      overall_comment: `${scenarioTitle}: диалог завершен уверенно, но следующий шаг можно сделать конкретнее.`,
      overall_recommendations: fallback.recommendations,
      competencies: fallback.competencyScores.slice(0, 5).map((item) => ({
        name: item.label,
        level: item.value >= 85 ? "Senior" : item.value >= 70 ? "Middle" : "Junior",
        argument: item.summary,
        quote: [fallback.strongAnswerExample],
        recommendations: fallback.whatToImprove.slice(0, 1)
      }))
    };
  }

  return {
    overall_level: "Middle",
    overall_comment: `${scenarioTitle}: диалог завершен, отчет сформирован по mock-оценке.`,
    overall_recommendations: [
      "Уточняйте критерии выбора клиента раньше.",
      "Связывайте выгоду с риском бездействия.",
      "Фиксируйте следующий шаг в конце разговора."
    ],
    competencies: [
      {
        name: "Умение задавать вопросы",
        level: "Middle",
        argument: "Вопросы помогают двигать разговор вперед и уточнять контекст.",
        quote: ["Расскажите, пожалуйста, что для вас сейчас важнее всего?"],
        recommendations: ["Добавьте вопрос про последствия текущей ситуации."]
      },
      {
        name: "Диагностика потребности",
        level: "Middle",
        argument: "Есть базовая диагностика потребностей и ограничений клиента.",
        quote: ["Что будет критично при выборе решения?"],
        recommendations: ["Фиксируйте и бизнесовый, и операционный контекст."]
      },
      {
        name: "Формулировка ценности через выгоду",
        level: "Middle",
        argument: "Аргументация понятная, но не всегда привязана к цифрам клиента.",
        quote: ["Это поможет снизить риск простоя и ускорить внедрение."],
        recommendations: ["Добавьте один конкретный измеримый эффект."]
      },
      {
        name: "Работа с возражением «подумаю / не сейчас»",
        level: "Middle",
        argument: "Возражение обрабатывается спокойно и без давления.",
        quote: ["Понимаю, почему вы хотите проверить это подробнее."],
        recommendations: [
          "После признания сомнения уточняйте, что именно нужно проверить."
        ]
      },
      {
        name: "Фиксация следующего шага",
        level: "Junior",
        argument: "Финальная договоренность пока недостаточно конкретна.",
        quote: ["Давайте вернемся к этому чуть позже."],
        recommendations: ["Сразу предлагайте дату, формат и цель следующего контакта."]
      }
    ]
  };
}
