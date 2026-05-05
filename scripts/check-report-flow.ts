import { saveLatestSimulatorReportLocal } from "../src/services/reportFlowCore";
import type { SimulatorEvaluationPayloadDto } from "../src/types/academy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const evaluation: SimulatorEvaluationPayloadDto = {
  overall_level: "Middle",
  overall_comment: "Диалог уверенный, но следующий шаг можно фиксировать точнее.",
  overall_recommendations: [
    "Уточнять последствия бездействия раньше.",
    "Фиксировать конкретную дату следующего контакта."
  ],
  competencies: [
    {
      name: "Умение задавать вопросы",
      level: "Middle",
      argument: "Менеджер раскрывает контекст через уточняющие вопросы.",
      quote: ["Какие критерии для вас сейчас самые важные?"],
      recommendations: ["Добавить вопрос про риски текущего процесса."]
    },
    {
      name: "Фиксация следующего шага",
      level: "Junior",
      argument: "Следующий шаг обозначен, но не зафиксирован в календаре.",
      quote: ["Я направлю материалы после разговора."],
      recommendations: ["Сразу согласовать время следующего созвона."]
    }
  ]
};

const result = saveLatestSimulatorReportLocal({
  role: "student",
  scenarioId: "price-objection",
  scenarioTitle: "Возражение на цену",
  sourceLabel: "Диалог в чате",
  sessionId: "session-check-001",
  evaluation,
  createdAt: "2026-05-05T12:30:00.000Z",
  reportId: "report-check-001"
});

const firstReport = result.reportCards[0];

assert(result.savedReports.length === 1, "Expected exactly one saved local report.");
assert(firstReport !== undefined, "Expected a mapped report card.");
assert(firstReport.id === "report-check-001", "Report id mismatch.");
assert(firstReport.title === "Возражение на цену 05.05", "Report title mismatch.");
assert(firstReport.scenarioId === "price-objection", "scenarioId mismatch.");
assert(firstReport.sessionId === "session-check-001", "sessionId mismatch.");
assert(firstReport.status === "ready", "status must be ready.");
assert(firstReport.sourceLabel === "Диалог в чате", "sourceLabel mismatch.");
assert(firstReport.previewSections.length > 0, "Expected preview sections to be generated.");

console.log("report-flow-check: ok");
