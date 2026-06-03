import type { KnowledgeCategoryId, UserRole } from "../types/academy";

export type RootStackParamList = {
  Landing: undefined;
  Audit: undefined;
  StudentHome: undefined;
  Simulator: { scenarioId?: string; materialId?: string } | undefined;
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
  Audit: {
    route: "Audit",
    title: "Аудит потерь клиники",
    description: "Быстрая оценка потерь по воронке клиники."
  },
  StudentHome: {
    route: "StudentHome",
    title: "Главная",
    description: "Центральное рабочее пространство с аналитикой и результатами последних тренировок."
  },
  Simulator: {
    route: "Simulator",
    title: "ИИ-Тренажер",
    description: "Практикуйте навыки продаж в реалистичных сценариях."
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
  hr: "Simulator",
  admin: "Simulator"
};

export const tabsByRole: Record<UserRole, RouteName[]> = {
  student: ["Simulator"],
  manager: ["Simulator"],
  hr: ["Simulator"],
  admin: ["Simulator"]
};

export const roleLabels: Record<UserRole, string> = {
  student: "Ученик",
  manager: "Руководитель",
  hr: "HR / L&D",
  admin: "Администратор"
};

export function isRouteAllowedForRole(route: RouteName, role: UserRole) {
  if (route === "Landing" || route === "Audit") {
    return true;
  }

  if (route === "ReportViewer" || route === "Reports" || route === "StudentHome") {
    return true;
  }

  return tabsByRole[role].includes(route);
}
