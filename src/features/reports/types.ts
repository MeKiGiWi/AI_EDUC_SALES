export type ReportLevel = "Trainee" | "Junior" | "Middle" | "Senior";
export type DialogueSpeaker = "manager" | "client" | "assistant" | "system";
export type DialogueAnalysisStatus = "good" | "neutral" | "needs_improvement" | "critical";

export interface ReportCase {
  id: string;
  title: string;
  scenarioTitle: string;
  createdAt: string;
}

export interface ReportParticipant {
  role: string;
  displayName: string;
}

export interface ReportSummary {
  title: string;
  headline: string;
  overallLevel: ReportLevel;
  overallScore: number;
  shortResume: string[];
}

export interface EvidenceQuote {
  quote: string;
  speaker: DialogueSpeaker;
  turnIndex: number;
}

export interface CompetencyAssessment {
  id: string;
  title: string;
  level: ReportLevel;
  score: number;
  comment: string;
  evidence: EvidenceQuote[];
}

export interface TurnAnalysis {
  status: DialogueAnalysisStatus;
  comment: string;
  recommendation?: string | null;
  competencyIds: string[];
}

export interface DialogueTurnAnalysis {
  turnIndex: number;
  speaker: DialogueSpeaker;
  speakerLabel: string;
  timestamp?: string | null;
  text: string;
  analysis: TurnAnalysis;
}

export interface ReportStrength {
  title: string;
  comment: string;
  evidence: string[];
}

export interface ReportDevelopmentArea {
  title: string;
  comment: string;
  actions: string[];
}

export interface ReportMeta {
  generatedBy: string;
  source: string;
  language: string;
  fallback?: boolean;
}

export interface SalesDialogueReportV2 {
  reportVersion: "2.0";
  case: ReportCase;
  participant?: ReportParticipant;
  summary: ReportSummary;
  competencies: CompetencyAssessment[];
  dialogueAnalysis: DialogueTurnAnalysis[];
  strengths: ReportStrength[];
  developmentAreas: ReportDevelopmentArea[];
  nextSteps?: string[];
  meta: ReportMeta;
}
