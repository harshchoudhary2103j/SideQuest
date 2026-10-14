import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Card, Button } from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { AuthModal } from '../components/auth';
import { useAuth } from '../context';
import styles from './WelcomePage.module.css';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  // If already logged in, redirect
  React.useEffect(() => {
    if (user) {
      const from = (location.state as any)?.from?.pathname || '/app/squad';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft size={16} />}
          onClick={() => navigate('/welcome')}
        >
          Back to Welcome
        </Button>
      </header>

      <main className={styles.main}>
        <div className={styles.mascotHero}>
          <MascotDisplay
            expression="mischievous"
            size="large"
            animation="float"
            speechBubble="Identify yourself, adventurer! 🗝️"
          />
        </div>

        <div className={styles.copy}>
          <h1 className={styles.heroTitle}>
            Enter the <span className={styles.gradientHighlight}>Portal</span>
          </h1>
          <p className={styles.tagline}>
            Sign in to access your squad, review daily missions, and unlock Questy evolutions.
          </p>
        </div>

        <Card variant="raised" padding="lg" style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onClick={() => setMode('signin')}
          >
            Sign In with Email
          </Button>

          <Button
            variant="secondary"
            size="md"
            fullWidth
            onClick={() => setMode('signup')}
          >
            Create New Account
          </Button>
        </Card>
      </main>

      <AuthModal
        isOpen={true}
        onClose={() => navigate('/welcome')}
        defaultMode={mode}
        onSuccess={() => {
          const from = (location.state as any)?.from?.pathname || '/onboarding';
          navigate(from, { replace: true });
        }}
      />
    </div>
  );
};
