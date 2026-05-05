import type { ReportCard, SimulatorEvaluationPayloadDto } from "../../types/academy";
import type {
  CompetencyAssessment,
  DialogueTurnAnalysis,
  ReportDevelopmentArea,
  ReportLevel,
  ReportStrength,
  SalesDialogueReportV2
} from "./types";

const levelScoreMap: Record<ReportLevel, number> = {
  Trainee: 20,
  Junior: 40,
  Middle: 68,
  Senior: 90
};

function legacyLevelToV2(level: SimulatorEvaluationPayloadDto["overall_level"]): ReportLevel {
  return level;
}

function buildFallbackDialogue(
  report: Pick<ReportCard, "previewSections"> | Pick<ReportCard, never>
): DialogueTurnAnalysis[] {
  const sections = "previewSections" in report ? report.previewSections : [];
  const lines = sections.find((section) => section.title === "Цитаты из диалога")?.lines ?? [];
  return lines.map((line, index) => ({
    turnIndex: index + 1,
    speaker: "manager",
    speakerLabel: "Менеджер",
    timestamp: null,
    text: line.replace(/^«|»$/g, ""),
    analysis: {
      status: "neutral",
      comment: "Реплика восстановлена из legacy-отчета.",
      recommendation: null,
      competencyIds: []
    }
  }));
}

export function adaptLegacyEvaluationToReportV2(
  report: Pick<
    ReportCard,
    "id" | "title" | "scenarioId" | "scenarioTitle" | "createdAt" | "summary" | "ownerLabel"
  > & {
    evaluation?: SimulatorEvaluationPayloadDto;
  }
): SalesDialogueReportV2 {
  const evaluation = report.evaluation;
  const overallLevel = evaluation ? legacyLevelToV2(evaluation.overall_level) : "Junior";
  const competencies: CompetencyAssessment[] = evaluation
    ? evaluation.competencies.map((item) => ({
        id: item.name.toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-"),
        title: item.name,
        level: legacyLevelToV2(item.level),
        score: levelScoreMap[legacyLevelToV2(item.level)],
        comment: item.argument,
        evidence: item.quote.map((quote, index) => ({
          quote,
          speaker: "manager",
          turnIndex: index + 1
        }))
      }))
    : [];

  const strengths: ReportStrength[] = competencies.slice(0, 2).map((item) => ({
    title: item.title,
    comment: item.comment,
    evidence: item.evidence.map((quote) => quote.quote)
  }));

  const developmentAreas: ReportDevelopmentArea[] = evaluation
    ? evaluation.competencies.slice(-2).map((item) => ({
        title: item.name,
        comment: item.argument,
        actions: item.recommendations
      }))
    : [
        {
          title: "Требуется повторный анализ",
          comment: "Legacy-данных недостаточно для полноценного разбора по фразам.",
          actions: ["Сформируйте новый отчет после следующей тренировки."]
        }
      ];

  return {
    reportVersion: "2.0",
    case: {
      id: report.scenarioId ?? report.id,
      title: report.scenarioTitle,
      scenarioTitle: report.scenarioTitle,
      createdAt: report.createdAt
    },
    participant: {
      role: "student",
      displayName: report.ownerLabel
    },
    summary: {
      title: `Отчет по диалогу: ${report.scenarioTitle}`,
      headline: report.summary,
      overallLevel,
      overallScore:
        competencies.length > 0
          ? Math.round(competencies.reduce((sum, item) => sum + item.score, 0) / competencies.length)
          : levelScoreMap[overallLevel],
      shortResume: [`Кейс: ${report.scenarioTitle}`, `Общий уровень: ${overallLevel}`, report.summary]
    },
    competencies,
    dialogueAnalysis: buildFallbackDialogue(report),
    strengths,
    developmentAreas,
    nextSteps: evaluation?.overall_recommendations ?? [],
    meta: {
      generatedBy: "AI Sales Academy",
      source: "dialogue_simulation",
      language: "ru",
      fallback: true
    }
  };
}

export function resolveReportV2(report: ReportCard): SalesDialogueReportV2 {
  if (report.reportV2) {
    return report.reportV2;
  }

  return adaptLegacyEvaluationToReportV2({
    ...report,
    evaluation: report.evaluation
  });
}
