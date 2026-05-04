export type UserRole = "student" | "manager" | "hr" | "admin";
export type AccessLevel = "self" | "team" | "department" | "organization";
export type KnowledgeCategoryId =
  | "product"
  | "sales_skills"
  | "scenarios_cases"
  | "learning"
  | "assessment"
  | "feedback";
export type ReportType =
  | "student_progress"
  | "team_performance"
  | "learning_adoption"
  | "competency_dynamics";
export type ReportStatus = "draft" | "generating" | "ready" | "error";
export type ExportFormat = "pdf" | "xlsx" | "csv";
export type ScenarioSpeakerRole = "coach" | "customer" | "learner" | "system";
export type ScenarioStatus = "ready" | "active" | "completed";

export interface AcademyUser {
  id: string;
  fullName: string;
  role: UserRole;
  title: string;
  accessLevel: AccessLevel;
  teamName: string;
  avatarLabel: string;
  focusAreas: string[];
  completionRate: number;
  lastActiveAt: string;
}

export interface KnowledgeMaterial {
  id: string;
  categoryId: KnowledgeCategoryId;
  title: string;
  description: string;
  durationMinutes: number;
  formatLabel: string;
  levelLabel: string;
  tags: string[];
  updatedAt: string;
  shortExplanation: string;
  aiPlainExplanation: string;
  applyInDialogue: string;
  clientAnswerExample: string;
}

export interface KnowledgeSection {
  id: string;
  categoryId: KnowledgeCategoryId;
  title: string;
  description: string;
  materials: KnowledgeMaterial[];
}

export interface CustomerPersona {
  id: string;
  name: string;
  company: string;
  roleTitle: string;
  mood: string;
  painPoints: string[];
  objectionStyle: string;
}

export interface ScenarioMessage {
  id: string;
  speakerName: string;
  speakerRole: ScenarioSpeakerRole;
  text: string;
  timestampLabel: string;
}

export interface Scenario {
  id: string;
  moduleId: string;
  title: string;
  goal: string;
  difficulty: string;
  status: ScenarioStatus;
  channel: string;
  targetCompetencies: string[];
  persona: CustomerPersona;
  openingMessage: string;
  suggestedActions: string[];
  quickReplies: string[];
  customerReplies: string[];
  transcript: ScenarioMessage[];
}

export interface Competency {
  id: string;
  name: string;
  description: string;
  targetLevel: string;
}

export interface SkillScore {
  competencyId: string;
  competencyName: string;
  value: number;
  trend: string;
  benchmarkLabel: string;
}

export interface LearningModule {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  completedPercent: number;
  nextStep: string;
  statusLabel: string;
}

export interface FeedbackItem {
  id: string;
  title: string;
  summary: string;
  tone: "positive" | "warning" | "focus";
  recommendedAction: string;
}

export interface TeamSkillTrend {
  id: string;
  label: string;
  currentValue: number;
  targetValue: number;
}

export interface GroupProgress {
  id: string;
  groupName: string;
  completionRate: number;
  averageScore: number;
  activeSimulations: number;
  riskCount: number;
}

export interface DialogueTranscript {
  id: string;
  learnerName: string;
  scenarioTitle: string;
  updatedAt: string;
  messages: ScenarioMessage[];
}

export interface BestAnswerExample {
  id: string;
  learnerName: string;
  scenarioTitle: string;
  answerText: string;
  whyItWorks: string;
}

export interface TeamRecommendation {
  id: string;
  title: string;
  summary: string;
  suggestedAction: string;
}

export interface DevelopmentTrack {
  id: string;
  title: string;
  summary: string;
  focusCompetencies: string[];
  milestones: string[];
}

export interface StudentLevelSummary {
  currentLevel: string;
  levelDescription: string;
  nextLevel: string;
  progressToNextLevel: number;
}

export interface CompetencyEvaluation {
  id: string;
  label: string;
  value: number;
  summary: string;
}

export interface SimulatorEvaluation {
  overallScore: number;
  competencyScores: CompetencyEvaluation[];
  whatToImprove: string[];
  strongAnswerExample: string;
  recommendations: string[];
}

export interface SimulatorPublicScenarioDto {
  id: string;
  title: string;
  openingMessage: string;
  status: "ready";
}

export interface SimulatorCatalogResponseDto {
  items: SimulatorPublicScenarioDto[];
}

export interface SimulatorApiMessageDto {
  id?: string;
  role: "customer" | "learner";
  text: string;
  created_at: string;
}

export interface AgentDebugStepDto {
  step_id: string;
  ts: string;
  node: string;
  agent: "system" | "safety_agent" | "buyer_agent" | "report_builder";
  status: "started" | "completed" | "error" | "skipped";
  input_summary?: Record<string, unknown> | string | null;
  prompt?: string | null;
  system_prompt?: string | null;
  raw_output?: string | null;
  parsed_output?: Record<string, unknown> | null;
  error?: Record<string, unknown> | string | null;
  metadata: Record<string, unknown>;
}

export interface SimulatorStartSessionResponseDto {
  session_id: string;
  status: "active";
  message: SimulatorApiMessageDto;
}

export interface SimulatorSendMessageResponseDto {
  session_id: string;
  status: "active" | "finished";
  rude: "yes" | "no";
  confidence: number;
  messages: SimulatorApiMessageDto[];
}

export interface SimulatorEvaluationPayloadDto {
  overall_level: "Junior" | "Middle" | "Senior";
  overall_comment: string;
  overall_recommendations: string[];
  competencies: {
    name: string;
    level: "Junior" | "Middle" | "Senior";
    argument: string;
    quote: string[];
    recommendations: string[];
  }[];
}

export interface SimulatorFinishResponseDto {
  session_id: string;
  status: "finished";
  evaluation?: SimulatorEvaluationPayloadDto;
}

export interface TeamMember {
  id: string;
  fullName: string;
  roleTitle: string;
  progressPercent: number;
  latestScore: number;
  focusArea: string;
  riskLabel: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  changeLabel: string;
  tone: "positive" | "neutral" | "warning";
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  dueLabel: string;
  impactLabel: string;
}

export interface ScoreTrendPoint {
  id: string;
  label: string;
  value: number;
}

export interface ScheduledReportRule {
  id: string;
  title: string;
  role: UserRole;
  audience: string;
  frequencyLabel: string;
  format: ExportFormat;
  enabled: boolean;
}

export interface AccessRoleRule {
  id: string;
  role: UserRole;
  accessLevel: AccessLevel;
  permissions: string[];
  exportTargets: ExportFormat[];
}

export interface UserAccessSetting {
  id: string;
  userName: string;
  role: UserRole;
  accessScope: string;
  reportAccessLabel: string;
}

export interface KnowledgeImportStatus {
  id: string;
  title: string;
  materialsCount: number;
  statusLabel: string;
  lastSyncLabel: string;
}

export interface ScenarioAdminItem {
  id: string;
  title: string;
  difficulty: string;
  statusLabel: string;
  ownerLabel: string;
}

export interface ReportPreviewSection {
  id: string;
  title: string;
  lines: string[];
}

export interface StudentDashboard {
  user: AcademyUser;
  level: StudentLevelSummary;
  overallProgressPercent: number;
  nearestPracticeTitle: string;
  nearestPracticeDescription: string;
  metrics: DashboardMetric[];
  modules: LearningModule[];
  scores: SkillScore[];
  feedback: FeedbackItem[];
  developmentTrack: DevelopmentTrack;
  growthPoints: string[];
  aiRecommendations: string[];
  actionItems: ActionItem[];
  history: string[];
  highlightedScenario: Scenario;
}

export interface ManagerDashboard {
  user: AcademyUser;
  metrics: DashboardMetric[];
  teamSummary: GroupProgress;
  skillDynamics: TeamSkillTrend[];
  teamMembers: TeamMember[];
  latestDialogues: DialogueTranscript[];
  bestAnswers: BestAnswerExample[];
  growthPoints: string[];
  recommendations: TeamRecommendation[];
  actionItems: ActionItem[];
  reportCards: ReportCard[];
}

export interface HrDashboard {
  user: AcademyUser;
  metrics: DashboardMetric[];
  groupProgress: GroupProgress[];
  competencies: Competency[];
  scoreDynamics: ScoreTrendPoint[];
  teamRecommendations: TeamRecommendation[];
  riskGroups: string[];
  tracks: DevelopmentTrack[];
  scheduledReports: ScheduledReportRule[];
}

export interface AdminSettingItem {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
}

export interface AdminSettings {
  user: AcademyUser;
  metrics: DashboardMetric[];
  roleRules: AccessRoleRule[];
  userAccessSettings: UserAccessSetting[];
  knowledgeImports: KnowledgeImportStatus[];
  scenarioItems: ScenarioAdminItem[];
  settings: AdminSettingItem[];
  reportRules: ScheduledReportRule[];
  actionItems: ActionItem[];
}

export interface SavedSimulatorReport {
  id: string;
  scenarioTitle: string;
  displayName: string;
  createdAt: string;
  evaluation: SimulatorEvaluationPayloadDto;
}

export interface ReportCard {
  id: string;
  title: string;
  role: UserRole;
  reportType: ReportType;
  scenarioId?: string;
  scenarioTitle?: string;
  status?: ReportStatus;
  summary: string;
  format: ExportFormat;
  createdAt?: string;
  updatedAt: string;
  ownerLabel: string;
  sourceLabel?: string;
  availableFormats: ExportFormat[];
  previewSections: ReportPreviewSection[];
}

export interface RoleWorkspaceOption {
  role: UserRole;
  title: string;
  accessLabel: string;
  summary: string;
  capabilities: string[];
}
