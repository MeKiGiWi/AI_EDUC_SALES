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
  SavedSimulatorReport,
  SalesAcademyMock,
  Scenario,
  SimulatorEvaluationPayloadDto,
  StudentDashboard,
  UserRole
} from "../types/academy";
import { Platform } from "react-native";
import { reportApiService } from "./reportApiService";
import { mapSavedReportsToCards } from "./reportFlowCore";
import { reportStorageService } from "./reportStorageService";

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
    if (reportApiService.isEnabled()) {
      try {
        const cards = await reportApiService.fetchReports(role);
        return simulateLatency(cards);
      } catch (error) {
        console.warn("[reports] backend fetch failed", error);
        if (Platform.OS === "web") {
          return simulateLatency([]);
        }
      }
    }

    const saved = await reportStorageService.getAll(role);
    const fallbackCards = mapSavedReportsToCards(saved, role);
    return simulateLatency(fallbackCards);
  },

  async saveLatestSimulatorReport(params: {
    role: UserRole;
    scenarioId?: string | null;
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
    sessionId?: string | null;
  }): Promise<ReportCard[]> {
    if (reportApiService.isEnabled()) {
      try {
        await reportApiService.createReport({
          role: params.role,
          scenarioId: params.scenarioId,
          scenarioTitle: params.scenarioTitle,
          evaluation: params.evaluation,
          sourceLabel: "Диалог в чате",
          sessionId: params.sessionId
        });
        const syncedCards = await reportApiService.fetchReports(params.role);
        return simulateLatency(syncedCards);
      } catch (error) {
        console.warn("[reports] backend sync failed, saving local fallback", error);
      }
    }

    // Native/local fallback stays in place until we have full auth-bound syncing.
    const saved = await reportStorageService.save({
      role: params.role,
      scenarioId: params.scenarioId,
      scenarioTitle: params.scenarioTitle,
      sourceLabel: "Диалог в чате",
      sessionId: params.sessionId,
      evaluation: params.evaluation
    });

    const allSaved = await reportStorageService.getAll(params.role);
    const hasSaved = allSaved.some((item) => item.id === saved.id);
    const normalizedSaved = hasSaved ? allSaved : [saved, ...allSaved];

    const fallbackCards = mapSavedReportsToCards(normalizedSaved, params.role);
    return simulateLatency(fallbackCards);
  }
};
