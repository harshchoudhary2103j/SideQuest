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
import { useSquad, useAuth } from '../context';
import type { MascotAnimation, MascotExpression } from '../types/mascot';
import styles from './SquadPage.module.css';

export const SquadPage: React.FC = () => {
  const navigate = useNavigate();
  const { squad, missions, activity, petQuesty, hasSquad, isLoadingSquad } = useSquad();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mascotAnim, setMascotAnim] = useState<MascotAnimation>('idle');
  const [mascotExpr, setMascotExpr] = useState<MascotExpression>('excited');
  const [heartsCount, setHeartsCount] = useState(42);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  // Active daily mission
  const activeMission = missions.length > 0 ? missions[0] : undefined;

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
      title: 'Squad Invite Code Copied! 📋',
      message: `Code: ${squad.inviteCode} copied to clipboard. Share with your friend group!`,
    });
    setIsInviteModalOpen(false);
  };

  if (isLoadingSquad) {
    return (
      <div className={styles.container} style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
        <MascotDisplay expression="excited" size="medium" animation="float" speechBubble="Loading squad base... ⚡" />
        <span className="text-caption">Connecting to Supabase squad vault...</span>
      </div>
    );
  }

  if (user && !hasSquad) {
    return (
      <div className={styles.container}>
        <PageHeading
          title="Squad Base"
          subtitle="Assemble your inner circle"
          badge={<Badge variant="lime" size="sm">No Active Squad</Badge>}
        />
        <div style={{ margin: '32px 0', display: 'flex', justifyContent: 'center' }}>
          <MascotDisplay expression="sleepy" size="large" animation="idle" speechBubble="I don't have a squad yet! 🐾" />
        </div>
        <Card variant="featured" padding="lg">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '16px' }}>
            <h2 className="text-section-title">Ready to Start Adventuring?</h2>
            <p className="text-caption" style={{ maxWidth: '420px', lineHeight: 1.6 }}>
              SideQuest connects you with real-life friends. Create your own private squad or enter an invite code to begin completing daily quests with Questy!
            </p>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <Button
                variant="primary"
                size="lg"
                leftIcon={<UserPlus size={18} />}
                onClick={() => navigate('/onboarding')}
              >
                Create or Join Squad
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

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

        {activeMission ? (
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
        ) : (
          <Card variant="standard" padding="lg">
            <p className="text-caption">Daily mission briefing loading...</p>
          </Card>
        )}
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
              speechBubble={activeMission ? activeMission.briefingSpeech : "Ready for today's squad quest?"}
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
