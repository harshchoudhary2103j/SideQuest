import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Flame, Heart } from 'lucide-react';
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
  Avatar,
  ProgressBar,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import type { MascotAnimation, MascotExpression } from '../types/mascot';
import styles from './SquadPage.module.css';

export const SquadPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mascotAnim, setMascotAnim] = useState<MascotAnimation>('idle');
  const [mascotExpr, setMascotExpr] = useState<MascotExpression>('excited');
  const [heartsCount, setHeartsCount] = useState(42);

  const handlePetQuesty = () => {
    setMascotAnim('celebrate');
    setMascotExpr('happy');
    setHeartsCount((prev) => prev + 1);
    showToast({
      type: 'success',
      title: 'Questy is thrilled! ✨',
      message: 'Questy loves squad headpats. +5 Morale XP!',
    });

    setTimeout(() => {
      setMascotAnim('idle');
      setMascotExpr('excited');
    }, 2000);
  };

  return (
    <div className={styles.container}>
      {/* Page Header */}
      <PageHeading
        title="Chaos Crew"
        subtitle="Level 1 Squad • 4 Members Active"
        badge={
          <Badge variant="lime" size="sm" icon={<Flame size={12} />}>
            7 Day Streak
          </Badge>
        }
        actions={
          <div className={styles.avatarGroup}>
            <Avatar name="Alex" size="sm" status="online" ring="lime" />
            <Avatar name="Ria" size="sm" status="online" ring="purple" />
            <Avatar name="Sam" size="sm" status="busy" ring="none" />
            <Avatar name="Kavya" size="sm" status="online" ring="gold" />
          </div>
        }
      />

      {/* Shared Mascot Showcase Card */}
      <Card variant="featured" padding="lg" className={styles.mascotCard}>
        <div className={styles.mascotCenter}>
          <MascotDisplay
            expression={mascotExpr}
            evolutionLevel={1}
            size="large"
            animation={mascotAnim}
            speechBubble="Find the weirdest snack under ₹50! 🥟"
            showStageBadge
          />
        </div>

        <div className={styles.xpSection}>
          <ProgressBar
            value={180}
            max={300}
            label="Squad XP to Lv.2 Glow Buddy"
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
            onClick={() => navigate('/app/lore')}
          >
            View Memories
          </Button>
        </div>
      </Card>

      {/* Active Daily Mission Card */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Today’s Mission</h2>
          <Badge variant="lime" size="sm">Active</Badge>
        </div>

        <Card variant="interactive" padding="md" onClick={() => navigate('/app/missions')}>
          <CardHeader>
            <div className={styles.missionMetaRow}>
              <Badge variant="gold" size="sm">Daily Quest</Badge>
              <span className={styles.xpTag}>+100 XP</span>
            </div>
            <CardTitle>The Midnight Snack Heist</CardTitle>
            <CardDescription>
              Find the weirdest food or snack combo within walking distance and upload visual proof.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className={styles.proofStatusRow}>
              <span className={styles.proofText}>Squad Submissions: 2 of 4 ready</span>
              <div className={styles.miniAvatars}>
                <Avatar name="Alex" size="sm" status="online" ring="lime" />
                <Avatar name="Ria" size="sm" status="online" ring="lime" />
              </div>
            </div>
          </CardContent>

          <CardFooter>
            <span className={styles.timeLeft}>Ends in 5h 24m</span>
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={16} />}>
              Open Mission
            </Button>
          </CardFooter>
        </Card>
      </section>

      {/* Squad Lore Quick Teaser */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Latest Squad Lore</h2>
          <span className={styles.viewAllLink} onClick={() => navigate('/app/lore')}>
            Vault →
          </span>
        </div>

        <Card variant="standard" padding="md">
          <div className={styles.loreSnippet}>
            <span className={styles.loreEmoji}>📸</span>
            <div className={styles.loreInfo}>
              <h4 className={styles.loreTitle}>The 2 AM Paratha Expedition</h4>
              <p className={styles.loreQuote}>“Another iconic memory for the books! 💜” — Questy</p>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
};
