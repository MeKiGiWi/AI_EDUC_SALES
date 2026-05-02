import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type { SavedSimulatorReport, UserRole } from "../types/academy";

const STORAGE_KEY_PREFIX = "saved_simulator_reports:";

function getRoleKey(role: UserRole): string {
  return `${STORAGE_KEY_PREFIX}${role}`;
}

let memoryFallback: Record<string, SavedSimulatorReport[]> = {};

async function readAll(role: UserRole): Promise<SavedSimulatorReport[]> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(getRoleKey(role));
      if (raw) {
        return JSON.parse(raw) as SavedSimulatorReport[];
      }
    } catch {
      // corrupted data — reset
    }
    return [];
  } else {
    try {
      const raw = await AsyncStorage.getItem(getRoleKey(role));
      if (raw) {
        return JSON.parse(raw) as SavedSimulatorReport[];
      }
    } catch {
      // ignore
    }
  }

  return memoryFallback[role] ? [...memoryFallback[role]] : [];
}

async function writeAll(role: UserRole, reports: SavedSimulatorReport[]): Promise<void> {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(getRoleKey(role), JSON.stringify(reports));
    } catch {
      // storage full — ignore
    }
    return;
  } else {
    try {
      await AsyncStorage.setItem(getRoleKey(role), JSON.stringify(reports));
    } catch {
      // ignore
    }
  }

  memoryFallback[role] = [...reports];
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

  async save(role: UserRole, scenarioTitle: string, evaluation: SavedSimulatorReport["evaluation"]): Promise<SavedSimulatorReport> {
    const now = new Date();
    const report: SavedSimulatorReport = {
      id: buildUniqueId(),
      scenarioTitle,
      displayName: buildDisplayName(scenarioTitle, now),
      createdAt: now.toISOString(),
      evaluation
    };
    const existing = await readAll(role);
    existing.unshift(report);
    await writeAll(role, existing.slice(0, 50));
    return report;
  },

  async clear(role: UserRole): Promise<void> {
    await writeAll(role, []);
  }
};
