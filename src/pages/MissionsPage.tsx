import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock, RefreshCw } from 'lucide-react';
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
  const {
    missions,
    hasSquad,
    isLoadingSquad,
    isLoadingMissions,
    missionsError,
    refreshDailyMissions,
  } = useSquad();
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

      {/* State Handlers */}
      {(isLoadingSquad || isLoadingMissions) && (
        <Card variant="standard" padding="lg" className={styles.stateCard}>
          <MascotDisplay expression="surprised" pose="think" size="medium" animation="think" />
          <h3 className={styles.stateTitle}>Selecting Today's Squad Missions...</h3>
          <p className={styles.stateText}>
            Questy is consulting the mission archives to assemble 5 balanced daily challenges for your squad.
          </p>
        </Card>
      )}

      {!isLoadingSquad && !isLoadingMissions && !hasSquad && (
        <Card variant="standard" padding="lg" className={styles.stateCard}>
          <MascotDisplay expression="sleepy" pose="wave" size="medium" />
          <h3 className={styles.stateTitle}>No Active Squad Joined</h3>
          <p className={styles.stateText}>
            Daily missions are assigned exclusively to private squads. Create your squad or join with an invite code to begin your adventures!
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => navigate('/onboarding')}
            rightIcon={<ArrowRight size={16} />}
          >
            Join or Create a Squad
          </Button>
        </Card>
      )}

      {!isLoadingSquad && !isLoadingMissions && hasSquad && missionsError && (
        <Card variant="standard" padding="lg" className={styles.stateCard}>
          <MascotDisplay expression="sad" pose="think" size="medium" />
          <h3 className={styles.stateTitle}>Unable to Retrieve Daily Missions</h3>
          <p className={styles.stateText}>
            {missionsError}
          </p>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => refreshDailyMissions()}
            rightIcon={<RefreshCw size={14} />}
          >
            Retry Mission Sync
          </Button>
        </Card>
      )}

      {!isLoadingSquad && !isLoadingMissions && hasSquad && !missionsError && (
        <>
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
              Active Today ({missions.filter((m) => m.status === 'available' || m.status === 'in_progress').length})
            </button>
            <button
              type="button"
              className={`${styles.filterChip} ${filter === 'completed' ? styles.filterChipActive : ''}`}
              onClick={() => setFilter('completed')}
            >
              Completed ({missions.filter((m) => m.status === 'completed' || m.status === 'submitted').length})
            </button>
          </div>

          {filteredMissions.length === 0 ? (
            <Card variant="standard" padding="lg" className={styles.stateCard}>
              <MascotDisplay expression="happy" pose="sit" size="medium" />
              <h3 className={styles.stateTitle}>No Quests in this Category</h3>
              <p className={styles.stateText}>
                {filter === 'completed'
                  ? "Your squad hasn't completed any quests yet today. Pick one below to earn your first XP!"
                  : "All available quests have been completed or filtered out."}
              </p>
              {filter !== 'all' && (
                <Button variant="secondary" size="sm" onClick={() => setFilter('all')}>
                  View All Quests
                </Button>
              )}
            </Card>
          ) : (
            <section className={styles.missionsGrid}>
              {filteredMissions.map((mission) => {
                const isCompleted = mission.status === 'completed' || mission.status === 'submitted';
                const categoryVariant =
                  mission.category === 'chaos'
                    ? 'pink'
                    : mission.category === 'creative'
                    ? 'purple'
                    : mission.category === 'exploration'
                    ? 'lime'
                    : 'gold';

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
                          <Badge variant={isCompleted ? 'success' : categoryVariant} size="sm">
                            {isCompleted ? 'Completed' : mission.category.toUpperCase()}
                          </Badge>
                          <Badge variant="neutral" size="sm">
                            {mission.difficulty.toUpperCase()}
                          </Badge>
                          {mission.assignedDate && (
                            <Badge variant="purple" size="sm">
                              {mission.assignedDate}
                            </Badge>
                          )}
                        </div>
                        <span className={styles.xpReward}>+{mission.xpReward} XP</span>
                      </div>

                      <CardTitle>{mission.title}</CardTitle>
                      <CardDescription>{mission.description}</CardDescription>

                      {mission.rules && mission.rules.length > 0 && (
                        <div className={styles.rulesList}>
                          {mission.rules.slice(0, 2).map((rule, idx) => (
                            <span key={idx} className={styles.ruleBadge}>
                              • {rule}
                            </span>
                          ))}
                        </div>
                      )}
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
                        {isCompleted
                          ? '✓ Verified in Squad Lore'
                          : mission.status === 'in_progress'
                          ? 'In Progress'
                          : 'Daily Objective'}
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
                        {isCompleted ? 'View Proof' : 'Open Mission'}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </section>
          )}
        </>
      )}
    </div>
  );
};
