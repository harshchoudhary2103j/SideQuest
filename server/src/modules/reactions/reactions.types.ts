export type QuestyEventType = 'mission_approved' | 'level_up' | 'mascot_evolved';

export type MascotExpression =
  | 'happy'
  | 'excited'
  | 'mischievous'
  | 'surprised'
  | 'sleepy'
  | 'proud'
  | 'sad'
  | 'angry';

export interface QuestyReactionRequest {
  eventType?: QuestyEventType;
}

export interface AuthoritativeEventContext {
  submissionId: string;
  assignmentId: string;
  squadId: string;
  submitterName: string;
  reviewerName: string;
  missionTitle: string;
  missionCategory: string;
  missionDifficulty: string;
  xpAwarded: number;
  newLevel: number;
  newEvolutionStage: number;
  stageName: string;
  eventType: QuestyEventType;
}

export interface QuestyReactionResponse {
  success: boolean;
  reaction: string;
  expression: MascotExpression;
  source: 'ai' | 'fallback';
  eventType: QuestyEventType;
  cached?: boolean;
}
