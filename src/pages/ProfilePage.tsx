import React, { useState } from 'react';
import { Flame, Trophy, Lock, Unlock, Copy } from 'lucide-react';
import {
  PageHeading,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Avatar,
  ProgressBar,
  Button,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { EVOLUTION_STAGES } from '../components/mascot/mascotRegistry';
import { useSquad } from '../context';
import type { MascotEvolutionLevel } from '../types/mascot';
import styles from './ProfilePage.module.css';

const STAGE_XP_THRESHOLDS: Record<MascotEvolutionLevel, number> = {
  1: 0,
  2: 300,
  3: 600,
  4: 1000,
  5: 1500,
};

export const ProfilePage: React.FC = () => {
  const { squad } = useSquad();
  const { showToast } = useToast();

  const currentUser = squad.members.find((m) => m.isCurrentUser) || squad.members[0];
  const [previewLevel, setPreviewLevel] = useState<MascotEvolutionLevel>(squad.evolutionLevel);

  const activeStage = EVOLUTION_STAGES[previewLevel];
  const isUnlocked = previewLevel <= squad.evolutionLevel;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(squad.inviteCode);
    showToast({
      type: 'success',
      title: 'Demo Invite Code Copied! 📋',
      message: `Code: ${squad.inviteCode} copied. Share with your squad!`,
    });
  };

  return (
    <div className={styles.container}>
      <PageHeading
        title="Squad Profile"
        subtitle="Your adventurer card and Questy evolution vault"
        badge={<Badge variant="lime" size="sm">Chaos Scout</Badge>}
      />

      {/* Adventurer Identity Card */}
      <Card variant="featured" padding="lg" className={styles.adventurerCard}>
        <div className={styles.profileHeader}>
          <Avatar
            name={currentUser.name}
            size="xl"
            status={currentUser.status}
            ring={currentUser.avatarRing}
          />
          <div className={styles.profileMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className={styles.userName}>{currentUser.name}</h2>
              <Badge variant="purple" size="sm">{currentUser.role}</Badge>
            </div>
            <span className={styles.squadRole}>{currentUser.handle} • {squad.name}</span>

            <div className={styles.badgeRow}>
              <Badge variant="lime" size="sm" icon={<Flame size={12} />}>
                {squad.streakDays} Day Streak
              </Badge>
              <Badge variant="gold" size="sm" icon={<Trophy size={12} />}>
                {currentUser.completedMissions} Quests Crushed
              </Badge>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{currentUser.personalXp}</span>
            <span className={styles.statLabel}>Personal XP</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>#{currentUser.personalXp >= 400 ? '1' : '2'}</span>
            <span className={styles.statLabel}>Squad Rank</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{squad.members.length}</span>
            <span className={styles.statLabel}>Squad Mates</span>
          </div>
        </div>
      </Card>

      {/* Questy Evolution Vault Showcase */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="text-section-title">Mascot Evolution Vault</h2>
            <Badge variant="purple" size="sm">All 5 Stages</Badge>
          </div>
          <span className="text-caption">
            Current Form: Lv.{squad.evolutionLevel}
          </span>
        </div>

        <Card variant="standard" padding="lg" className={styles.evolutionCard}>
          {/* Status Flag */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isUnlocked ? (
              <Badge variant="success" size="sm" icon={<Unlock size={12} />}>
                {previewLevel === squad.evolutionLevel ? 'Active Form' : 'Unlocked'}
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm" icon={<Lock size={12} />}>
                Locked (Requires {STAGE_XP_THRESHOLDS[previewLevel]} XP)
              </Badge>
            )}
          </div>

          <div className={styles.stageMascotWrap}>
            <MascotDisplay
              key={previewLevel}
              evolutionLevel={previewLevel}
              expression={previewLevel === 5 ? 'proud' : isUnlocked ? 'happy' : 'sleepy'}
              size="large"
              animation={isUnlocked ? 'float' : 'none'}
              showStageBadge
              speechBubble={activeStage.tagline}
            />
          </div>

          <div className={styles.stageDescriptionBox}>
            <h3 className={styles.stageName}>Level {activeStage.level}: {activeStage.name}</h3>
            <p className={styles.stageTagline}>“{activeStage.tagline}”</p>
            <p className={styles.stageDesc}>{activeStage.description}</p>
          </div>

          {/* Level Switcher Selector */}
          <div className={styles.stageSelectorRow}>
            {([1, 2, 3, 4, 5] as MascotEvolutionLevel[]).map((lvl) => {
              const unlocked = lvl <= squad.evolutionLevel;
              return (
                <button
                  key={lvl}
                  type="button"
                  className={`${styles.levelButton} ${lvl === previewLevel ? styles.levelButtonActive : ''}`}
                  onClick={() => setPreviewLevel(lvl)}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!unlocked && <Lock size={10} />}
                    Lv.{lvl}
                  </span>
                </button>
              );
            })}
          </div>

          <div style={{ width: '100%', maxWidth: '380px', marginTop: '12px' }}>
            <ProgressBar
              value={squad.currentXp}
              max={squad.targetXp}
              label={`Squad Progress toward next level: ${squad.currentXp} / ${squad.targetXp} XP`}
              showValue
              variant="gradient"
              size="sm"
            />
          </div>
        </Card>
      </section>

      {/* Squad Settings & Invite Box */}
      <section className={styles.section}>
        <h2 className="text-section-title">Squad Details & Invitation</h2>
        <Card variant="standard" padding="md">
          <CardHeader>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <CardTitle>{squad.name}</CardTitle>
              <Badge variant="gold" size="sm">Level {squad.level}</Badge>
            </div>
            <CardDescription>{squad.motto}</CardDescription>
          </CardHeader>

          <CardContent>
            <div className={styles.inviteShareBox}>
              <div className={styles.codeTextGroup}>
                <span className="text-caption">Squad Demo Invite Code</span>
                <span className={styles.codeNumber}>{squad.inviteCode}</span>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Copy size={14} />}
                onClick={handleCopyCode}
              >
                Copy Code
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Squad Roster List */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Squad Roster ({squad.members.length})</h2>
          <span className="text-caption">Inner Circle</span>
        </div>

        <Card variant="standard" padding="md">
          <div className={styles.rosterList}>
            {squad.members.map((member) => (
              <div key={member.id} className={styles.rosterItem}>
                <Avatar name={member.name} size="md" status={member.status} ring={member.avatarRing} />
                <div className={styles.rosterMeta}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span className="text-body-strong">{member.name}</span>
                    {member.isCurrentUser && <Badge variant="lime" size="sm">You</Badge>}
                  </div>
                  <span className="text-caption">{member.role} • {member.completedMissions} quests</span>
                </div>
                <span className={styles.rosterXp}>+{member.personalXp} XP</span>
              </div>
            ))}
          </div>
        </Card>
      </section>
    </div>
  );
};
