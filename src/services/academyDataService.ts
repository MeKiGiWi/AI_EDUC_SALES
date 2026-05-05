import {
  adminSettingsData,
  hrDashboardData,
  knowledgeSections,
  managerDashboardData,
  scenarios,
  studentDashboardData,
  usersByRole
} from "../data/academyData";
import { salesAcademyMock } from "../data/salesAcademyMock";
import type {
  AcademyUser,
  AdminSettings,
  HrDashboard,
  KnowledgeSection,
  ManagerDashboard,
  ReportCard,
  SalesAcademyMock,
  Scenario,
  SimulatorEvaluationPayloadDto,
  StudentDashboard,
  UserRole
} from "../types/academy";
import { reportApiService } from "./reportApiService";

const simulateLatency = async <T>(data: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), 120);
  });

export const academyDataService = {
  getWorkspaceData(role: UserRole): Promise<SalesAcademyMock> {
    return simulateLatency({
      ...salesAcademyMock,
      user: usersByRole[role]
    });
  },

  getCurrentUser(role: UserRole): Promise<AcademyUser> {
    return simulateLatency(usersByRole[role]);
  },
  getStudentDashboard(): Promise<StudentDashboard> {
    return simulateLatency(studentDashboardData);
  },
  getKnowledgeSections(): Promise<KnowledgeSection[]> {
    return simulateLatency(knowledgeSections);
  },
  getScenarios(): Promise<Scenario[]> {
    return simulateLatency(scenarios);
  },
  getManagerDashboard(): Promise<ManagerDashboard> {
    return simulateLatency(managerDashboardData);
  },
  getHrDashboard(): Promise<HrDashboard> {
    return simulateLatency(hrDashboardData);
  },
  getAdminSettings(): Promise<AdminSettings> {
    return simulateLatency(adminSettingsData);
  },

  async getReports(role: UserRole): Promise<ReportCard[]> {
    if (!reportApiService.isEnabled()) {
      return simulateLatency([]);
    }

    const cards = await reportApiService.fetchReports(role);
    return simulateLatency(cards);
  },

  async saveLatestSimulatorReport(params: {
    role: UserRole;
    scenarioId?: string | null;
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
    reportV2?: ReportCard["reportV2"];
    sessionId?: string | null;
  }): Promise<ReportCard[]> {
    if (!reportApiService.isEnabled()) {
      throw new Error("Backend отчетов недоступен. Проверьте подключение к серверу.");
    }

    await reportApiService.createReport({
      role: params.role,
      scenarioId: params.scenarioId,
      scenarioTitle: params.scenarioTitle,
      evaluation: params.evaluation,
      reportV2: params.reportV2 ?? undefined,
      sourceLabel: "Диалог в чате",
      sessionId: params.sessionId
    });
    const syncedCards = await reportApiService.fetchReports(params.role);
    return simulateLatency(syncedCards);
  }
};
