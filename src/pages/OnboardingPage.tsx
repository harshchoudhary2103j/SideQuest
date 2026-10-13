import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import { Card } from '../components/ui/Card/Card';
import { Badge } from '../components/ui/Badge/Badge';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import type { MascotExpression, MascotEvolutionLevel } from '../types/mascot';
import styles from './OnboardingPage.module.css';

interface OnboardingStep {
  step: number;
  badge: string;
  title: string;
  description: string;
  expression: MascotExpression;
  evolutionLevel: MascotEvolutionLevel;
  bubble: string;
}

const STEPS: OnboardingStep[] = [
  {
    step: 1,
    badge: 'Step 1 of 4',
    title: 'Gather Your Squad',
    description: 'Invite 2 to 6 of your closest friends. No random strangers, just your inner circle.',
    expression: 'happy',
    evolutionLevel: 1,
    bubble: 'Squad up! 🤝',
  },
  {
    step: 2,
    badge: 'Step 2 of 4',
    title: 'Daily Spontaneous Quests',
    description: 'Get one fun, unexpected real-life quest every day. Grab weird snacks, find strange spots, make memories.',
    expression: 'mischievous',
    evolutionLevel: 2,
    bubble: 'Always up for trouble! 😈',
  },
  {
    step: 3,
    badge: 'Step 3 of 4',
    title: 'Drop Proof & Roast Each Other',
    description: 'Submit photos or audio proofs, get spicy reactions, and stack XP on the leaderboard.',
    expression: 'excited',
    evolutionLevel: 3,
    bubble: 'Legendary proof! 📸',
  },
  {
    step: 4,
    badge: 'Step 4 of 4',
    title: 'Evolve Questy Together',
    description: 'As your squad crushes quests, Questy evolves from a tiny Star Pup into a Legendary cosmic mascot.',
    expression: 'proud',
    evolutionLevel: 5,
    bubble: 'LEVEL UP! 👑',
  },
];

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentIdx, setCurrentIdx] = useState(0);

  const step = STEPS[currentIdx];
  const isLast = currentIdx === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      navigate('/app/squad');
    } else {
      setCurrentIdx((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
    } else {
      navigate('/welcome');
    }
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button
          type="button"
          onClick={handleBack}
          className={styles.backButton}
          aria-label="Go back"
        >
          <ArrowLeft size={20} />
        </button>
        <div className={styles.progressDots}>
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`${styles.dot} ${i === currentIdx ? styles.dotActive : ''}`}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/squad')}
          className={styles.skipButton}
        >
          Skip
        </button>
      </header>

      <main className={styles.main}>
        <div className={styles.mascotArea}>
          <MascotDisplay
            key={step.step}
            expression={step.expression}
            evolutionLevel={step.evolutionLevel}
            size="large"
            animation="celebrate"
            speechBubble={step.bubble}
            showStageBadge
          />
        </div>

        <Card variant="raised" padding="lg" className={styles.infoCard}>
          <Badge variant="lime" size="sm">{step.badge}</Badge>
          <h2 className={styles.stepTitle}>{step.title}</h2>
          <p className={styles.stepDesc}>{step.description}</p>
        </Card>

        <div className={styles.actionWrap}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ChevronRight size={18} />}
            onClick={handleNext}
          >
            {isLast ? 'Enter Your Squad' : 'Next Step'}
          </Button>
        </div>
      </main>
    </div>
  );
};
