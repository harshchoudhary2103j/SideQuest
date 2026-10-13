import React from 'react';
import { Heart, MessageSquare, Sparkles } from 'lucide-react';
import {
  PageHeading,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot/MascotDisplay';
import styles from './LorePage.module.css';

const STICKERS = [
  { name: "Let's Go! 🚀", color: 'lime' },
  { name: 'Mission Accomplished! 🏆', color: 'gold' },
  { name: 'Chaos Crew 😈', color: 'purple' },
  { name: 'Okay... 😴', color: 'neutral' },
  { name: 'Sus 🧐', color: 'pink' },
  { name: 'Good Try! ✨', color: 'success' },
];

export const LorePage: React.FC = () => {
  return (
    <div className={styles.container}>
      <PageHeading
        title="Squad Lore"
        subtitle="Your private squad memories and Questy chronicles"
        badge={<Badge variant="gold" size="sm">Memory Vault</Badge>}
      />

      {/* Recap Banner */}
      <Card variant="featured" padding="md" className={styles.recapBanner}>
        <div className={styles.mascotThumb}>
          <MascotDisplay
            expression="proud"
            size="medium"
            animation="float"
            speechBubble="Another iconic memory for the books! 💜"
          />
        </div>
        <div className={styles.recapText}>
          <h3 className={styles.recapTitle}>Squad Chronicle #04</h3>
          <p className={styles.recapDesc}>
            4 adventures documented so far. Questy has recorded 350 squad XP.
          </p>
        </div>
      </Card>

      {/* Memory Vault Feed */}
      <section className={styles.section}>
        <h2 className="text-section-title">Recent Memories</h2>

        <div className={styles.memoryGrid}>
          <Card variant="interactive" padding="md">
            <CardHeader>
              <div className={styles.polaroidFrame}>
                <div className={styles.polaroidPlaceholder}>
                  <Sparkles size={28} color="#FFC857" />
                  <span>2 AM Chai & Paratha Proof</span>
                </div>
              </div>
              <CardTitle>The Midnight Feast</CardTitle>
              <CardDescription>
                “Alex fell asleep on the bench, while Ria ate three samosas.”
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.tagRow}>
                <Badge variant="lime" size="sm">+120 XP</Badge>
                <Badge variant="neutral" size="sm">Oct 12</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <span className={styles.reactionCount}>
                <Heart size={14} color="#F04F9D" /> 8 loves
              </span>
              <span className={styles.reactionCount}>
                <MessageSquare size={14} color="#A4ABC4" /> 4 comments
              </span>
            </CardFooter>
          </Card>

          <Card variant="interactive" padding="md">
            <CardHeader>
              <div className={styles.polaroidFrame}>
                <div className={styles.polaroidPlaceholder}>
                  <span style={{ fontSize: '2rem' }}>🐈</span>
                  <span>Encountered Lord Whiskers</span>
                </div>
              </div>
              <CardTitle>The Alley Royalty</CardTitle>
              <CardDescription>
                “Lord Whiskers accepted our cat treat tribute after 20 minutes of negotiation.”
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={styles.tagRow}>
                <Badge variant="gold" size="sm">+90 XP</Badge>
                <Badge variant="neutral" size="sm">Oct 10</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <span className={styles.reactionCount}>
                <Heart size={14} color="#F04F9D" /> 12 loves
              </span>
              <span className={styles.reactionCount}>
                <MessageSquare size={14} color="#A4ABC4" /> 6 comments
              </span>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* Squad Sticker Pack */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Unlocked Squad Stickers</h2>
          <Badge variant="purple" size="sm">6 of 12 Unlocked</Badge>
        </div>

        <div className={styles.stickerGrid}>
          {STICKERS.map((stk, i) => (
            <div key={i} className={styles.stickerItem}>
              <span>{stk.name}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
