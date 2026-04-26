import {
  adminSettingsData,
  hrDashboardData,
  knowledgeSections,
  managerDashboardData,
  reportCards,
  scenarios,
  studentDashboardData,
  usersByRole
} from "../data/mockAcademyData";
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

const simulateLatency = async <T>(data: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), 120);
  });

export const academyMockService = {
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
  getReports(): Promise<ReportCard[]> {
    return simulateLatency(reportCards);
  }
};
