import React from "react";

import type { ReportStatus } from "../../types/academy";
import { StatusPill } from "../ui/StatusPill";

interface ReportStatusBadgeProps {
  status?: ReportStatus;
}

const statusLabel: Record<ReportStatus, string> = {
  draft: "Черновик",
  generating: "Формируется",
  ready: "Готов",
  error: "Ошибка"
};

export function ReportStatusBadge({ status = "ready" }: ReportStatusBadgeProps) {
  const tone = status === "ready" ? "success" : status === "error" ? "danger" : "warning";

  return <StatusPill label={statusLabel[status]} tone={tone} />;
}
