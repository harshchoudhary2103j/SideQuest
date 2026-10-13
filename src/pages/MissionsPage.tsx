import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import {
  PageHeading,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Button,
  Badge,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import styles from './MissionsPage.module.css';

export const MissionsPage: React.FC = () => {
  const navigate = useNavigate();
  const { missions } = useSquad();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredMissions = missions.filter((m) => {
    if (filter === 'active') return m.status === 'available' || m.status === 'in_progress';
    if (filter === 'completed') return m.status === 'completed' || m.status === 'submitted';
    return true;
  });

  return (
    <div className={styles.container}>
      <PageHeading
        title="Squad Missions"
        subtitle="Complete daily squad quests to evolve Questy"
        badge={<Badge variant="purple" size="sm">Season 1: Stardust</Badge>}
      />

      {/* Questy Mission Guide Briefing */}
      <Card variant="standard" padding="md" className={styles.briefingCard}>
        <div className={styles.mascotThumb}>
          <MascotDisplay
            expression="mischievous"
            pose="think"
            size="medium"
            animation="think"
            speechBubble="Real life only. No fake pixels! 🔍"
          />
        </div>
        <div className={styles.briefingText}>
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Badge variant="lime" size="sm" dot>Mission Guide</Badge>
            <span className="text-caption">Rules of Engagement</span>
          </div>
          <h3 className={styles.briefingTitle}>How Squad Quests Work</h3>
          <p className={styles.briefingDesc}>
            One quest per day. Snap photo or video proof with your squad hand sign. Once completed, your proof gets archived into private Squad Lore!
          </p>
        </div>
      </Card>

      {/* Filter Tabs */}
      <div className={styles.filterBar}>
        <button
          type="button"
          className={`${styles.filterChip} ${filter === 'all' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('all')}
        >
          All Quests ({missions.length})
        </button>
        <button
          type="button"
          className={`${styles.filterChip} ${filter === 'active' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('active')}
        >
          Active Today
        </button>
        <button
          type="button"
          className={`${styles.filterChip} ${filter === 'completed' ? styles.filterChipActive : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed Archive
        </button>
      </div>

      {/* Missions List */}
      <section className={styles.missionsGrid}>
        {filteredMissions.map((mission) => {
          const isCompleted = mission.status === 'completed' || mission.status === 'submitted';
          const isLocked = mission.id === 'sunset-silhouette' && mission.status === 'in_progress';

          return (
            <Card
              key={mission.id}
              variant={isCompleted ? 'standard' : 'interactive'}
              padding="lg"
              onClick={() => navigate(`/app/missions/${mission.id}`)}
              className={styles.missionCard}
            >
              <CardHeader>
                <div className={styles.metaRow}>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <Badge variant={isCompleted ? 'success' : 'gold'} size="sm">
                      {isCompleted ? 'Completed' : mission.category.toUpperCase()}
                    </Badge>
                    <Badge variant="neutral" size="sm">{mission.difficulty.toUpperCase()}</Badge>
                  </div>
                  <span className={styles.xpReward}>+{mission.xpReward} XP</span>
                </div>

                <CardTitle>{mission.title}</CardTitle>
                <CardDescription>{mission.description}</CardDescription>
              </CardHeader>

              <CardContent>
                <div className={styles.cardInfoRow}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Clock size={14} color="#A4ABC4" />
                    <span className="text-caption">{mission.deadlineText}</span>
                  </div>
                  <span className="text-caption">
                    {mission.squadSubmissions.length > 0
                      ? `${mission.squadSubmissions.length} squad proofs dropped`
                      : 'Be the first to submit'}
                  </span>
                </div>
              </CardContent>

              <CardFooter>
                <span className="text-caption">
                  {isCompleted ? '✓ Verified in Squad Lore' : isLocked ? 'Upcoming Quest' : 'Action Required'}
                </span>
                <Button
                  variant={isCompleted ? 'secondary' : 'primary'}
                  size="sm"
                  rightIcon={<ArrowRight size={16} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/app/missions/${mission.id}`);
                  }}
                >
                  {isCompleted ? 'View Proof' : isLocked ? 'Preview' : 'Open Mission'}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </section>
    </div>
  );
};
