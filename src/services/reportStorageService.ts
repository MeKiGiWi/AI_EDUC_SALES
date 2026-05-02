import { Platform } from "react-native";

import type { SavedSimulatorReport } from "../types/academy";

const STORAGE_KEY = "saved_simulator_reports";

let memoryFallback: SavedSimulatorReport[] = [];

function readAll(): SavedSimulatorReport[] {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw) as SavedSimulatorReport[];
      }
    } catch {
      // corrupted data — reset
    }

    return [];
  }

  return [...memoryFallback];
}

function writeAll(reports: SavedSimulatorReport[]): void {
  if (Platform.OS === "web" && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(reports));
    } catch {
      // storage full — ignore
    }

    return;
  }

  memoryFallback = [...reports];
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
  getAll(): SavedSimulatorReport[] {
    return readAll().sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  },

  save(scenarioTitle: string, evaluation: SavedSimulatorReport["evaluation"]): SavedSimulatorReport {
    const now = new Date();
    const report: SavedSimulatorReport = {
      id: buildUniqueId(),
      scenarioTitle,
      displayName: buildDisplayName(scenarioTitle, now),
      createdAt: now.toISOString(),
      evaluation
    };
    const existing = readAll();
    existing.unshift(report);
    writeAll(existing.slice(0, 50));
    return report;
  },

  clear(): void {
    writeAll([]);
  }
};
