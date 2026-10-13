import React from 'react';
import { Camera, CheckCircle2, Lock, Flame } from 'lucide-react';
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
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import styles from './MissionsPage.module.css';

export const MissionsPage: React.FC = () => {
  const { showToast } = useToast();

  const handleSimulateProof = () => {
    showToast({
      type: 'success',
      title: 'Legendary Proof Submitted! 📸',
      message: 'Questy is processing your squad photo. +100 XP awarded!',
    });
  };

  return (
    <div className={styles.container}>
      <PageHeading
        title="Missions"
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
            speechBubble="Hmmm... Let me take a look! 🔍"
          />
        </div>
        <div className={styles.briefingText}>
          <Badge variant="lime" size="sm" dot>Mission Guide</Badge>
          <h3 className={styles.briefingTitle}>Rules of Engagement</h3>
          <p className={styles.briefingDesc}>
            One quest per day. Real-life proof only. No internet images allowed — Questy will detect fake pixels!
          </p>
        </div>
      </Card>

      {/* Active Mission */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Today’s Quest</h2>
          <Badge variant="lime" size="sm" icon={<Flame size={12} />}>Time Critical</Badge>
        </div>

        <Card variant="featured" padding="lg">
          <CardHeader>
            <div className={styles.metaRow}>
              <Badge variant="gold" size="sm">Daily Mission #14</Badge>
              <span className={styles.xpReward}>+100 XP</span>
            </div>
            <CardTitle>Find the Weirdest Snack Under ₹50</CardTitle>
            <CardDescription>
              Hunt down the most unexpectedly flavored, oddly packaged, or wildly delicious street snack within your area.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className={styles.objectivesBox}>
              <div className={styles.objectiveItem}>
                <CheckCircle2 size={16} color="#45D6A0" />
                <span>Must cost ₹50 or less</span>
              </div>
              <div className={styles.objectiveItem}>
                <CheckCircle2 size={16} color="#45D6A0" />
                <span>Must show the packaging and squad member hand</span>
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <Button
              variant="primary"
              size="md"
              fullWidth
              leftIcon={<Camera size={18} />}
              onClick={handleSimulateProof}
            >
              Submit Photo Proof
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Upcoming / Locked Quest */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Upcoming</h2>
        </div>

        <Card variant="standard" padding="md" className={styles.lockedCard}>
          <div className={styles.lockedHeader}>
            <div className={styles.lockIconWrap}>
              <Lock size={18} />
            </div>
            <div>
              <h3 className={styles.lockedTitle}>The Golden Hour Silhouette</h3>
              <p className={styles.lockedDesc}>Unlocks tomorrow at 6:00 AM</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
