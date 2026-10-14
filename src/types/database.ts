/**
 * SideQuest Database Types
 * Reflects PostgreSQL schema defined in supabase/migrations/
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type SquadRole = 'owner' | 'admin' | 'member';
export type MissionCategory = 'exploration' | 'creative' | 'social' | 'chaos';
export type MissionDifficulty = 'easy' | 'medium' | 'hard';
export type MissionDefinitionStatus = 'active' | 'inactive' | 'archived';
export type AssignmentStatus = 'available' | 'in_progress' | 'completed' | 'expired';
export type ProofType = 'photo' | 'video' | 'voice' | 'text';
export type SubmissionStatus = 'submitted' | 'approved' | 'rejected' | 'flagged';
export type LoreEventType =
  | 'mission_completed'
  | 'milestone_unlocked'
  | 'chaos_moment'
  | 'mascot_evolution'
  | 'streak_milestone';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string;
          avatar_path: string | null;
          aura: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name: string;
          avatar_path?: string | null;
          aura?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string;
          avatar_path?: string | null;
          aura?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      squads: {
        Row: {
          id: string;
          name: string;
          motto: string | null;
          invite_code: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          motto?: string | null;
          invite_code: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          motto?: string | null;
          invite_code?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      squad_memberships: {
        Row: {
          id: string;
          squad_id: string;
          user_id: string;
          role: SquadRole;
          joined_at: string;
        };
        Insert: {
          id?: string;
          squad_id: string;
          user_id: string;
          role?: SquadRole;
          joined_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string;
          user_id?: string;
          role?: SquadRole;
          joined_at?: string;
        };
        Relationships: [];
      };
      squad_progression: {
        Row: {
          squad_id: string;
          xp: number;
          level: number;
          current_evolution_stage: number;
          streak_days: number;
          updated_at: string;
        };
        Insert: {
          squad_id: string;
          xp?: number;
          level?: number;
          current_evolution_stage?: number;
          streak_days?: number;
          updated_at?: string;
        };
        Update: {
          squad_id?: string;
          xp?: number;
          level?: number;
          current_evolution_stage?: number;
          streak_days?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_definitions: {
        Row: {
          id: string;
          title: string;
          description: string;
          category: MissionCategory;
          difficulty: MissionDifficulty;
          xp_reward: number;
          proof_type: ProofType[];
          rules: string[];
          submission_requirements: string[];
          status: MissionDefinitionStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          category: MissionCategory;
          difficulty: MissionDifficulty;
          xp_reward: number;
          proof_type?: ProofType[];
          rules?: string[];
          submission_requirements?: string[];
          status?: MissionDefinitionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          category?: MissionCategory;
          difficulty?: MissionDifficulty;
          xp_reward?: number;
          proof_type?: ProofType[];
          rules?: string[];
          submission_requirements?: string[];
          status?: MissionDefinitionStatus;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      mission_assignments: {
        Row: {
          id: string;
          squad_id: string;
          mission_id: string;
          starts_at: string;
          expires_at: string | null;
          status: AssignmentStatus;
          created_at: string;
        };
        Insert: {
          id?: string;
          squad_id: string;
          mission_id: string;
          starts_at?: string;
          expires_at?: string | null;
          status?: AssignmentStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string;
          mission_id?: string;
          starts_at?: string;
          expires_at?: string | null;
          status?: AssignmentStatus;
          created_at?: string;
        };
        Relationships: [];
      };
      mission_submissions: {
        Row: {
          id: string;
          assignment_id: string;
          squad_id: string;
          submitted_by: string;
          proof_type: ProofType;
          proof_storage_path: string | null;
          text_content: string | null;
          status: SubmissionStatus;
          submitted_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          squad_id: string;
          submitted_by: string;
          proof_type: ProofType;
          proof_storage_path?: string | null;
          text_content?: string | null;
          status?: SubmissionStatus;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          squad_id?: string;
          submitted_by?: string;
          proof_type?: ProofType;
          proof_storage_path?: string | null;
          text_content?: string | null;
          status?: SubmissionStatus;
          submitted_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [];
      };
      squad_lore: {
        Row: {
          id: string;
          squad_id: string;
          created_by: string | null;
          event_type: LoreEventType;
          title: string;
          content: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          squad_id: string;
          created_by?: string | null;
          event_type: LoreEventType;
          title: string;
          content?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          squad_id?: string;
          created_by?: string | null;
          event_type?: LoreEventType;
          title?: string;
          content?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_squad_member: {
        Args: {
          check_squad_id: string;
          check_user_id: string;
        };
        Returns: boolean;
      };
      get_squad_role: {
        Args: {
          check_squad_id: string;
          check_user_id: string;
        };
        Returns: string | null;
      };
      join_squad_with_code: {
        Args: {
          code: string;
        };
        Returns: string;
      };
    };
    Enums: {
      squad_role: SquadRole;
      mission_category: MissionCategory;
      mission_difficulty: MissionDifficulty;
      mission_definition_status: MissionDefinitionStatus;
      assignment_status: AssignmentStatus;
      proof_type: ProofType;
      submission_status: SubmissionStatus;
      lore_event_type: LoreEventType;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
