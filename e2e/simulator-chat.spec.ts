import { expect, test } from "@playwright/test";

const iso = "2026-05-05T12:30:00.000Z";
const managerText = "Добрый день, давайте уточним критерии выбора.";
const managerMessages = Array.from({ length: 10 }, (_, index) => `${managerText} #${index + 1}`);

test("mock mode keeps the last bubble above input and clears transient UI state", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mock", "mock project only");

  await page.goto("/simulator");
  await page.getByText("Начать тренировку", { exact: true }).click();

  await expect(page.getByTestId("simulator-chat-panel")).toBeVisible();
  await page.getByTestId("simulator-chat-input").fill(managerText);
  await page.getByTestId("simulator-send-button").click();

  await expect(page.getByTestId("simulator-message-manager").last()).toContainText(managerText);
  await expect(page.getByTestId("simulator-message-customer").last()).toBeVisible();
  await expect(page.getByTestId("simulator-chat-input")).toHaveValue("");
  await expect(page.getByText("Реплика добавлена в диалог.")).toHaveCount(0);
  await expect(page.getByTestId("simulator-typing-indicator")).toHaveCount(0);

  const lastCustomerBubble = page.getByTestId("simulator-message-customer").last();
  const inputRow = page.getByTestId("simulator-chat-input-row");
  const bubbleBox = await lastCustomerBubble.boundingBox();
  const inputBox = await inputRow.boundingBox();

  expect(bubbleBox).not.toBeNull();
  expect(inputBox).not.toBeNull();
  if (!bubbleBox || !inputBox) {
    throw new Error("Expected last customer bubble and input row bounding boxes.");
  }

  expect(bubbleBox.y + bubbleBox.height).toBeLessThanOrEqual(inputBox.y + 8);
});

test("simulator catalog shows only 2 B2C clinic scenarios and empty B2B state", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mock", "mock project only");

  await page.goto("/simulator");

  await expect(page.getByTestId("scenario-tile-clinic-appointment")).toBeVisible();
  await expect(page.getByTestId("scenario-tile-clinic-complaint")).toBeVisible();
  await expect(page.getByTestId(/scenario-tile-/)).toHaveCount(2);
  await expect(page.getByText(/кондиционер|кондиционирование|цех|поставщик/i)).toHaveCount(0);

  await page.getByText("B2B", { exact: true }).click();

  await expect(page.getByText("В B2B пока нет доступных сценариев.")).toBeVisible();
  await expect(
    page.getByText("Legacy-сценарии скрыты, новые сценарии появятся позже.")
  ).toBeVisible();
  await expect(page.getByTestId(/scenario-tile-/)).toHaveCount(0);
  await expect(page.getByText("Начать тренировку", { exact: true })).toHaveCount(0);
  await expect(page.getByText(/кондиционер|кондиционирование|цех|поставщик/i)).toHaveCount(0);
});

test("mock mode opens both B2C scenarios with correct first patient line", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "mock", "mock project only");

  await page.goto("/simulator");
  await page.getByTestId("scenario-play-clinic-appointment").click();
  await expect(page.getByText("Я впервые к вам обращаюсь")).toBeVisible();
  await expect(page.getByText("не понимаю, к кому мне вообще надо записаться")).toBeVisible();

  await page.goto("/simulator");
  await page.getByTestId("scenario-play-clinic-complaint").click();
  await expect(page.getByText("Хотела бы оставить жалобу по поводу вчерашнего визита")).toBeVisible();
  await expect(page.getByText("мне никто толком не мог сказать, сколько ещё ждать")).toBeVisible();
});

test("landing legal links and footer company details are visible", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mock", "mock project only");

  await page.goto("/landing");

  const consentText = page.getByText("Нажимая на кнопку, вы даете согласие", { exact: false }).first();
  await expect(consentText).toBeVisible();
  await expect(page.getByText("политикой конфиденциальности", { exact: true }).first()).toBeVisible();
  await expect(
    page.getByText("согласие на обработку персональных данных", { exact: true }).first()
  ).toBeVisible();

  await expect(page.getByText("Общество с ограниченной ответственностью «Цифровая методология»").first()).toBeVisible();
  await expect(page.getByText("ИНН: 5010060840").first()).toBeVisible();
  await expect(page.getByText("КПП: 501001001").first()).toBeVisible();
  await expect(page.getByText("ОГРН: 1235000008275").first()).toBeVisible();
  await expect(page.getByTestId("footer-company-info")).toContainText("Информация о компании");
  await expect(page.getByTestId("footer-company-info")).toContainText("ИНН: 5010060840");
  await expect(page.getByTestId("footer-requisites")).toContainText("ОГРН: 1235000008275");
});

test("legal pages open full text and keep docx access", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mock", "mock project only");

  await page.goto("/legal/privacy-policy.html");
  await expect(page).toHaveURL(/\/legal\/privacy-policy\.html$/);
  await expect(page.getByText("Политика конфиденциальности", { exact: true }).first()).toBeVisible();
  await expect(page.getByText("Вернуться назад")).toBeVisible();

  await page.goto("/legal/personal-data-processing-agreement.html");
  await expect(page).toHaveURL(/\/legal\/personal-data-processing-agreement\.html$/);
  await expect(page.getByText(/обработк[ае] персональных данных/i).first()).toBeVisible();
  await expect(page.getByText("Вернуться назад")).toBeVisible();
});

test("api mode uses backend opening message, backend reply and backend evaluation", async ({
  page
}, testInfo) => {
  test.skip(testInfo.project.name !== "api", "api project only");

  const reportCard = {
    id: "report-api-1",
    title: "Первичная запись пациента 05.05",
    role: "student",
    reportType: "student_progress",
    scenarioId: "clinic-appointment",
    scenarioTitle: "Первичная запись: тревожный пациент с симптомами",
    status: "ready",
    summary: "Backend evaluation summary",
    format: "pdf",
    createdAt: iso,
    updatedAt: "05.05 15:30",
    ownerLabel: "Ученик",
    sourceLabel: "Диалог в чате",
    sessionId: "session-e2e-api-1",
    availableFormats: ["pdf", "csv"],
    previewSections: [
      {
        id: "preview-api-1",
        title: "Краткое резюме",
        lines: [
          "Кейс: Первичная запись: тревожный пациент с симптомами",
          "Общий уровень: Senior",
          "Backend evaluation summary"
        ]
      },
      {
        id: "preview-api-2",
        title: "Компетенции",
        lines: [
          "Умение установить спокойный контакт: Senior — Быстро снижаете тревогу и задаёте безопасную рамку.",
          "Фиксация следующего шага: Middle — Следующий шаг сформулирован, но можно конкретнее."
        ]
      }
    ]
  };

  await page.route("**/api/v1/simulator/sessions", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session_id: "session-e2e-api-1",
        status: "active",
        message: {
          id: "api-open-1",
          role: "customer",
          text: "Здравствуйте. Я впервые к вам обращаюсь. У меня уже несколько дней странное состояние, и я не понимаю, к кому мне записаться.",
          created_at: iso
        }
      })
    });
  });

  await page.route("**/api/v1/simulator/sessions/session-e2e-api-1/messages", async (route) => {
    const requestBody = route.request().postDataJSON() as { text: string };
    expect(typeof requestBody.text).toBe("string");

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session_id: "session-e2e-api-1",
        status: "active",
        rude: "no",
        confidence: 0.95,
        messages: [
          {
            id: "api-learner-1",
            role: "learner",
            text: requestBody.text,
            created_at: iso
          },
          {
            id: "api-customer-2",
            role: "customer",
            text: "Ответ покупателя с backend stub",
            created_at: iso
          }
        ]
      })
    });
  });

  const reportV2 = {
    reportVersion: "2.0",
    case: {
      id: "clinic-appointment",
      title: "Первичная запись: тревожный пациент с симптомами",
      scenarioTitle: "Первичная запись: тревожный пациент с симптомами",
      createdAt: iso
    },
    participant: { role: "student", displayName: "Ученик" },
    summary: {
      title: "Отчет по диалогу: Первичная запись: тревожный пациент с симптомами",
      headline: "Backend evaluation summary",
      overallLevel: "Senior",
      overallScore: 90,
      shortResume: [
        "Кейс: Первичная запись: тревожный пациент с симптомами",
        "Общий уровень: Senior",
        "dialogueAnalysis должен прийти с backend."
      ]
    },
    competencies: [
      {
        id: "calm_contact",
        title: "Умение установить спокойный контакт",
        level: "Senior",
        score: 90,
        comment: "Быстро снижаете тревогу и задаёте безопасную рамку.",
        evidence: [{ quote: "API opening message", speaker: "manager", turnIndex: 1 }]
      },
      {
        id: "symptom_questions_without_diagnosis",
        title: "Умение задавать уточняющие вопросы по симптомам без постановки диагноза",
        level: "Senior",
        score: 90,
        comment: "Задаёте уместные уточняющие вопросы и не уходите в диагноз.",
        evidence: [{ quote: managerText, speaker: "manager", turnIndex: 2 }]
      },
      {
        id: "patient_routing",
        title: "Первичная маршрутизация пациента к подходящему врачу",
        level: "Middle",
        score: 68,
        comment: "Маршрут намечен, но можно чуть яснее объяснить логику.",
        evidence: [{ quote: "Ответ покупателя с backend stub", speaker: "manager", turnIndex: 3 }]
      },
      {
        id: "anxiety_handling",
        title: "Работа с тревогой и сомнениями пациента",
        level: "Senior",
        score: 90,
        comment: "Хорошо удерживаете эмоциональный фон и не обесцениваете тревогу.",
        evidence: [{ quote: "API opening message", speaker: "manager", turnIndex: 4 }]
      },
      {
        id: "next_step",
        title: "Фиксация следующего шага",
        level: "Middle",
        score: 68,
        comment: "Следующий шаг сформулирован, но можно конкретнее.",
        evidence: [{ quote: "Ответ покупателя с backend stub", speaker: "manager", turnIndex: 5 }]
      }
    ],
    dialogueAnalysis: [
      {
        turnIndex: 1,
        speaker: "manager",
        speakerLabel: "Менеджер",
        timestamp: "12:30",
        text: managerText,
        analysis: {
          status: "good",
          comment: "dialogueAnalysis из V2 виден во viewer.",
          recommendation: null,
          competencyIds: ["calm_contact"]
        }
      }
    ],
    strengths: [{ title: "Спокойный контакт", comment: "Снижаете тревогу пациента.", evidence: [managerText] }],
    developmentAreas: [{ title: "Следующий шаг", comment: "Добавьте конкретику по записи.", actions: ["Фиксируйте время визита."] }],
    nextSteps: ["Фиксировать время визита.", "Сохранять мягкий тон."],
    meta: { generatedBy: "AI Sales Academy", source: "dialogue_simulation", language: "ru" }
  };

  await page.route("**/api/v1/simulator/sessions/session-e2e-api-1/finish", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        session_id: "session-e2e-api-1",
        status: "finished",
        evaluation: {
          overall_level: "Senior",
          overall_comment: "Backend evaluation summary",
          overall_recommendations: [
            "Подтвердите критерии выбора до аргументации.",
            "Фиксируйте дату следующего шага."
          ],
          competencies: [
            {
              name: "Умение установить спокойный контакт",
              level: "Senior",
              argument: "Быстро снижаете тревогу и задаёте безопасную рамку.",
              quote: ["API opening message"],
              recommendations: ["Сохраняйте спокойную структуру старта диалога."]
            },
            {
              name: "Фиксация следующего шага",
              level: "Middle",
              argument: "Следующий шаг сформулирован, но можно конкретнее.",
              quote: ["Ответ покупателя с backend stub"],
              recommendations: ["Добавьте дату следующего касания."]
            },
            {
              name: "Умение задавать уточняющие вопросы по симптомам без постановки диагноза",
              level: "Senior",
              argument: "Задаёте уместные уточняющие вопросы и не уходите в диагноз.",
              quote: [managerText],
              recommendations: ["Продолжайте структурировать симптомы и контекст."]
            },
            {
              name: "Первичная маршрутизация пациента к подходящему врачу",
              level: "Middle",
              argument: "Маршрут намечен, но можно чуть яснее объяснить логику.",
              quote: ["Ответ покупателя с backend stub"],
              recommendations: ["Коротко поясняйте, почему выбран именно этот первый шаг."]
            },
            {
              name: "Работа с тревогой и сомнениями пациента",
              level: "Senior",
              argument: "Хорошо удерживаете эмоциональный фон и не обесцениваете тревогу.",
              quote: ["API opening message"],
              recommendations: ["Сохраняйте текущий уровень эмпатии."]
            }
          ]
        },
        report_v2: reportV2
      })
    });
  });

  await page.route("**/api/v1/reports", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON() as { report_v2?: { dialogueAnalysis?: unknown[] } };
      expect(body.report_v2?.dialogueAnalysis?.length).toBeGreaterThan(0);
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ ...reportCard, reportV2 })
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [{ ...reportCard, reportV2 }] })
    });
  });

  await page.addInitScript(() => {
    (window as Window & { __SIMULATOR_API_URL_OVERRIDE__?: string }).__SIMULATOR_API_URL_OVERRIDE__ =
      "/";
  });

  await page.goto("/simulator");
  await page.getByText("Начать тренировку", { exact: true }).click();

  await expect(page.getByText("Я впервые к вам обращаюсь")).toBeVisible();
  await expect(page.getByText("Мы сейчас рассматриваем ваше решение")).toHaveCount(0);

  for (const text of managerMessages) {
    await page.getByTestId("simulator-chat-input").fill(text);
    await page.getByTestId("simulator-send-button").click();
  }

  await expect(page.getByText("Ответ покупателя с backend stub")).toBeVisible();
  await expect(page.getByText(managerMessages[9], { exact: true })).toBeVisible();

  await page.getByText("Завершить и получить отчёт").click();

  await expect(page.getByText("Backend evaluation summary", { exact: true })).toBeVisible();
  await expect(page.getByText("Умение установить спокойный контакт").first()).toBeVisible();
  await expect(page.getByText("Senior").first()).toBeVisible();
  await expect(page.getByText("Анализ диалога")).toBeVisible();
  await expect(page.getByText("dialogueAnalysis из V2 виден во viewer.")).toBeVisible();
  await expect(
    page.getByText("диалог завершен, отчет сформирован по mock-оценке.")
  ).toHaveCount(0);
  await expect(page.getByText(/КП|смета|простой|выезд/)).toHaveCount(0);
});
