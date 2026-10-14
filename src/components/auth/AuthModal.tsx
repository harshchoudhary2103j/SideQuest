import React, { useState } from 'react';
import { Mail, Lock, User as UserIcon, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal, Button, Input, useToast } from '../ui';
import { MascotDisplay } from '../mascot';
import { useAuth } from '../../context';
import styles from './AuthModal.module.css';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'signin' | 'signup';
  onSuccess?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'signin',
  onSuccess,
}) => {
  const { signIn, signUp } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'signin' | 'signup'>(defaultMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [aura, setAura] = useState<'midnight_rebel' | 'neon_goblin' | 'solar_paladin' | 'cosmic_mystic'>('midnight_rebel');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [confirmationNotice, setConfirmationNotice] = useState<string | null>(null);

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setErrorMessage(null);
    setConfirmationNotice(null);
    setIsLoading(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setConfirmationNotice(null);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            setErrorMessage('Invalid email or password. Please verify your credentials.');
          } else if (error.message.includes('Email not confirmed')) {
            setErrorMessage('Please confirm your email address before signing in. Check your inbox.');
          } else {
            setErrorMessage(error.message);
          }
          setIsLoading(false);
          return;
        }

        showToast({
          type: 'success',
          title: 'Welcome Back! ✨',
          message: 'Signed in successfully.',
        });
        handleClose();
        onSuccess?.();
      } else {
        const { session, needsEmailConfirmation, error } = await signUp(
          email,
          password,
          displayName.trim() || undefined,
          aura
        );

        if (error) {
          if (error.message.includes('User already registered')) {
            setErrorMessage('An account with this email already exists. Try signing in instead.');
          } else if (error.message.includes('rate limit')) {
            setErrorMessage('Email signup rate limit reached. Please wait a few minutes or sign in if already registered.');
          } else {
            setErrorMessage(error.message);
          }
          setIsLoading(false);
          return;
        }

        if (needsEmailConfirmation) {
          setConfirmationNotice(
            `A confirmation link has been sent to ${email}. Please check your inbox and verify your email to continue!`
          );
          setIsLoading(false);
          return;
        }

        if (session) {
          showToast({
            type: 'success',
            title: 'Welcome to SideQuest! 🚀',
            message: `Account created for ${displayName.trim() || email}.`,
          });
          handleClose();
          onSuccess?.();
        }
      }
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        confirmationNotice
          ? 'Check Your Inbox'
          : mode === 'signin'
          ? 'Sign In to SideQuest'
          : 'Create Adventurer Account'
      }
    >
      {confirmationNotice ? (
        <div className={styles.confirmationBox}>
          <div className={styles.mascotBox}>
            <MascotDisplay expression="proud" size="medium" animation="celebrate" speechBubble="Check your mail! 💌" />
          </div>
          <div className={styles.noticeContent}>
            <CheckCircle2 size={32} color="#D4FF38" />
            <h3 className={styles.noticeTitle}>Confirmation Sent!</h3>
            <p className={styles.noticeDesc}>{confirmationNotice}</p>
          </div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            onClick={() => {
              setConfirmationNotice(null);
              setMode('signin');
            }}
          >
            Back to Sign In
          </Button>
        </div>
      ) : (
        <div className={styles.authContainer}>
          {/* Mode Switch Tabs */}
          <div className={styles.tabRow}>
            <button
              type="button"
              className={`${styles.tabBtn} ${mode === 'signin' ? styles.tabBtnActive : ''}`}
              onClick={() => {
                setMode('signin');
                setErrorMessage(null);
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${mode === 'signup' ? styles.tabBtnActive : ''}`}
              onClick={() => {
                setMode('signup');
                setErrorMessage(null);
              }}
            >
              Create Account
            </button>
          </div>

          {errorMessage && (
            <div className={styles.errorAlert} role="alert">
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className={styles.form}>
            {mode === 'signup' && (
              <>
                <Input
                  label="Adventurer Name"
                  placeholder="E.g. Alex Thorne"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  leftIcon={<UserIcon size={16} />}
                  required
                />

                <div className={styles.auraField}>
                  <label className={styles.fieldLabel}>Select Squad Aura</label>
                  <div className={styles.auraGrid}>
                    {[
                      { key: 'midnight_rebel', label: 'Midnight Rebel', color: '#7C3AED' },
                      { key: 'neon_goblin', label: 'Neon Goblin', color: '#D4FF38' },
                      { key: 'solar_paladin', label: 'Solar Paladin', color: '#FFC857' },
                      { key: 'cosmic_mystic', label: 'Cosmic Mystic', color: '#F04F9D' },
                    ].map((item) => (
                      <button
                        key={item.key}
                        type="button"
                        className={`${styles.auraChip} ${aura === item.key ? styles.auraChipActive : ''}`}
                        onClick={() => setAura(item.key as typeof aura)}
                      >
                        <span className={styles.auraDot} style={{ backgroundColor: item.color }} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <Input
              label="Email Address"
              type="email"
              placeholder="you@friends.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              helperText={mode === 'signup' ? 'Must be at least 6 characters' : undefined}
              required
            />

            <div className={styles.actionWrap}>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<Sparkles size={16} />}
              >
                {mode === 'signin' ? 'Sign In' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className={styles.footerNote}>
            {mode === 'signin' ? (
              <p>
                New adventurer?{' '}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => {
                    setMode('signup');
                    setErrorMessage(null);
                  }}
                >
                  Create your account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                >
                  Sign in here
                </button>
              </p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
};
