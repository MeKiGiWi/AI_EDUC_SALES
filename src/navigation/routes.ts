import type { KnowledgeCategoryId, UserRole } from "../types/academy";

export type RootStackParamList = {
  Landing: undefined;
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
    title: "Тренажер",
    description: "Выбери модуль, затем сценарий и проведи практику диалога с разбором по компетенциям."
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
    description: "Выгрузки, правила отправки и рабочая аналитика"
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

  return tabsByRole[role].includes(route);
}
