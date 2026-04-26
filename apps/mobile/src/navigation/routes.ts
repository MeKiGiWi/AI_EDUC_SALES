import type { KnowledgeCategoryId, UserRole } from "../types/academy";

export type RootStackParamList = {
  StudentHome: undefined;
  KnowledgeBase: { materialId?: string; categoryId?: KnowledgeCategoryId } | undefined;
  Simulator: { scenarioId?: string; materialId?: string } | undefined;
  ManagerDashboard: undefined;
  HrDashboard: undefined;
  Admin: undefined;
  Reports: { highlightReportId?: string } | undefined;
};

export type RouteName = keyof RootStackParamList;

export interface RouteConfigItem {
  route: RouteName;
  title: string;
  description: string;
}

export const routeConfig: Record<RouteName, RouteConfigItem> = {
  StudentHome: {
    route: "StudentHome",
    title: "Кабинет ученика",
    description: "Практика, модули и персональный трек"
  },
  KnowledgeBase: {
    route: "KnowledgeBase",
    title: "База знаний",
    description: "Материалы, кейсы и короткие гайды"
  },
  Simulator: {
    route: "Simulator",
    title: "Симулятор",
    description: "Живой диалог и разбор ответа"
  },
  ManagerDashboard: {
    route: "ManagerDashboard",
    title: "Кабинет руководителя",
    description: "Команда, риски и coaching actions"
  },
  HrDashboard: {
    route: "HrDashboard",
    title: "Кабинет HR / L&D",
    description: "Компетенции, adoption и треки развития"
  },
  Admin: {
    route: "Admin",
    title: "Администрирование",
    description: "Роли, правила доступа и регламенты"
  },
  Reports: {
    route: "Reports",
    title: "Отчеты",
    description: "Выгрузки, PDF и scheduled rules"
  }
};

export const roleHomeRoute: Record<UserRole, RouteName> = {
  student: "StudentHome",
  manager: "ManagerDashboard",
  hr: "HrDashboard",
  admin: "Admin"
};

export const tabsByRole: Record<UserRole, RouteName[]> = {
  student: ["StudentHome", "KnowledgeBase", "Simulator", "Reports"],
  manager: ["ManagerDashboard", "KnowledgeBase", "Simulator", "Reports"],
  hr: ["HrDashboard", "KnowledgeBase", "Reports"],
  admin: ["Admin", "Reports", "KnowledgeBase"]
};
