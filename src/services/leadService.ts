const backendApiUrl = process.env.EXPO_PUBLIC_SIMULATOR_API_URL?.trim() ?? "";

function getRuntimeApiUrl(): string {
  const runtimeOverride =
    typeof globalThis === "object" &&
    globalThis &&
    "__SIMULATOR_API_URL_OVERRIDE__" in globalThis &&
    typeof (globalThis as { __SIMULATOR_API_URL_OVERRIDE__?: unknown }).__SIMULATOR_API_URL_OVERRIDE__ ===
      "string"
      ? (globalThis as { __SIMULATOR_API_URL_OVERRIDE__?: string }).__SIMULATOR_API_URL_OVERRIDE__
      : "";

  return runtimeOverride?.trim() || backendApiUrl;
}

function buildUrl(path: string): string {
  const base = getRuntimeApiUrl().trim();
  if (!base) {
    return path;
  }

  const cleanBase = base.endsWith("/") ? base.slice(0, -1) : base;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanBase}${cleanPath}`;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const hasBody = init?.body !== undefined;
  const response = await fetch(buildUrl(path), {
    ...init,
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    const rawBody = await response.text();
    let detailMessage = rawBody || "Не удалось отправить заявку.";

    if (rawBody) {
      try {
        const parsed = JSON.parse(rawBody) as { detail?: unknown };
        if (typeof parsed.detail === "string") {
          detailMessage = parsed.detail;
        }
      } catch {
        // Оставляем исходный текст, если тело не JSON.
      }
    }

    throw new Error(detailMessage);
  }

  return (await response.json()) as T;
}

export interface AuditLeadInput {
  name: string;
  clinic?: string | null;
  contact: string;
  comment?: string | null;
  source?: string;
  payload?: Record<string, unknown> | null;
}

export interface AuditLeadDto {
  id: string;
  name: string;
  clinic: string | null;
  contact: string;
  comment: string | null;
  source: string;
  status: string;
  payload: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export const leadService = {
  isEnabled(): boolean {
    return getRuntimeApiUrl().length > 0;
  },

  async submitAuditLead(input: AuditLeadInput): Promise<AuditLeadDto> {
    return requestJson<AuditLeadDto>("/api/v1/audit-leads", {
      method: "POST",
      body: JSON.stringify({
        name: input.name,
        clinic: input.clinic ?? null,
        contact: input.contact,
        comment: input.comment ?? null,
        source: input.source ?? "landing_audit_form",
        payload: input.payload ?? null
      })
    });
  }
};
