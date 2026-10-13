import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';
import {
  Card,
  Button,
  Badge,
  ProgressBar,
  Avatar,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import styles from './MissionResultPage.module.css';

export const MissionResultPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { squad, getMissionById } = useSquad();

  const mission = getMissionById(missionId || 'snack-heist') || getMissionById('snack-heist');

  return (
    <div className={styles.container}>
      <Card variant="featured" padding="lg" className={styles.celebrationCard}>
        <Badge variant="lime" size="md" dot>
          Mission Accomplished
        </Badge>

        <div className={styles.mascotWrap}>
          <MascotDisplay
            expression={mission?.resultExpression || 'excited'}
            evolutionLevel={squad.evolutionLevel}
            size="large"
            animation="celebrate"
            speechBubble="Legendary proof! +100 XP! 🚀"
            showStageBadge
          />
        </div>

        <div>
          <h1 className={styles.resultTitle}>Quest Crushed!</h1>
          <p className="text-secondary" style={{ marginTop: '4px' }}>
            {mission?.title || 'Daily Squad Mission'}
          </p>
        </div>

        <div className={styles.xpBadgeLarge}>
          <Sparkles size={20} color="#D4FF38" />
          <span>+{mission?.xpReward || 100} Squad XP</span>
        </div>

        <div style={{ width: '100%', maxWidth: '380px' }}>
          <ProgressBar
            value={squad.currentXp}
            max={squad.targetXp}
            label={`Squad Progress: ${squad.currentXp} / ${squad.targetXp} XP`}
            showValue
            variant="gradient"
            size="md"
            animated
          />
        </div>

        {/* Questy AI Evaluation Commentary */}
        <div className={styles.commentaryBox}>
          <div className={styles.commentaryHeader}>
            <Sparkles size={14} />
            <span>Questy Evaluation Note</span>
          </div>
          <p className={styles.commentaryText}>
            {mission?.resultReaction || '“Iconic find! That counted as pure unhinged squad fuel.”'}
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
            onClick={() => navigate('/app/lore')}
          >
            View in Squad Lore Vault
          </Button>
        </div>
      </Card>
    </div>
  );
};
