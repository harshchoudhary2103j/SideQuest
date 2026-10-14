import React from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen, ShieldCheck } from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  ProgressBar,
  Avatar,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import type { SubmissionType } from '../types';
import styles from './MissionResultPage.module.css';

export const MissionResultPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { squad, getMissionById } = useSquad();

  const state = location.state as { proofUrl?: string; caption?: string; type?: SubmissionType } | undefined;
  const mission = (missionId ? getMissionById(missionId) : undefined) || getMissionById('snack-heist');

  const latestSub = mission?.squadSubmissions?.[0];
  const proofUrl = state?.proofUrl || latestSub?.mediaUrl;
  const proofCaption = state?.caption || latestSub?.caption;
  const proofType = state?.type || latestSub?.type || 'photo';

  const isMissionCompleted = mission?.status === 'completed' || latestSub?.status === 'approved';
  const isSubmissionRejected = latestSub?.status === 'rejected';

  return (
    <div className={styles.container}>
      <Card variant="featured" padding="lg" className={styles.celebrationCard}>
        {isMissionCompleted ? (
          <Badge variant="lime" size="md" dot icon={<ShieldCheck size={14} />}>
            Mission Completed · Verified
          </Badge>
        ) : isSubmissionRejected ? (
          <Badge variant="error" size="md" dot icon={<ShieldCheck size={14} />}>
            Proof Rejected · Resubmission Needed
          </Badge>
        ) : (
          <Badge variant="purple" size="md" dot icon={<ShieldCheck size={14} />}>
            Proof Submitted · Awaiting Review
          </Badge>
        )}

        <div className={styles.mascotWrap}>
          <MascotDisplay
            expression={isMissionCompleted ? 'proud' : isSubmissionRejected ? 'sleepy' : (mission?.resultExpression || 'excited')}
            evolutionLevel={squad.evolutionLevel}
            size="large"
            animation="celebrate"
            speechBubble={
              isMissionCompleted
                ? "Mission approved! Vault XP banked! ⚡"
                : isSubmissionRejected
                ? "Teammates requested a new photo/video! 🔍"
                : "Proof safely locked in our squad vault! 🔒"
            }
            showStageBadge
          />
        </div>

        <div>
          <h1 className={styles.resultTitle}>
            {isMissionCompleted ? 'Mission Verified!' : isSubmissionRejected ? 'Changes Requested' : 'Proof Dispatched!'}
          </h1>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            {mission?.title || 'Daily Squad Mission'} · {isMissionCompleted ? 'Authoritative XP Awarded' : isSubmissionRejected ? 'Resubmission Eligible' : 'Awaiting Squad Review'}
          </p>
        </div>

        {/* Display Verified Submitted Proof */}
        {proofUrl && (
          <div className={styles.proofCard}>
            <span className={styles.proofCardTitle}>Submitted Mission Proof</span>
            {proofType === 'video' ? (
              <video src={proofUrl} controls className={styles.proofMedia} />
            ) : (
              <img src={proofUrl} alt="Submitted mission proof" className={styles.proofMedia} />
            )}
            {proofCaption && <p className={styles.proofCaption}>“{proofCaption}”</p>}
          </div>
        )}

        <div className={styles.xpBadgeLarge}>
          <Sparkles size={20} color={isMissionCompleted ? "#D4FF38" : "#8A94A6"} />
          <span>
            +{mission?.xpReward || 100} XP {isMissionCompleted ? '(Awarded to Squad)' : isSubmissionRejected ? '(Not Awarded)' : '(Pending Review)'}
          </span>
        </div>

        <div style={{ width: '100%', maxWidth: '380px' }}>
          <ProgressBar
            value={squad.currentXp}
            max={squad.targetXp}
            label={`Current Squad Vault: ${squad.currentXp} / ${squad.targetXp} XP`}
            showValue
            variant="gradient"
            size="md"
          />
        </div>

        {/* Questy Vault Commentary */}
        <div className={styles.commentaryBox}>
          <div className={styles.commentaryHeader}>
            <Sparkles size={14} />
            <span>Vault Status Note</span>
          </div>
          <p className={styles.commentaryText}>
            {isMissionCompleted
              ? `Assignment #${mission?.assignmentId?.slice(0, 8) || 'active'} is verified and marked complete. Authoritative XP has been added to squad progression.`
              : isSubmissionRejected
              ? `Submission was rejected: "${latestSub?.rejectionReason || 'Please resubmit clearer proof'}". You can submit a new attempt.`
              : `Proof stored under assignment #${mission?.assignmentId?.slice(0, 8) || 'active'}. XP will be credited once your squad verifies this submission!`}
          </p>
        </div>

        {/* Mock Squad Reactions */}
        <div className={styles.reactionsSection}>
          <h3 className="text-section-title">Squad Teammate Reactions</h3>
          <div className={styles.reactionsList}>
            <div className={styles.reactionItem}>
              <Avatar name="Ria Sen" size="sm" status="online" ring="purple" />
              <div className={styles.reactionText}>
                <strong>Ria:</strong> “Bro where did you even find that 😭”
              </div>
            </div>
            <div className={styles.reactionItem}>
              <Avatar name="Kavya Patel" size="sm" status="online" ring="gold" />
              <div className={styles.reactionText}>
                <strong>Kavya:</strong> “Adding this straight to the Lore Vault!”
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className={styles.actionRow}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight size={18} />}
            onClick={() => navigate('/app/squad')}
          >
            Return to Squad Base
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<BookOpen size={18} />}
            onClick={() => navigate('/app/missions')}
          >
            View Squad Missions
          </Button>
        </div>
      </Card>
    </div>
  );
};
