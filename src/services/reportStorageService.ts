import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { SavedSimulatorReport, UserRole } from "../types/academy";

const STORAGE_KEY_PREFIX = "saved_simulator_reports:";

function getRoleKey(role: UserRole): string {
  return `${STORAGE_KEY_PREFIX}${role}`;
}

let memoryFallback: Record<string, SavedSimulatorReport[]> = {};

async function readAll(role: UserRole): Promise<SavedSimulatorReport[]> {
  if (Platform.OS === "web") {
    if (typeof localStorage !== "undefined") {
      try {
        const raw = localStorage.getItem(getRoleKey(role));
        if (raw) {
          return JSON.parse(raw) as SavedSimulatorReport[];
        }
      } catch (error) {
        console.warn("[reports] localStorage read failed, using memory fallback", error);
      }
    }
    return memoryFallback[role] ? [...memoryFallback[role]] : [];
  }

  try {
    const raw = await AsyncStorage.getItem(getRoleKey(role));
    if (raw) {
      return JSON.parse(raw) as SavedSimulatorReport[];
    }
  } catch (error) {
    console.warn("[reports] AsyncStorage read failed, using memory fallback", error);
  }

  return memoryFallback[role] ? [...memoryFallback[role]] : [];
}

async function writeAll(role: UserRole, reports: SavedSimulatorReport[]): Promise<void> {
  memoryFallback[role] = [...reports];

  if (Platform.OS === "web") {
    if (typeof localStorage === "undefined") {
      console.warn("[reports] localStorage is unavailable, using memory fallback");
      return;
    }

    try {
      localStorage.setItem(getRoleKey(role), JSON.stringify(reports));
    } catch (error) {
      console.warn("[reports] localStorage write failed, using memory fallback", error);
    }
    return;
  }

  try {
    await AsyncStorage.setItem(getRoleKey(role), JSON.stringify(reports));
  } catch (error) {
    console.warn("[reports] AsyncStorage write failed, using memory fallback", error);
  }
}

function buildDisplayName(scenarioTitle: string, date: Date): string {
  const day = `${date.getDate()}`.padStart(2, "0");
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${scenarioTitle} ${day}.${month}`;
}

function buildUniqueId(): string {
  return `report-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const reportStorageService = {
  async getAll(role: UserRole): Promise<SavedSimulatorReport[]> {
    const all = await readAll(role);
    return all.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  async save(params: {
    role: UserRole;
    scenarioId?: string | null;
    scenarioTitle: string;
    sourceLabel?: string | null;
    sessionId?: string | null;
    evaluation: SavedSimulatorReport["evaluation"];
  }): Promise<SavedSimulatorReport> {
    const now = new Date();
    const report: SavedSimulatorReport = {
      id: buildUniqueId(),
      scenarioId: params.scenarioId ?? undefined,
      scenarioTitle: params.scenarioTitle,
      displayName: buildDisplayName(params.scenarioTitle, now),
      createdAt: now.toISOString(),
      sourceLabel: params.sourceLabel ?? undefined,
      sessionId: params.sessionId ?? undefined,
      evaluation: params.evaluation
    };
    const existing = await readAll(params.role);
    existing.unshift(report);
    await writeAll(params.role, existing.slice(0, 50));
    return report;
  },

  async clear(role: UserRole): Promise<void> {
    await writeAll(role, []);
  }
};
