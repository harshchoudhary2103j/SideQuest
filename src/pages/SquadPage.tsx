import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Flame, Heart, Copy, UserPlus, Clock, Camera } from 'lucide-react';
import {
  PageHeading,
  Card,
  CardFooter,
  Button,
  Badge,
  Avatar,
  ProgressBar,
  Modal,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import type { MascotAnimation, MascotExpression } from '../types/mascot';
import styles from './SquadPage.module.css';

export const SquadPage: React.FC = () => {
  const navigate = useNavigate();
  const { squad, missions, activity, petQuesty } = useSquad();
  const { showToast } = useToast();

  const [mascotAnim, setMascotAnim] = useState<MascotAnimation>('idle');
  const [mascotExpr, setMascotExpr] = useState<MascotExpression>('excited');
  const [heartsCount, setHeartsCount] = useState(42);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Active mission
  const activeMission = missions.find((m) => m.id === 'snack-heist') || missions[0];

  const handlePetQuesty = () => {
    setMascotAnim('celebrate');
    setMascotExpr('happy');
    setHeartsCount((prev) => prev + 1);
    petQuesty();

    showToast({
      type: 'success',
      title: 'Questy is thrilled! ✨',
      message: 'Questy loves squad headpats. +5 Morale XP added!',
    });

    setTimeout(() => {
      setMascotAnim('idle');
      setMascotExpr('excited');
    }, 2000);
  };

  const handleCopyInviteCode = () => {
    navigator.clipboard?.writeText(squad.inviteCode);
    showToast({
      type: 'success',
      title: 'Demo Invite Code Copied! 📋',
      message: `Code: ${squad.inviteCode} copied to clipboard. Share with your friend group!`,
    });
    setIsInviteModalOpen(false);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeading
        title={squad.name}
        subtitle={`Level ${squad.level} Squad • ${squad.members.length} Members Active`}
        badge={
          <Badge variant="lime" size="sm" icon={<Flame size={12} />}>
            {squad.streakDays} Day Streak
          </Badge>
        }
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className={styles.avatarGroup}>
              {squad.members.map((m) => (
                <Avatar
                  key={m.id}
                  name={m.name}
                  size="sm"
                  status={m.status}
                  ring={m.avatarRing}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<UserPlus size={14} />}
              onClick={() => setIsInviteModalOpen(true)}
            >
              Invite
            </Button>
          </div>
        }
      />

      {/* 1. Today's Action Hero Card (Highest Priority) */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Today’s Quest</h2>
          <Badge variant="lime" size="sm">Action Required</Badge>
        </div>

        <Card
          variant="interactive"
          padding="lg"
          onClick={() => navigate(`/app/missions/${activeMission.id}`)}
          className={styles.todaysActionCard}
        >
          <div className={styles.missionTopRow}>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <Badge variant="gold" size="sm">Daily Quest</Badge>
              <Badge variant="purple" size="sm">{activeMission.difficulty.toUpperCase()}</Badge>
            </div>
            <span className={styles.xpTag}>+{activeMission.xpReward} XP</span>
          </div>

          <div>
            <h3 className={styles.missionBigTitle}>{activeMission.title}</h3>
            <p className={styles.missionShortDesc}>{activeMission.description}</p>
          </div>

          <div className={styles.proofStatusRow}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Clock size={16} color="#A4ABC4" />
              <span className={styles.timeLeft}>{activeMission.deadlineText}</span>
            </div>
            <span className={styles.proofText}>
              {activeMission.squadSubmissions.length} of {squad.members.length} submitted
            </span>
          </div>

          <CardFooter style={{ marginTop: '8px', paddingBottom: 0 }}>
            <span className="text-caption">Click to view rules & drop photo proof</span>
            <Button
              variant="primary"
              size="md"
              leftIcon={<Camera size={16} />}
              rightIcon={<ArrowRight size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/app/missions/${activeMission.id}`);
              }}
            >
              Start Mission
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* 2. Shared Mascot Showcase & Squad Progress Card */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Squad Companion</h2>
          <Badge variant="purple" size="sm">Questy</Badge>
        </div>

        <Card variant="featured" padding="lg" className={styles.mascotCard}>
          <div className={styles.mascotCenter}>
            <MascotDisplay
              expression={mascotExpr}
              evolutionLevel={squad.evolutionLevel}
              size="large"
              animation={mascotAnim}
              speechBubble={activeMission.briefingSpeech}
              showStageBadge
            />
          </div>

          <div className={styles.xpSection}>
            <ProgressBar
              value={squad.currentXp}
              max={squad.targetXp}
              label={`Squad XP: ${squad.currentXp} / ${squad.targetXp} XP`}
              showValue
              variant="gradient"
              size="md"
              animated
            />
          </div>

          <div className={styles.mascotActions}>
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Heart size={16} color="#F04F9D" />}
              onClick={handlePetQuesty}
            >
              Pet Questy ({heartsCount})
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Sparkles size={16} color="#D4FF38" />}
              onClick={() => navigate('/app/profile')}
            >
              Evolution Vault
            </Button>
          </div>
        </Card>
      </section>

      {/* 3. Recent Squad Activity Stream */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Live Squad Activity</h2>
          <span className="text-caption">Private feed</span>
        </div>

        <Card variant="standard" padding="md">
          <div className={styles.activityFeed}>
            {activity.slice(0, 4).map((act) => (
              <div key={act.id} className={styles.activityItem}>
                <Avatar name={act.memberName} size="sm" ring="none" />
                <div className={styles.actInfo}>
                  <p className={styles.actContent}>
                    <strong>{act.memberName}</strong> {act.content}
                  </p>
                  <span className={styles.actTime}>{act.timeAgo}</span>
                </div>
                {act.xpEarned && (
                  <Badge variant="gold" size="sm">+{act.xpEarned} XP</Badge>
                )}
              </div>
            ))}
          </div>
        </Card>
      </section>

      {/* 4. Squad Lore Highlights Teaser */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Latest Squad Lore</h2>
          <span className={styles.viewAllLink} onClick={() => navigate('/app/lore')}>
            Vault Archive →
          </span>
        </div>

        <Card variant="standard" padding="md" onClick={() => navigate('/app/lore')} style={{ cursor: 'pointer' }}>
          <div className={styles.loreSnippet}>
            <span className={styles.loreEmoji}>🥟</span>
            <div className={styles.loreInfo}>
              <h4 className={styles.loreTitle}>The 2 AM Paratha Expedition</h4>
              <p className={styles.loreQuote}>“Another iconic memory for the books! 💜” — Questy</p>
            </div>
            <ArrowRight size={18} color="#A4ABC4" />
          </div>
        </Card>
      </section>

      {/* Invite Squad Mates Modal */}
      <Modal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        title="Invite Squad Mates"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', textAlign: 'left' }}>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Share this demo invite code with up to 5 friends to unlock shared quests and evolutions together.
          </p>

          <div className={styles.inviteCodeDisplay}>
            <span className={styles.codeText}>{squad.inviteCode}</span>
            <Badge variant="gold" size="sm">Active Code</Badge>
          </div>

          <Button
            variant="primary"
            size="md"
            fullWidth
            leftIcon={<Copy size={16} />}
            onClick={handleCopyInviteCode}
          >
            Copy Invite Code
          </Button>
        </div>
      </Modal>
    </div>
  );
};
