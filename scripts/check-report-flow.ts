import { saveLatestSimulatorReportLocal } from "../src/services/reportFlowCore";
import type { SalesDialogueReportV2, SimulatorEvaluationPayloadDto } from "../src/types/academy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

type ScenarioCheck = {
  scenarioId: "clinic-appointment" | "clinic-complaint";
  scenarioTitle: string;
  expectedCompetencies: string[];
  expectedIds: string[];
};

const scenarios: ScenarioCheck[] = [
  {
    scenarioId: "clinic-appointment",
    scenarioTitle: "Первичная запись: тревожный пациент с симптомами",
    expectedCompetencies: [
      "Умение установить спокойный контакт",
      "Умение задавать уточняющие вопросы по симптомам без постановки диагноза",
      "Первичная маршрутизация пациента к подходящему врачу",
      "Работа с тревогой и сомнениями пациента",
      "Фиксация следующего шага"
    ],
    expectedIds: [
      "calm_contact",
      "symptom_questions_without_diagnosis",
      "patient_routing",
      "anxiety_handling",
      "next_step"
    ]
  },
  {
    scenarioId: "clinic-complaint",
    scenarioTitle: "Жалоба на сервис клиники и длительное ожидание",
    expectedCompetencies: [
      "Контакт в жалобной коммуникации",
      "Сбор фактов по жалобе",
      "Эмпатия без обороны",
      "Предложение решения по обращению",
      "Фиксация следующего шага"
    ],
    expectedIds: [
      "complaint_contact",
      "complaint_fact_gathering",
      "empathy_without_defensiveness",
      "complaint_solution",
      "next_step"
    ]
  }
];

function buildEvaluation(check: ScenarioCheck): SimulatorEvaluationPayloadDto {
  return {
    overall_level: "Middle",
    overall_comment: `${check.scenarioTitle}: проверка V2 flow.`,
    overall_recommendations: ["Сохранить структуру диалога.", "Не терять dialogueAnalysis."],
    competencies: check.expectedCompetencies.map((name) => ({
      name,
      level: "Middle",
      argument: `${name}: аргументация для проверки.`,
      quote: [`${name}: цитата`],
      recommendations: [`${name}: рекомендация`]
    }))
  };
}

function buildReportV2(check: ScenarioCheck): SalesDialogueReportV2 {
  const evaluation = buildEvaluation(check);
  return {
    reportVersion: "2.0",
    case: {
      id: check.scenarioId,
      title: check.scenarioTitle,
      scenarioTitle: check.scenarioTitle,
      createdAt: "2026-05-05T12:30:00.000Z"
    },
    participant: {
      role: "student",
      displayName: "Ученик"
    },
    summary: {
      title: `Отчет по диалогу: ${check.scenarioTitle}`,
      headline: `${check.scenarioTitle}: V2 отчёт собран.`,
      overallLevel: "Middle",
      overallScore: 68,
      shortResume: [`Кейс: ${check.scenarioTitle}`, "Общий уровень: Middle", "dialogueAnalysis должен сохраниться."]
    },
    competencies: evaluation.competencies.map((competency, index) => ({
      id: check.expectedIds[index],
      title: competency.name,
      level: "Middle",
      score: 68,
      comment: competency.argument,
      evidence: [
        {
          quote: competency.quote[0],
          speaker: "manager",
          turnIndex: index + 1
        }
      ]
    })),
    dialogueAnalysis: [
      {
        turnIndex: 1,
        speaker: "manager",
        speakerLabel: "Менеджер",
        timestamp: "12:30",
        text: "Тестовая реплика менеджера.",
        analysis: {
          status: "good",
          comment: "dialogueAnalysis не должен потеряться после save flow.",
          recommendation: null,
          competencyIds: [check.expectedIds[0]]
        }
      }
    ],
    strengths: evaluation.competencies.slice(0, 2).map((competency) => ({
      title: competency.name,
      comment: competency.argument,
      evidence: competency.quote
    })),
    developmentAreas: evaluation.competencies.slice(-2).map((competency) => ({
      title: competency.name,
      comment: competency.argument,
      actions: competency.recommendations
    })),
    nextSteps: evaluation.overall_recommendations,
    meta: {
      generatedBy: "AI Sales Academy",
      source: "dialogue_simulation",
      language: "ru"
    }
  };
}

for (const check of scenarios) {
  const evaluation = buildEvaluation(check);
  const reportV2 = buildReportV2(check);
  const result = saveLatestSimulatorReportLocal({
    role: "student",
    scenarioId: check.scenarioId,
    scenarioTitle: check.scenarioTitle,
    sourceLabel: "Диалог в чате",
    sessionId: `session-${check.scenarioId}`,
    evaluation,
    reportV2,
    createdAt: "2026-05-05T12:30:00.000Z",
    reportId: `report-${check.scenarioId}`
  });

  const firstReport = result.reportCards[0];
  assert(firstReport?.reportV2, `Missing reportV2 for ${check.scenarioId}`);
  assert(firstReport.reportV2.case.id === check.scenarioId, `scenarioId mismatch for ${check.scenarioId}`);
  assert(firstReport.reportV2.competencies.length === 5, `Expected 5 competencies for ${check.scenarioId}`);
  assert(
    JSON.stringify(firstReport.reportV2.competencies.map((item) => item.title)) === JSON.stringify(check.expectedCompetencies),
    `Competency titles mismatch for ${check.scenarioId}`
  );
  assert(
    JSON.stringify(firstReport.reportV2.competencies.map((item) => item.id)) === JSON.stringify(check.expectedIds),
    `Competency ids mismatch for ${check.scenarioId}`
  );
  assert(firstReport.reportV2.dialogueAnalysis.length > 0, `Missing dialogueAnalysis for ${check.scenarioId}`);
}

console.log("report-flow-check: ok");
