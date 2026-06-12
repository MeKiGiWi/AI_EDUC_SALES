import {
  buildInitialMockDialogue,
  buildMockCustomerFollowUp,
  buildOptimisticManagerMessage,
  calculateDialogueProgress,
  countManagerReplies,
  getVisibleManagerReplyLabel,
  mapApiMessageToDialogueMessage,
  mergeApiMessages
} from "../src/services/simulatorDialogueService";
import { salesAcademyMock } from "../src/data/salesAcademyMock";
import type { DialogueMessage, SimulatorApiMessageDto } from "../src/types/academy";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const iso = "2026-05-05T12:30:00.000Z";

const apiCustomer = mapApiMessageToDialogueMessage({
  id: "api-customer-1",
  role: "customer",
  text: "Сообщение покупателя",
  created_at: iso
});
const apiLearner = mapApiMessageToDialogueMessage({
  id: "api-learner-1",
  role: "learner",
  text: "Сообщение менеджера",
  created_at: iso
});

assert(apiCustomer.author === "customer", "customer dto must map to customer author");
assert(apiLearner.author === "manager", "learner dto must map to manager author");

const optimistic = buildOptimisticManagerMessage("Уточним критерии выбора.");
const beforeMerge: DialogueMessage[] = [
  {
    id: "msg-customer-1",
    author: "customer",
    text: "Стартовое сообщение",
    time: "12:29"
  },
  optimistic
];
const merged = mergeApiMessages(
  beforeMerge,
  [
    {
      id: "api-learner-1",
      role: "learner",
      text: "Уточним критерии выбора.",
      created_at: iso
    },
    {
      id: "api-customer-2",
      role: "customer",
      text: "Ответ покупателя",
      created_at: iso
    }
  ],
  optimistic.id
);

assert(merged.length === 3, "optimistic message should be replaced, not duplicated");
assert(countManagerReplies(merged) === 1, "manager reply count must be derived from messages");

const overflowProgress = calculateDialogueProgress(
  new Array(15).fill(null).map((_, index) => ({
    id: `msg-${index}`,
    author: "manager" as const,
    text: `manager-${index}`,
    time: "12:30"
  })),
  10
);
assert(overflowProgress === 100, "progress must clamp to 100%");

const messagesWith11ManagerReplies: DialogueMessage[] = new Array(11).fill(null).map((_, index) => ({
  id: `manager-${index}`,
  author: "manager",
  text: `manager reply ${index + 1}`,
  time: "12:30"
}));
assert(
  getVisibleManagerReplyLabel(messagesWith11ManagerReplies, 10) === "11 / 10",
  "visible manager reply label must show the real count above the minimum threshold"
);

const mockInitial = buildInitialMockDialogue({
  scenarioId: "cold-call",
  scenarioTitle: "Холодный звонок"
});
assert(mockInitial.length === 1, "mock dialogue must start with one customer opening message");
assert(mockInitial[0]?.author === "customer", "mock dialogue must start from customer");

const mockManager = buildOptimisticManagerMessage("Добрый день, давайте уточним критерии выбора.");
const mockReply = buildMockCustomerFollowUp(
  salesAcademyMock.scenarios[0],
  mockManager.text,
  countManagerReplies([mockManager])
);
const mockFlowMessages = [...mockInitial, mockManager, {
  id: "mock-customer-2",
  author: "customer" as const,
  text: mockReply,
  time: "12:31"
}];

assert(mockFlowMessages[1]?.author === "manager", "mock flow must append manager message second");
assert(mockFlowMessages[2]?.author === "customer", "mock flow must append customer reply third");
assert(mockFlowMessages[2]?.text.length > 0, "mock customer follow-up must be non-empty");

const fallbackIdMessage = mapApiMessageToDialogueMessage({
  role: "customer",
  text: "Без id",
  created_at: iso
} satisfies SimulatorApiMessageDto);
assert(fallbackIdMessage.id.length > 0, "fallback id must be generated when backend id is missing");

const sameText = "Повторяю дословно";
const sameTextMerged = mergeApiMessages(
  [
    {
      id: "optimistic-copy",
      author: "manager",
      text: sameText,
      time: "12:32"
    }
  ],
  [
    {
      id: "api-learner-copy",
      role: "learner",
      text: sameText,
      created_at: iso
    },
    {
      id: "api-customer-copy",
      role: "customer",
      text: sameText,
      created_at: iso
    }
  ],
  "optimistic-copy"
);
assert(sameTextMerged.length === 2, "same text with different authors must stay as two bubbles");
assert(
  sameTextMerged.filter((message) => message.text === sameText).map((message) => message.author).join(",") ===
    "manager,customer",
  "merge must preserve manager/customer role mapping even when text is identical"
);
assert(countManagerReplies(sameTextMerged) === 1, "countManagerReplies must count only learner/manager messages");

console.log("simulator-dialogue-flow-check: ok");
