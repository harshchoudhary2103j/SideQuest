import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, UserCheck, Shield, Users } from 'lucide-react';
import { Button, Card, Badge, Modal, Input, useToast } from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import styles from './WelcomePage.module.css';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { squad } = useSquad();
  const { showToast } = useToast();

  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [signInHandle, setSignInHandle] = useState('@alex_t');

  const handleDemoSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSignInOpen(false);
    showToast({
      type: 'success',
      title: 'Welcome Back, Adventurer! ✨',
      message: `Signed in as ${signInHandle} with ${squad.name}.`,
    });
    navigate('/app/squad');
  };

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
            speechBubble="Same friends. New adventures! 🚀"
          />
        </div>

        {/* Hero Copy */}
        <div className={styles.copy}>
          <h1 className={styles.heroTitle}>
            Same friends.<br />
            <span className={styles.gradientHighlight}>New adventures.</span>
          </h1>
          <p className={styles.tagline}>
            A private, friend-group challenge game with an evolving AI spirit. Complete daily real-life quests and preserve your squad lore.
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
              <h3 className={styles.featureTitle}>Daily Real-World Missions</h3>
              <p className={styles.featureDesc}>Spontaneous mini-quests built for your inner circle.</p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>⭐</span>
            <div>
              <h3 className={styles.featureTitle}>Shared Squad Mascot: Questy</h3>
              <p className={styles.featureDesc}>Level up your shared creature together from Star Pup to Legendary.</p>
            </div>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>📸</span>
            <div>
              <h3 className={styles.featureTitle}>Private Squad Lore Vault</h3>
              <p className={styles.featureDesc}>Collect funny memories, polaroids, and AI commentary.</p>
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
            onClick={() => navigate('/onboarding')}
          >
            Get Started (Squad Setup)
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            leftIcon={<UserCheck size={18} />}
            onClick={() => setIsSignInOpen(true)}
          >
            Sign In with Squad Code
          </Button>
        </div>
      </main>

      {/* Demo Sign In Modal */}
      <Modal
        isOpen={isSignInOpen}
        onClose={() => setIsSignInOpen(false)}
        title="Sign In to Your Squad"
      >
        <form onSubmit={handleDemoSignIn} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            Enter your adventurer handle and squad code to rejoin your active squad session.
          </p>

          <Input
            label="Adventurer Handle"
            value={signInHandle}
            onChange={(e) => setSignInHandle(e.target.value)}
            required
            leftIcon={<Users size={16} />}
          />

          <Input
            label="Squad Invite Code"
            defaultValue={squad.inviteCode}
            helperText="Demo code for The Chaos Crew"
            leftIcon={<Shield size={16} />}
          />

          <Button type="submit" variant="primary" size="md" fullWidth>
            Enter Squad Base
          </Button>
        </form>
      </Modal>
    </div>
  );
};
