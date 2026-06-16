import test from "node:test";
import assert from "node:assert/strict";

import { mapApiMessageToDialogueMessage } from "./simulatorDialogueService";
import { SimulatorApiError } from "./simulatorApiService";

test("mapApiMessageToDialogueMessage rejects empty text", () => {
  assert.throws(
    () =>
      mapApiMessageToDialogueMessage({
        role: "customer",
        text: " \n ",
        created_at: new Date().toISOString()
      }),
    (error: unknown) =>
      error instanceof SimulatorApiError &&
      error.message === "Backend вернул пустой ответ клиента"
  );
});
