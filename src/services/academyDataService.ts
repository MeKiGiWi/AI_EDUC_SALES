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
  SavedSimulatorReport,
  Scenario,
  SimulatorEvaluationPayloadDto,
  StudentDashboard,
  UserRole
} from "../types/academy";
import { reportStorageService } from "./reportStorageService";

const simulateLatency = async <T>(data: T): Promise<T> =>
  new Promise((resolve) => {
    setTimeout(() => resolve(data), 120);
  });

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

function formatReportTimestamp(date: Date): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${day}.${month} ${hours}:${minutes}`;
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

function savedReportToReportCard(
  saved: SavedSimulatorReport,
  role: UserRole
): ReportCard {
  const evaluation = saved.evaluation;
  const recommendationLines = buildRecommendationLines(evaluation);
  const quoteLines = buildQuoteLines(evaluation);
  const updatedAt = formatReportTimestamp(new Date(saved.createdAt));

  return {
    id: saved.id,
    title: saved.displayName,
    role,
    reportType: "student_progress",
    summary: evaluation.overall_comment,
    format: "pdf",
    updatedAt,
    ownerLabel: roleOwnerLabels[role],
    availableFormats: ["pdf", "csv"],
    previewSections: [
      {
        id: `${saved.id}-resume`,
        title: "Краткое резюме",
        lines: [
          `Кейс: ${saved.scenarioTitle}`,
          `Общий уровень: ${evaluation.overall_level}`,
          evaluation.overall_comment
        ]
      },
      {
        id: `${saved.id}-competencies`,
        title: "Компетенции",
        lines: buildCompetencyLines(evaluation)
      },
      {
        id: `${saved.id}-strengths`,
        title: "Сильные стороны",
        lines: buildStrengthLines(evaluation)
      },
      {
        id: `${saved.id}-development`,
        title: "Зоны развития",
        lines: buildDevelopmentLines(evaluation)
      },
      {
        id: `${saved.id}-recommendations`,
        title: "Рекомендации",
        lines:
          recommendationLines.length > 0
            ? recommendationLines
            : ["Продолжить практику и собрать больше реплик для следующей оценки."]
      },
      ...(quoteLines.length > 0
        ? [
            {
              id: `${saved.id}-quotes`,
              title: "Цитаты из диалога",
              lines: quoteLines
            }
          ]
        : [])
    ]
  };
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

  async getReports(role: UserRole): Promise<ReportCard[]> {
    const saved = await reportStorageService.getAll(role);
    const cards = saved.map((item) => savedReportToReportCard(item, role));
    return simulateLatency(cards);
  },

  async saveLatestSimulatorReport(params: {
    role: UserRole;
    scenarioTitle: string;
    evaluation: SimulatorEvaluationPayloadDto;
  }): Promise<ReportCard[]> {
    const saved = await reportStorageService.save(
      params.role,
      params.scenarioTitle,
      params.evaluation
    );

    const allSaved = await reportStorageService.getAll(params.role);
    const hasSaved = allSaved.some((item) => item.id === saved.id);
    const normalizedSaved = hasSaved ? allSaved : [saved, ...allSaved];

    const cards = normalizedSaved.map((item) =>
      savedReportToReportCard(item, params.role)
    );

    return simulateLatency(cards);
  }
};
