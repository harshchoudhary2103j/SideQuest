import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, LogIn, LogOut } from 'lucide-react';
import { Button, Card, Badge } from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad, useAuth } from '../context';
import { AuthModal } from '../components/auth';
import styles from './WelcomePage.module.css';

export const WelcomePage: React.FC = () => {
  const navigate = useNavigate();
  const { squad } = useSquad();
  const { user, profile, signOut } = useAuth();

  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

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
          {user ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <Badge variant="lime" size="sm">
                  Active Session: {profile?.display_name || user.email}
                </Badge>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight size={18} />}
                onClick={() => navigate('/app/squad')}
              >
                Enter Squad Base ({squad.name})
              </Button>

              <Button
                variant="outline"
                size="md"
                fullWidth
                leftIcon={<LogOut size={16} />}
                onClick={() => signOut()}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="primary"
                size="lg"
                fullWidth
                rightIcon={<ArrowRight size={18} />}
                onClick={() => {
                  setAuthMode('signup');
                  setIsAuthOpen(true);
                }}
              >
                Get Started (Create Account)
              </Button>

              <Button
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<LogIn size={18} />}
                onClick={() => {
                  setAuthMode('signin');
                  setIsAuthOpen(true);
                }}
              >
                Sign In with Email
              </Button>
            </>
          )}
        </div>
      </main>

      {/* Supabase Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultMode={authMode}
        onSuccess={() => {
          navigate('/onboarding');
        }}
      />
    </div>
  );
};
