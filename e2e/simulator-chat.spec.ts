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
        }
      })
    });
  });

  await page.route("**/api/v1/reports", async (route) => {
    if (route.request().method() === "POST") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(reportCard)
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ items: [reportCard] })
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
  await expect(page.getByText("Умение установить спокойный контакт: Senior")).toBeVisible();
  await expect(
    page.getByText("диалог завершен, отчет сформирован по mock-оценке.")
  ).toHaveCount(0);
});
