import {
  adminSettingsData,
  hrDashboardData,
  knowledgeSections,
  managerDashboardData,
  scenarios,
  studentDashboardData,
  usersByRole
} from "../data/academyData";
import type {
  AcademyUser,
  AdminSettings,
  HrDashboard,
  KnowledgeSection,
  ManagerDashboard,
  ReportCard,
  Scenario,
  SimulatorEvaluationPayloadDto,
  StudentDashboard,
  UserRole
} from "../types/academy";

const simulateLatency = async <T>(data: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), 120);
  });

const latestReportId = "latest-simulator-report";
const roleOwnerLabels: Record<UserRole, string> = {
  student: "Ученик",
  manager: "Руководитель",
  hr: "HR / L&D",
  admin: "Администратор"
};
const competencyLevelRank = {
  Junior: 1,
  Middle: 2,
  Senior: 3
} as const;

let latestSimulatorReport: ReportCard | null = null;

function formatLatestReportTimestamp(date: Date): string {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `Сегодня, ${hours}:${minutes}`;
}

function buildCompetencyLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  return evaluation.competencies.map(
    (competency) => `${competency.name}: ${competency.level} — ${competency.argument}`
  );
}

function buildRecommendationLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  if (evaluation.overall_recommendations.length > 0) {
    return evaluation.overall_recommendations;
  }

  return evaluation.competencies
    .flatMap((competency) =>
      competency.recommendations.map((recommendation) => `${competency.name}: ${recommendation}`)
    )
    .slice(0, 4);
}

function buildQuoteLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  return evaluation.competencies
    .flatMap((competency) => competency.quote)
    .slice(0, 4)
    .map((quote) => `«${quote}»`);
}

function sortCompetenciesByLevel(
  evaluation: SimulatorEvaluationPayloadDto,
  order: "asc" | "desc"
) {
  const items = [...evaluation.competencies];
  items.sort((left, right) => {
    const leftRank = competencyLevelRank[left.level];
    const rightRank = competencyLevelRank[right.level];
    return order === "asc" ? leftRank - rightRank : rightRank - leftRank;
  });
  return items;
}

function buildStrengthLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  const strongest = sortCompetenciesByLevel(evaluation, "desc").slice(0, 2);
  return strongest.map((competency) => `${competency.name}: ${competency.argument}`);
}

function buildDevelopmentLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  const weakest = sortCompetenciesByLevel(evaluation, "asc").slice(0, 2);
  return weakest.map((competency) => {
    const nextStep = competency.recommendations[0];
    return nextStep
      ? `${competency.name}: ${nextStep}`
      : `${competency.name}: ${competency.argument}`;
  });
}

export const academyDataService = {
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
    return simulateLatency(latestSimulatorReport ? [latestSimulatorReport] : []);
  },
  saveLatestSimulatorReport(params: {
    role: UserRole;
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
  }): Promise<ReportCard> {
    const updatedAt = formatLatestReportTimestamp(new Date());
    const recommendationLines = buildRecommendationLines(params.evaluation);
    const quoteLines = buildQuoteLines(params.evaluation);

    latestSimulatorReport = {
      id: latestReportId,
      title: `Отчет по диалогу: ${params.scenarioTitle}`,
      role: params.role,
      reportType: "student_progress",
      summary: params.evaluation.overall_comment,
      format: "pdf",
      updatedAt,
      ownerLabel: roleOwnerLabels[params.role],
      availableFormats: ["pdf", "csv"],
      previewSections: [
        {
          id: `${latestReportId}-resume`,
          title: "Краткое резюме",
          lines: [
            `Кейс: ${params.scenarioTitle}`,
            `Общий уровень: ${params.evaluation.overall_level}`,
            params.evaluation.overall_comment
          ]
        },
        {
          id: `${latestReportId}-competencies`,
          title: "Компетенции",
          lines: buildCompetencyLines(params.evaluation)
        },
        {
          id: `${latestReportId}-strengths`,
          title: "Сильные стороны",
          lines: buildStrengthLines(params.evaluation)
        },
        {
          id: `${latestReportId}-development`,
          title: "Зоны развития",
          lines: buildDevelopmentLines(params.evaluation)
        },
        {
          id: `${latestReportId}-recommendations`,
          title: "Рекомендации",
          lines:
            recommendationLines.length > 0
              ? recommendationLines
              : ["Продолжить практику и собрать больше реплик для следующей оценки."]
        },
        ...(quoteLines.length > 0
          ? [
              {
                id: `${latestReportId}-quotes`,
                title: "Цитаты из диалога",
                lines: quoteLines
              }
            ]
          : [])
      ]
    };

    return simulateLatency(latestSimulatorReport);
  }
};
