import React, { useEffect, useMemo, useRef, useState } from "react";
import { Platform } from "react-native";

import { BottomTabs } from "../components/layout/BottomTabs";
import { DesktopSidebar } from "../components/layout/DesktopSidebar";
import { MobileHeader } from "../components/layout/MobileHeader";
import { AppCard } from "../components/ui/AppCard";
import { AppScreen } from "../components/ui/AppScreen";
import { roleWorkspaceOptions, simulatorEvaluationByScenarioId } from "../data/academyData";
import { DEFAULT_BACKEND_DIFFICULTY } from "../data/simulatorMvpData";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";
import { AuditScreen } from "../screens/audit/AuditScreen";
import { LandingScreen, type AuditLeadHandoff } from "../screens/landing/LandingScreen";
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
  SimulatorFinishResponseDto,
  SalesDialogueReportV2,
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

function formatReportCreatedAt(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${day}.${month} ${hours}:${minutes}`;
}

function getRoleOwnerLabel(role: UserRole): string {
  if (role === "student") {
    return "Анна Морозова";
  }

  if (role === "manager") {
    return "Руководитель продаж";
  }

  if (role === "hr") {
    return "HR-команда";
  }

  return "Администратор";
}

function buildGeneratingReport(params: {
  role: UserRole;
  scenarioId: string;
  scenarioTitle: string;
  sessionId: string;
}): ReportCard {
  const createdAt = new Date();
  const createdAtIso = createdAt.toISOString();
  const id = `generating-report-${params.sessionId}`;

  return {
    id,
    title: `${params.scenarioTitle} ${formatReportCreatedAt(createdAt)}`,
    role: params.role,
    reportType: "student_progress",
    scenarioId: params.scenarioId,
    scenarioTitle: params.scenarioTitle,
    status: "generating",
    summary: "Отчет формируется. Можно остаться на странице или вернуться к нему позже.",
    format: "pdf",
    createdAt: createdAtIso,
    updatedAt: createdAtIso,
    ownerLabel: getRoleOwnerLabel(params.role),
    sourceLabel: "Диалог в чате",
    sessionId: params.sessionId,
    availableFormats: [],
    previewSections: [
      {
        id: `${id}-status`,
        title: "Статус",
        lines: ["Backend анализирует диалог и готовит оценку компетенций."]
      }
    ]
  };
}

function mergeReports(primaryReports: ReportCard[], existingReports: ReportCard[]): ReportCard[] {
  const seen = new Set<string>();
  const merged: ReportCard[] = [];

  for (const report of [...primaryReports, ...existingReports]) {
    if (seen.has(report.id)) {
      continue;
    }

    seen.add(report.id);
    merged.push(report);
  }

  return merged;
}

export function AppNavigator() {
  const layout = useResponsiveLayout();
  useTheme();
  const activeRole: UserRole = "student";
  const [routeState, setRouteState] = useState<RouteState>({ name: "Landing" });
  const [workspaceData, setWorkspaceData] = useState<SalesAcademyMock | null>(null);
  const [activeScenarioId, setActiveScenarioId] = useState<string>("");
  const [trainerMode, setTrainerMode] = useState<"catalog" | "dialogue">("catalog");
  const [reports, setReports] = useState<ReportCard[]>([]);
  const [pendingAuditLead, setPendingAuditLead] = useState<AuditLeadHandoff | null>(null);
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

  // Web URL <-> route sync for the three public pages.
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const pathToRoute: Record<string, RouteName> = {
      "/landing": "Landing",
      "/audit": "Audit",
      "/simulator": "Simulator"
    };

    const applyFromPath = () => {
      const next = pathToRoute[window.location.pathname];
      if (next === "Audit") {
        setRouteState({ name: "Audit" });
      } else if (next === "Simulator") {
        setRouteState({ name: "Simulator" });
      } else {
        setRouteState({ name: "Landing" });
      }
    };

    if (!pathToRoute[window.location.pathname]) {
      window.history.replaceState({}, "", "/landing");
    }
    applyFromPath();

    window.addEventListener("popstate", applyFromPath);
    return () => window.removeEventListener("popstate", applyFromPath);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") {
      return;
    }

    const routeToPath: Partial<Record<RouteName, string>> = {
      Landing: "/landing",
      Audit: "/audit",
      Simulator: "/simulator"
    };

    const path = routeToPath[routeState.name];
    if (path && window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }, [routeState.name]);

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
            scenarioTitle: selectedScenario.title,
            openingMessage: selectedScenario.openingMessage
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

    if (isStopCommand(trimmedText)) {
      updateSession((current) => ({
        ...current,
        messages: [...current.messages, optimisticMessage],
        status: "finished",
        errorText: "Диалог остановлен. Отчет можно сформировать после 10 ваших реплик.",
        isSending: false
      }));
      return true;
    }

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
    if (!session || session.isFinishing) {
      return;
    }

    const existingReport = reports.find((report) => report.sessionId === session.sessionId);
    if (existingReport) {
      openReportViewer(existingReport.id);
      return;
    }

    const requiredReplyCount = workspaceData?.activeDialogue.replyTarget ?? 10;
    if (countManagerReplies(session.messages) < requiredReplyCount) {
      updateSession((current) => ({
        ...current,
        errorText: "Для корректной оценки нужно не менее 10 ваших реплик."
      }));
      return;
    }

    const generatingReport = buildGeneratingReport({
      role: activeRole,
      scenarioId: params.scenarioId,
      scenarioTitle: params.scenarioTitle,
      sessionId: session.sessionId
    });

    updateSession((current) => ({ ...current, isFinishing: true, status: "finished", errorText: null }));
    setReports((current) => [generatingReport, ...current]);
    openReportViewer(generatingReport.id);

    void generateAndSaveReportInBackground({
      session,
      scenarioId: params.scenarioId,
      scenarioTitle: params.scenarioTitle,
      placeholderReportId: generatingReport.id
    });
  }

  async function generateAndSaveReportInBackground(params: {
    session: ActiveDialogueSession;
    scenarioId: string;
    scenarioTitle: string;
    placeholderReportId: string;
  }) {
    try {
      let evaluation: SimulatorEvaluationPayloadDto | undefined;
      let reportV2: SalesDialogueReportV2 | undefined;

      if (params.session.mode === "api") {
        const finishResult = await finishApiSession(params.session.sessionId);
        evaluation = finishResult.evaluation;
        reportV2 = finishResult.report_v2;
      } else {
        evaluation = buildMockEvaluation(params.scenarioTitle, params.scenarioId);
        reportV2 = buildMockReportV2(params.scenarioTitle, params.scenarioId, params.session.sessionId, evaluation);
      }
      if (!evaluation) {
        throw new Error("Не удалось получить evaluation для сохранения отчёта.");
      }

      const syncedReports = await academyDataService.saveLatestSimulatorReport({
        role: activeRole,
        scenarioId: params.scenarioId,
        scenarioTitle: params.scenarioTitle,
        sessionId: params.session.sessionId,
        evaluation,
        reportV2
      });

      const createdReport =
        syncedReports.find((report) => report.sessionId === params.session.sessionId) ?? syncedReports[0];

      setReports((current) => {
        const withoutPlaceholder = current.filter((report) => report.id !== params.placeholderReportId);
        return mergeReports(createdReport ? syncedReports : withoutPlaceholder, withoutPlaceholder);
      });

      if (createdReport) {
        openReportViewer(createdReport.id);
      }
    } catch (error) {
      const errorText = getSafeSimulatorErrorMessage(error);
      setReports((current) =>
        current.map((report) =>
          report.id === params.placeholderReportId
            ? {
                ...report,
                status: "error",
                summary: errorText,
                previewSections: [
                  {
                    id: `${report.id}-error`,
                    title: "Что произошло",
                    lines: [errorText]
                  }
                ]
              }
            : report
        )
      );
    } finally {
      updateSession((current) => (current.sessionId === params.session.sessionId ? { ...current, isFinishing: false } : current));
    }
  }

  async function finishApiSession(sessionId: string): Promise<SimulatorFinishResponseDto> {
    // Никаких заглушек: дожидаемся реальной оценки от LLM. Если бэкенд завершил
    // сессию, но оценки нет — это ошибка, а не повод подставить mock-отчёт.
    const response = await simulatorApiService.finishDialogueSession(sessionId);
    if (!response.evaluation) {
      throw new Error(
        "Бэкенд завершил сессию, но не вернул оценку диалога. Отчёт не сформирован."
      );
    }
    return response;
  }

  const visibleRoutes = useMemo(() => visibleRoutesForRole(activeRole), [activeRole]);
  const navActiveRoute = routeState.name === "ReportViewer" ? "Reports" : routeState.name;
  const footer = useMemo(
    () =>
      layout.isDesktop ||
      routeState.name === "Landing" ||
      routeState.name === "Simulator" ||
      routeState.name === "ReportViewer" ? null : (
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
  const isMobileDialogue =
    routeState.name === "Simulator" && trainerMode === "dialogue" && !layout.isDesktop;
  const disableAppScroll =
    (routeState.name === "Simulator" && trainerMode === "dialogue") ||
    (routeState.name === "ReportViewer" && layout.isDesktop);
  if (isLanding) {
    return (
      <LandingScreen
        roleOptions={roleWorkspaceOptions}
        onOpenAudit={(lead) => {
          setPendingAuditLead(lead ?? null);
          navigate("Audit");
        }}
      />
    );
  }

  if (routeState.name === "Audit") {
    return <AuditScreen lead={pendingAuditLead} onGoToSimulator={() => navigate("Simulator")} />;
  }

  if (!workspaceData) {
    return (
      <AppScreen variant="app">
        <AppCard>Загрузка рабочего пространства...</AppCard>
      </AppScreen>
    );
  }

  const activeSimulatorScenario =
    workspaceData.scenarios.find((scenario) => scenario.id === activeScenarioId) ??
    workspaceData.scenarios.find((scenario) => scenario.id === workspaceData.activeDialogue.selectedScenarioId);
  const requiredSimulatorReplies = workspaceData.activeDialogue.replyTarget;
  const canFinishSimulatorReport =
    activeDialogueSession
      ? countManagerReplies(activeDialogueSession.messages) >= requiredSimulatorReplies
      : false;

  return (
    <AppScreen
      footer={footer ?? undefined}
      variant="app"
      scrollEnabled={!disableAppScroll}
      disableBottomPadding={disableAppScroll}
      fullBleed={isMobileDialogue}
      sidebar={
        layout.isDesktop ? (
          <DesktopSidebar
            activeRole={activeRole}
            activeRoute={navActiveRoute}
            user={workspaceData.user}
            routes={visibleRoutes}
            onNavigate={navigate}
            simulatorActions={
              routeState.name === "Simulator" && trainerMode === "dialogue" && activeSimulatorScenario
                ? {
                    onChangeScenario: openTrainerCatalog,
                    onFinishScenario: () =>
                      finishScenarioAndOpenReport({
                        scenarioId: activeSimulatorScenario.id,
                        scenarioTitle: activeSimulatorScenario.title
                      }),
                    isFinishing: activeDialogueSession?.isFinishing ?? false,
                    canFinish: canFinishSimulatorReport
                  }
                : undefined
            }
            reportActions={
              routeState.name === "ReportViewer"
                ? {
                    onOpenScenarios: () => navigate("Simulator")
                  }
                : undefined
            }
          />
        ) : undefined
      }
    >
      {showMobileHeader ? (
        <MobileHeader
          title={currentRouteConfig.title}
          subtitle={currentRouteConfig.description}
          user={workspaceData.user}
          actionLabel={
            routeState.name === "StudentHome"
              ? "На лендинг"
              : routeState.name === "ReportViewer"
                ? "К сценариям"
                : undefined
          }
          onActionPress={
            routeState.name === "StudentHome"
              ? () => navigate("Landing")
              : routeState.name === "ReportViewer"
                ? () => navigate("Simulator")
                : undefined
          }
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
          onBackToLanding={() => navigate("Landing")}
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
          onBack={() => navigate("Simulator")}
        />
      ) : null}
    </AppScreen>
  );
}

function isStopCommand(text: string): boolean {
  return text.trim().toLowerCase() === "стоп";
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
    "clinic-appointment": {
      overall_level: "Middle",
      overall_comment:
        "Контакт с тревожным пациентом выстроен спокойно, но часть формулировок можно сделать мягче и точнее фиксировать следующий шаг.",
      overall_recommendations: [
        "Начинайте с короткого признания тревоги пациента.",
        "Уточняйте симптомы и длительность без намёка на постановку диагноза.",
        "Фиксируйте врача, формат записи и следующий контакт."
      ],
      competencies: [
        {
          name: "Умение установить спокойный контакт",
          level: "Middle",
          argument: "Есть спокойное начало диалога, но эмпатию можно делать более явной.",
          quote: ["Здравствуйте, понимаю, что ситуация может тревожить."],
          recommendations: ["Добавляйте короткое признание эмоции пациента перед уточняющими вопросами."]
        },
        {
          name: "Умение задавать уточняющие вопросы по симптомам без постановки диагноза",
          level: "Middle",
          argument: "Уточняющие вопросы есть, и они в основном держатся в рамках сбора симптомов.",
          quote: ["Подскажите, пожалуйста, как давно у вас появились эти симптомы?"],
          recommendations: ["Избегайте формулировок, которые звучат как самодиагностика."]
        },
        {
          name: "Первичная маршрутизация пациента к подходящему врачу",
          level: "Middle",
          argument: "Маршрутизация присутствует, но можно быстрее подводить к подходящему специалисту.",
          quote: ["По описанию лучше начать с терапевта, и при необходимости вас направят дальше."],
          recommendations: ["Связывайте симптомы с понятным маршрутом записи."]
        },
        {
          name: "Работа с тревогой и сомнениями пациента",
          level: "Junior",
          argument: "Поддержка пациента есть не во всех репликах, поэтому тревога снижается не полностью.",
          quote: ["Давайте спокойно разберёмся и подберём ближайший следующий шаг."],
          recommendations: ["Чаще отзеркаливайте тревогу и объясняйте, что произойдёт дальше."]
        },
        {
          name: "Фиксация следующего шага",
          level: "Junior",
          argument: "Следующий шаг обозначен, но не всегда закреплён временем и подтверждением записи.",
          quote: ["Я могу предложить вам ближайшее окно к врачу."],
          recommendations: ["Фиксируйте дату, время и формат следующего действия."]
        }
      ]
    },
    "clinic-complaint": {
      overall_level: "Middle",
      overall_comment:
        "Жалоба обработана конструктивно: есть сбор фактов и движение к решению, но эмпатию без обороны ещё стоит усилить.",
      overall_recommendations: [
        "Сначала признавайте неудобство, потом переходите к фактам.",
        "Собирайте дату, время ожидания и участников ситуации.",
        "Фиксируйте конкретный срок обратной связи по обращению."
      ],
      competencies: [
        {
          name: "Контакт в жалобной коммуникации",
          level: "Middle",
          argument: "Контакт удерживается спокойно, без эскалации конфликта.",
          quote: ["Понимаю ваше недовольство, спасибо, что сказали об этом."],
          recommendations: ["Начинайте ответ с признания неудобства клиента."]
        },
        {
          name: "Сбор фактов по жалобе",
          level: "Middle",
          argument: "Фактура собирается по делу: время, ожидание и детали ситуации.",
          quote: ["Пожалуйста, уточните, сколько по времени вы ожидали и кто вас оформлял."],
          recommendations: ["Проверяйте, что зафиксированы дата, время и ключевое событие."]
        },
        {
          name: "Эмпатия без обороны",
          level: "Junior",
          argument: "Эмпатия есть, но местами ответ звучит слишком формально и может считываться как защита клиники.",
          quote: ["Сожалею, что вам пришлось столкнуться с таким ожиданием."],
          recommendations: ["Избегайте оправданий до того, как собраны факты."]
        },
        {
          name: "Предложение решения по обращению",
          level: "Middle",
          argument: "Решение предложено в рабочем формате: разбор обращения и обратная связь.",
          quote: ["Я передам обращение старшему администратору и вернусь к вам с результатом."],
          recommendations: ["Добавляйте срок и канал обратной связи."]
        },
        {
          name: "Фиксация следующего шага",
          level: "Junior",
          argument: "Следующий шаг есть, но его ещё стоит делать более конкретным по времени.",
          quote: ["Мы свяжемся с вами после проверки обращения."],
          recommendations: ["Фиксируйте конкретный срок и ответственного."]
        }
      ]
    },
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

function buildMockReportV2(
  scenarioTitle: string,
  scenarioId: string,
  sessionId: string,
  evaluation: SimulatorEvaluationPayloadDto
): SalesDialogueReportV2 {
  const competencyIdsByTitle: Record<string, string> = {
    "Умение установить спокойный контакт": "calm_contact",
    "Умение задавать уточняющие вопросы по симптомам без постановки диагноза": "symptom_questions_without_diagnosis",
    "Первичная маршрутизация пациента к подходящему врачу": "patient_routing",
    "Работа с тревогой и сомнениями пациента": "anxiety_handling",
    "Фиксация следующего шага": "next_step",
    "Контакт в жалобной коммуникации": "complaint_contact",
    "Сбор фактов по жалобе": "complaint_fact_gathering",
    "Эмпатия без обороны": "empathy_without_defensiveness",
    "Предложение решения по обращению": "complaint_solution"
  };
  const createdAt = new Date().toISOString();
  return {
    reportVersion: "2.0",
    case: {
      id: scenarioId,
      title: scenarioTitle,
      scenarioTitle,
      createdAt
    },
    participant: {
      role: "student",
      displayName: "Ученик"
    },
    summary: {
      title: `Отчет по диалогу: ${scenarioTitle}`,
      headline: evaluation.overall_comment,
      overallLevel: evaluation.overall_level,
      overallScore: evaluation.overall_level === "Senior" ? 90 : evaluation.overall_level === "Middle" ? 68 : 40,
      shortResume: [`Кейс: ${scenarioTitle}`, `Общий уровень: ${evaluation.overall_level}`, evaluation.overall_comment]
    },
    competencies: evaluation.competencies.map((competency, index) => ({
      id: competencyIdsByTitle[competency.name] ?? `competency_${index + 1}`,
      title: competency.name,
      level: competency.level,
      score: competency.level === "Senior" ? 90 : competency.level === "Middle" ? 68 : 40,
      comment: competency.argument,
      evidence: competency.quote.map((quote, quoteIndex) => ({
        quote,
        speaker: "manager",
        turnIndex: quoteIndex + 1
      }))
    })),
    dialogueAnalysis: [
      {
        turnIndex: 1,
        speaker: "manager",
        speakerLabel: "Менеджер",
        timestamp: "10:00",
        text: evaluation.competencies[0]?.quote[0] ?? "Реплика менеджера.",
        analysis: {
          status: "good",
          comment: evaluation.competencies[0]?.argument ?? "Реплика поддерживает сценарий.",
          recommendation: evaluation.competencies[0]?.recommendations[0] ?? null,
          competencyIds: [competencyIdsByTitle[evaluation.competencies[0]?.name ?? ""] ?? "competency_1"]
        }
      },
      {
        turnIndex: 2,
        speaker: "client",
        speakerLabel: "Клиент",
        timestamp: "10:01",
        text:
          scenarioId === "clinic-complaint"
            ? "Я ждала слишком долго и никто ничего не объяснил."
            : "Мне тревожно, я не понимаю, к кому лучше записаться.",
        analysis: {
          status: "neutral",
          comment:
            scenarioId === "clinic-complaint"
              ? "Пациент описывает неудобство и дает фактуру для разбора жалобы."
              : "Пациент проявляет тревогу и ожидает спокойного сопровождения.",
          recommendation:
            scenarioId === "clinic-complaint"
              ? "Подтвердите неудобство и уточните детали ожидания."
              : "Отзеркальте тревогу и уточните симптомы или длительность.",
          competencyIds: []
        }
      }
    ],
    strengths: evaluation.competencies.slice(0, 2).map((item) => ({
      title: item.name,
      comment: item.argument,
      evidence: item.quote.slice(0, 2)
    })),
    developmentAreas: evaluation.competencies.slice(-2).map((item) => ({
      title: item.name,
      comment: item.argument,
      actions: item.recommendations.slice(0, 2)
    })),
    nextSteps: evaluation.overall_recommendations.slice(0, 3),
    meta: {
      generatedBy: "AI Sales Academy",
      source: "dialogue_simulation",
      language: "ru"
    }
  };
}
