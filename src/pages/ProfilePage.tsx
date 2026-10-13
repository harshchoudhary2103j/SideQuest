import React, { useState } from 'react';
import { Flame, Trophy } from 'lucide-react';
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
} from '../components/ui';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import { EVOLUTION_STAGES } from '../components/mascot/mascotRegistry';
import type { MascotEvolutionLevel } from '../types/mascot';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<MascotEvolutionLevel>(1);
  const activeStage = EVOLUTION_STAGES[selectedLevel];

  return (
    <div className={styles.container}>
      <PageHeading
        title="Squad Profile"
        subtitle="Your adventurer card and Questy evolution vault"
        badge={<Badge variant="lime" size="sm">Chaos Scout</Badge>}
      />

      {/* Adventurer Card */}
      <Card variant="featured" padding="lg" className={styles.adventurerCard}>
        <div className={styles.profileHeader}>
          <Avatar
            name="Alex Thorne"
            size="xl"
            status="online"
            ring="lime"
          />
          <div className={styles.profileMeta}>
            <h2 className={styles.userName}>Alex Thorne</h2>
            <span className={styles.squadRole}>Squad Co-Founder • Chaos Crew</span>
            <div className={styles.badgeRow}>
              <Badge variant="purple" size="sm" icon={<Flame size={12} />}>7 Day Streak</Badge>
              <Badge variant="gold" size="sm" icon={<Trophy size={12} />}>14 Quests Crushed</Badge>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>420</span>
            <span className={styles.statLabel}>Personal XP</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>#1</span>
            <span className={styles.statLabel}>Squad Rank</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>8</span>
            <span className={styles.statLabel}>Reactions</span>
          </div>
        </div>
      </Card>

      {/* Questy Evolution Vault Showcase */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Mascot Evolution Vault</h2>
          <Badge variant="gold" size="sm">Stage {selectedLevel} of 5</Badge>
        </div>

        <Card variant="standard" padding="lg" className={styles.evolutionCard}>
          <div className={styles.stageMascotWrap}>
            <MascotDisplay
              key={selectedLevel}
              evolutionLevel={selectedLevel}
              expression={selectedLevel === 5 ? 'proud' : 'happy'}
              size="large"
              animation="float"
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
            {([1, 2, 3, 4, 5] as MascotEvolutionLevel[]).map((lvl) => (
              <button
                key={lvl}
                type="button"
                className={`${styles.levelButton} ${lvl === selectedLevel ? styles.levelButtonActive : ''}`}
                onClick={() => setSelectedLevel(lvl)}
              >
                <span>Lv.{lvl}</span>
              </button>
            ))}
          </div>
        </Card>
      </section>

      {/* Squad Settings / Info */}
      <section className={styles.section}>
        <h2 className="text-section-title">Squad Details</h2>
        <Card variant="standard" padding="md">
          <CardHeader>
            <CardTitle>The Chaos Crew</CardTitle>
            <CardDescription>Created October 2026 • 4 Squad Members</CardDescription>
          </CardHeader>
          <CardContent>
            <ProgressBar
              value={42}
              max={100}
              label="Squad Season 1 Mastery"
              showValue
              variant="lime"
              size="sm"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
};
