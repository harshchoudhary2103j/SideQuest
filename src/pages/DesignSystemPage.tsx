import React, { useState } from 'react';
import { Sparkles, Heart } from 'lucide-react';
import {
  PageHeading,
  Card,
  Button,
  Badge,
  Avatar,
  ProgressBar,
  LoadingIndicator,
  Skeleton,
  EmptyState,
  ErrorState,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import type {
  MascotExpression,
  MascotEvolutionLevel,
  MascotAnimation,
} from '../types/mascot';
import styles from './DesignSystemPage.module.css';

const EXPRESSIONS: MascotExpression[] = [
  'happy',
  'excited',
  'mischievous',
  'surprised',
  'sleepy',
  'proud',
  'sad',
  'angry',
];

const ANIMATIONS: MascotAnimation[] = ['idle', 'celebrate', 'float', 'think', 'none'];

export const DesignSystemPage: React.FC = () => {
  const { showToast } = useToast();
  const [btnLoading, setBtnLoading] = useState(false);
  const [selectedAnim, setSelectedAnim] = useState<MascotAnimation>('idle');
  const [showEmptyDemo, setShowEmptyDemo] = useState(false);
  const [showErrorDemo, setShowErrorDemo] = useState(false);

  return (
    <div className={styles.container}>
      <PageHeading
        title="Design System & Tokens"
        subtitle="Phase 1 Visual Foundation & Questy Mascot Verification"
        badge={<Badge variant="lime" size="sm">Phase 1 Spec</Badge>}
      />

      {/* 1. Color Palette Tokens */}
      <section className={styles.section}>
        <h2 className="text-section-title">Color Tokens</h2>
        <div className={styles.tokenGrid}>
          <div className={styles.tokenCard} style={{ backgroundColor: '#080B18' }}>
            <span className={styles.tokenLabel}>Main Bg</span>
            <span className={styles.tokenHex}>#080B18</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#11162A' }}>
            <span className={styles.tokenLabel}>Surface</span>
            <span className={styles.tokenHex}>#11162A</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#191F38' }}>
            <span className={styles.tokenLabel}>Raised</span>
            <span className={styles.tokenHex}>#191F38</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#292F49' }}>
            <span className={styles.tokenLabel}>Border</span>
            <span className={styles.tokenHex}>#292F49</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#D4FF38', color: '#080B18' }}>
            <span className={styles.tokenLabel}>Action Lime</span>
            <span className={styles.tokenHex}>#D4FF38</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#7C3AED' }}>
            <span className={styles.tokenLabel}>Purple</span>
            <span className={styles.tokenHex}>#7C3AED</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#F04F9D' }}>
            <span className={styles.tokenLabel}>Pink</span>
            <span className={styles.tokenHex}>#F04F9D</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#FFC857', color: '#080B18' }}>
            <span className={styles.tokenLabel}>Gold</span>
            <span className={styles.tokenHex}>#FFC857</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#45D6A0', color: '#080B18' }}>
            <span className={styles.tokenLabel}>Success</span>
            <span className={styles.tokenHex}>#45D6A0</span>
          </div>
          <div className={styles.tokenCard} style={{ backgroundColor: '#FF647C' }}>
            <span className={styles.tokenLabel}>Error</span>
            <span className={styles.tokenHex}>#FF647C</span>
          </div>
        </div>
      </section>

      {/* 2. Questy Expression Sheet */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Questy Expressions (8 States)</h2>
          <Badge variant="purple" size="sm">Stardust Creature</Badge>
        </div>
        <p className="text-secondary">
          Consistent proportions, violet eyes, blush, golden crown, and stardust horns across all moods.
        </p>

        <div className={styles.mascotGrid}>
          {EXPRESSIONS.map((expr) => (
            <Card key={expr} variant="standard" padding="sm" className={styles.mascotCell}>
              <MascotDisplay
                expression={expr}
                size="medium"
                animation="none"
                alt={`Questy ${expr}`}
              />
              <span className={styles.cellCaption}>{expr}</span>
            </Card>
          ))}
        </div>
      </section>

      {/* 3. Evolution Stages Progression */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Evolution Progression (Levels 1–5)</h2>
          <Badge variant="gold" size="sm">Squad XP Stages</Badge>
        </div>

        <div className={styles.evolutionGrid}>
          {([1, 2, 3, 4, 5] as MascotEvolutionLevel[]).map((lvl) => (
            <Card key={lvl} variant="standard" padding="md" className={styles.evolutionCell}>
              <MascotDisplay
                evolutionLevel={lvl}
                expression="happy"
                size="medium"
                animation="idle"
                showStageBadge
              />
            </Card>
          ))}
        </div>
      </section>

      {/* 4. Animation Variants */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Mascot Animation Modes</h2>
          <div className={styles.animControls}>
            {ANIMATIONS.map((anim) => (
              <Button
                key={anim}
                variant={selectedAnim === anim ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedAnim(anim)}
              >
                {anim}
              </Button>
            ))}
          </div>
        </div>

        <Card variant="featured" padding="lg" className={styles.animDisplayCard}>
          <MascotDisplay
            expression="excited"
            size="large"
            animation={selectedAnim}
            speechBubble={`Current animation: "${selectedAnim}"`}
          />
        </Card>
      </section>

      {/* 5. Shared UI Buttons */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Buttons & Loading States</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBtnLoading((prev) => !prev)}
          >
            Toggle Loading State ({btnLoading ? 'ON' : 'OFF'})
          </Button>
        </div>

        <div className={styles.buttonRow}>
          <Button variant="primary" size="md" isLoading={btnLoading} leftIcon={<Sparkles size={16} />}>
            Primary Action
          </Button>
          <Button variant="secondary" size="md" isLoading={btnLoading} leftIcon={<Heart size={16} />}>
            Secondary
          </Button>
          <Button variant="outline" size="md" isLoading={btnLoading}>
            Outline
          </Button>
          <Button variant="ghost" size="md" isLoading={btnLoading}>
            Ghost
          </Button>
          <Button variant="danger" size="md" isLoading={btnLoading}>
            Danger
          </Button>
          <Button variant="primary" size="sm">Small</Button>
          <Button variant="primary" size="lg">Large</Button>
        </div>
      </section>

      {/* 6. Badges & Avatars */}
      <section className={styles.section}>
        <h2 className="text-section-title">Badges & Avatars</h2>
        <div className={styles.badgeRow}>
          <Badge variant="lime" size="md" dot>Lime Action</Badge>
          <Badge variant="purple" size="md">Purple Brand</Badge>
          <Badge variant="pink" size="md">Pink Playful</Badge>
          <Badge variant="gold" size="md">Gold XP</Badge>
          <Badge variant="success" size="md">Success</Badge>
          <Badge variant="error" size="md">Error</Badge>
          <Badge variant="neutral" size="sm">Neutral</Badge>
        </div>

        <div className={styles.avatarRow}>
          <Avatar name="Questy Fan" size="sm" status="online" ring="none" />
          <Avatar name="Alex Star" size="md" status="online" ring="lime" />
          <Avatar name="Ria Sol" size="lg" status="busy" ring="purple" />
          <Avatar name="Kavya Glow" size="xl" status="online" ring="gold" />
        </div>
      </section>

      {/* 7. Progress & Loaders */}
      <section className={styles.section}>
        <h2 className="text-section-title">Progress & Loaders</h2>
        <ProgressBar value={72} label="Daily Mission Progress" showValue variant="lime" animated />
        <ProgressBar value={45} label="Squad Evolution XP" showValue variant="gradient" size="lg" animated />

        <div className={styles.loaderRow}>
          <LoadingIndicator variant="spinner" size="md" color="lime" label="Loading spinner" />
          <LoadingIndicator variant="dots" size="md" color="purple" label="Loading dots" />
          <LoadingIndicator variant="pulse" size="md" color="white" label="Loading pulse" />
        </div>

        <div className={styles.skeletonBox}>
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="85%" />
          <Skeleton variant="rectangular" height={48} />
        </div>
      </section>

      {/* 8. Interactive Toast Notifications */}
      <section className={styles.section}>
        <h2 className="text-section-title">Interactive Toasts</h2>
        <div className={styles.toastTriggers}>
          <Button
            variant="primary"
            size="sm"
            onClick={() =>
              showToast({
                type: 'success',
                title: 'Mission Verified! 🏆',
                message: 'Your squad earned +150 XP. Questy is cheering!',
              })
            }
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() =>
              showToast({
                type: 'error',
                title: 'Network Glitch',
                message: 'Could not upload proof photo. Please try again.',
              })
            }
          >
            Trigger Error Toast
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              showToast({
                type: 'warning',
                title: 'Daily Quest Expiring Soon!',
                message: 'Only 30 minutes left on The Midnight Snack Heist.',
              })
            }
          >
            Trigger Warning Toast
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              showToast({
                type: 'info',
                title: 'New Squad Memo',
                message: 'Alex just left a reaction on your memory polaroid.',
              })
            }
          >
            Trigger Info Toast
          </Button>
        </div>
      </section>

      {/* 9. Empty & Error States */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Feedback States</h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEmptyDemo((prev) => !prev)}
            >
              Toggle Empty State
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowErrorDemo((prev) => !prev)}
            >
              Toggle Error State
            </Button>
          </div>
        </div>

        {showEmptyDemo && (
          <EmptyState
            title="No Active Missions"
            description="Your squad crushed all daily quests! Check back tomorrow morning for new adventures."
            action={
              <Button variant="primary" size="sm" onClick={() => setShowEmptyDemo(false)}>
                Back to Squad
              </Button>
            }
          />
        )}

        {showErrorDemo && (
          <ErrorState
            title="Connection Disrupted"
            description="We lost communication with the stardust portal. Retrying..."
            onRetry={() => setShowErrorDemo(false)}
            retryText="Reconnect Portal"
          />
        )}
      </section>
    </div>
  );
};
