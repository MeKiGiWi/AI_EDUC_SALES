import type { KnowledgeCategoryId, UserRole } from "../types/academy";

export type RootStackParamList = {
  Landing: undefined;
  StudentHome: undefined;
  KnowledgeBase: { materialId?: string; categoryId?: KnowledgeCategoryId } | undefined;
  Simulator: { scenarioId?: string; materialId?: string } | undefined;
  Scenarios: undefined;
  ManagerDashboard: undefined;
  HrDashboard: undefined;
  Admin: undefined;
  Reports: { highlightReportId?: string } | undefined;
  ReportViewer: { reportId: string };
};

export type RouteName = keyof RootStackParamList;

export interface RouteConfigItem {
  route: RouteName;
  title: string;
  description: string;
}

export const routeConfig: Record<RouteName, RouteConfigItem> = {
  Landing: {
    route: "Landing",
    title: "AI Sales Academy",
    description: "Лендинг и вход в рабочее пространство"
  },
  StudentHome: {
    route: "StudentHome",
    title: "Кабинет ученика",
    description: "Практика, модули и персональный трек"
  },
  KnowledgeBase: {
    route: "KnowledgeBase",
    title: "База знаний",
    description: "Материалы, кейсы и короткие гайды. Выбери категорию, быстро найди нужный материал и попроси простое объяснение или пример ответа."
  },
  Simulator: {
    route: "Simulator",
    title: "Чат",
    description: "Основное рабочее пространство для диалога с AI по выбранному сценарию."
  },
  Scenarios: {
    route: "Scenarios",
    title: "Сценарии",
    description: "Выберите режим работы AI под вашу задачу."
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
    description: "Здесь сохраняются результаты ваших сценариев."
  },
  ReportViewer: {
    route: "ReportViewer",
    title: "Просмотр отчета",
    description: "Откройте результат сценария и продолжите работу из отчета."
  }
};

export const roleHomeRoute: Record<UserRole, RouteName> = {
  student: "Simulator",
  manager: "Simulator",
  hr: "Reports",
  admin: "Reports"
};

export const tabsByRole: Record<UserRole, RouteName[]> = {
  student: ["Simulator", "Scenarios", "Reports"],
  manager: ["Simulator", "Scenarios", "Reports"],
  hr: ["Simulator", "Scenarios", "Reports"],
  admin: ["Simulator", "Scenarios", "Reports"]
};

export const roleLabels: Record<UserRole, string> = {
  student: "Ученик",
  manager: "Руководитель",
  hr: "HR / L&D",
  admin: "Администратор"
};

export function isRouteAllowedForRole(route: RouteName, role: UserRole) {
  if (route === "Landing") {
    return true;
  }

  if (route === "ReportViewer") {
    return tabsByRole[role].includes("Reports");
  }

  return tabsByRole[role].includes(route);
}
