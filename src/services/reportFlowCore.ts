import type {
  ReportCard,
  SavedSimulatorReport,
  SimulatorEvaluationPayloadDto,
  UserRole
} from "../types/academy";

const roleOwnerLabels: Record<UserRole, string> = {
  student: "Ученик",
  manager: "Руководитель",
  hr: "HR / L&D",
  admin: "Администратор"
};

export const competencyLevelRank = {
  Junior: 1,
  Middle: 2,
  Senior: 3
} as const;

type EvaluationCompetency = SimulatorEvaluationPayloadDto["competencies"][number];

/**
 * Зоны развития = компетенции с уровнем ниже общего (на 1–2 ступени), как в ТЗ.
 * Если таких нет — возвращаем пустой массив (явных зон ниже общего уровня нет).
 */
export function getDevelopmentCompetencies(
  evaluation: SimulatorEvaluationPayloadDto
): EvaluationCompetency[] {
  const overallRank = competencyLevelRank[evaluation.overall_level];
  return evaluation.competencies
    .filter((competency) => competencyLevelRank[competency.level] < overallRank)
    .sort((left, right) => competencyLevelRank[left.level] - competencyLevelRank[right.level])
    .slice(0, 2);
}

/** Сильные стороны = компетенции на уровне общего или выше (до 3-х). */
export function getStrengthCompetencies(
  evaluation: SimulatorEvaluationPayloadDto
): EvaluationCompetency[] {
  const overallRank = competencyLevelRank[evaluation.overall_level];
  const atOrAbove = evaluation.competencies.filter(
    (competency) => competencyLevelRank[competency.level] >= overallRank
  );
  const pool =
    atOrAbove.length > 0
      ? atOrAbove
      : [...evaluation.competencies].sort(
          (left, right) => competencyLevelRank[right.level] - competencyLevelRank[left.level]
        );
  return pool.slice(0, 3);
}

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
  // Фокус по 1–2 отстающим компетенциям (как в шаблоне отчёта).
  const focus = getDevelopmentCompetencies(evaluation);
  if (focus.length > 0) {
    return focus.flatMap((competency, index) => {
      const header = `Фокус ${index + 1}. ${competency.name} (сейчас ${competency.level}, общий уровень — ${evaluation.overall_level}):`;
      const steps = competency.recommendations.map((recommendation) => `— ${recommendation}`);
      return [header, ...steps];
    });
  }

  // Явных зон ниже общего уровня нет — даём общий вектор развития.
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

function buildStrengthLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  return getStrengthCompetencies(evaluation).map(
    (competency) => `${competency.name}: ${competency.argument}`
  );
}

function buildDevelopmentLines(evaluation: SimulatorEvaluationPayloadDto): string[] {
  const development = getDevelopmentCompetencies(evaluation);
  if (development.length === 0) {
    return ["Явных зон ниже общего уровня нет — держите текущую планку."];
  }
  return development.map((competency) => `${competency.name}: ${competency.argument}`);
}

function buildDisplayName(scenarioTitle: string, date: Date): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${scenarioTitle} ${day}.${month}`;
}

export function savedReportToReportCard(saved: SavedSimulatorReport, role: UserRole): ReportCard {
  const evaluation = saved.evaluation;
  const recommendationLines = buildRecommendationLines(evaluation);
  const quoteLines = buildQuoteLines(evaluation);
  const updatedAt = formatReportTimestamp(new Date(saved.createdAt));

  return {
    id: saved.id,
    title: saved.displayName,
    role,
    reportType: "student_progress",
    scenarioId: saved.scenarioId ?? null,
    scenarioTitle: saved.scenarioTitle,
    status: "ready",
    summary: evaluation.overall_comment,
    format: "pdf",
    createdAt: saved.createdAt,
    updatedAt,
    ownerLabel: roleOwnerLabels[role],
    sourceLabel: saved.sourceLabel ?? "Диалог в чате",
    sessionId: saved.sessionId ?? null,
    availableFormats: ["pdf", "csv"],
    evaluation,
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

export function mapSavedReportsToCards(
  savedReports: SavedSimulatorReport[],
  role: UserRole
): ReportCard[] {
  return savedReports.map((item) => savedReportToReportCard(item, role));
}

export function saveLatestSimulatorReportLocal(params: {
  role: UserRole;
  scenarioId?: string | null;
  scenarioTitle: string;
  sourceLabel?: string | null;
  sessionId?: string | null;
  evaluation: SimulatorEvaluationPayloadDto;
  existingReports?: SavedSimulatorReport[];
  createdAt?: string;
  reportId?: string;
}) {
  const createdAt = params.createdAt ?? new Date().toISOString();
  const createdDate = new Date(createdAt);
  const savedReport: SavedSimulatorReport = {
    id: params.reportId ?? `report-${createdDate.getTime()}-local-check`,
    scenarioId: params.scenarioId ?? undefined,
    scenarioTitle: params.scenarioTitle,
    displayName: buildDisplayName(params.scenarioTitle, createdDate),
    createdAt,
    sourceLabel: params.sourceLabel ?? "Диалог в чате",
    sessionId: params.sessionId ?? undefined,
    evaluation: params.evaluation
  };
  const savedReports = [savedReport, ...(params.existingReports ?? [])];

  return {
    savedReport,
    savedReports,
    reportCards: mapSavedReportsToCards(savedReports, params.role)
  };
}
