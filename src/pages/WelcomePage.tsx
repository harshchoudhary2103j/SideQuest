import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import { Card } from '../components/ui/Card/Card';
import { Badge } from '../components/ui/Badge/Badge';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import styles from './WelcomePage.module.css';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.logoBadge}>
          <Sparkles size={16} color="#D4FF38" />
          <span>SideQuest</span>
        </div>
      </header>

      <main className={styles.main}>
        {/* Hero Mascot */}
        <div className={styles.mascotHero}>
          <MascotDisplay
            expression="excited"
            size="large"
            animation="float"
            speechBubble="A new mission awaits! 🚀"
          />
        </div>

        {/* Hero Copy */}
        <div className={styles.copy}>
          <h1 className={styles.heroTitle}>
            Same friends.<br />
            <span className={styles.gradientHighlight}>New adventures.</span>
          </h1>
          <p className={styles.tagline}>
            A mischievous, lovable companion that turns your squad’s everyday moments into legendary real-life quests.
          </p>

          <div className={styles.pillsRow}>
            <Badge variant="purple" size="md">Playful</Badge>
            <Badge variant="lime" size="md">Supportive</Badge>
            <Badge variant="pink" size="md">Chaotic</Badge>
            <Badge variant="gold" size="md">Loyal</Badge>
          </div>
        </div>

        {/* Feature Highlights */}
        <Card variant="standard" padding="md" className={styles.featureCard}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🗺️</span>
            <div>
              <h3 className={styles.featureTitle}>Daily Real-Life Quests</h3>
              <p className={styles.featureDesc}>Spontaneous mini-missions tailored for your squad.</p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>⭐</span>
            <div>
              <h3 className={styles.featureTitle}>Shared Squad Mascot</h3>
              <p className={styles.featureDesc}>Level up Questy together from Star Pup to Legendary.</p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className={styles.actionGroup}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ArrowRight size={18} />}
            onClick={() => navigate('/app/squad')}
          >
            Launch Squad App
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<ShieldCheck size={18} />}
            onClick={() => navigate('/onboarding')}
          >
            How SideQuest Works
          </Button>
        </div>
      </main>
    </div>
  );
};
