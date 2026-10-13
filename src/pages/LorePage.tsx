import React, { useState } from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import {
  PageHeading,
  Card,
  CardFooter,
  Badge,
  Avatar,
  EmptyState,
  Button,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import type { LoreCategory } from '../types';
import styles from './LorePage.module.css';

const STICKERS = [
  { name: "Let's Go! 🚀", id: 'stk-1' },
  { name: 'Mission Accomplished! 🏆', id: 'stk-2' },
  { name: 'Chaos Crew 😈', id: 'stk-3' },
  { name: 'Okay... 😴', id: 'stk-4' },
  { name: 'Sus 🧐', id: 'stk-5' },
  { name: 'Good Try! ✨', id: 'stk-6' },
];

export const LorePage: React.FC = () => {
  const { lore } = useSquad();
  const { showToast } = useToast();

  const [activeCategory, setActiveCategory] = useState<LoreCategory>('all');
  const [likesMap, setLikesMap] = useState<Record<string, { count: number; userLiked: boolean }>>({
    'lore-1': { count: 8, userLiked: false },
    'lore-2': { count: 12, userLiked: true },
    'lore-3': { count: 16, userLiked: false },
    'lore-4': { count: 22, userLiked: true },
  });

  const filteredLore = lore.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const handleToggleLike = (id: string) => {
    setLikesMap((prev) => {
      const current = prev[id] || { count: 0, userLiked: false };
      const nextLiked = !current.userLiked;
      const nextCount = nextLiked ? current.count + 1 : Math.max(0, current.count - 1);
      return {
        ...prev,
        [id]: { count: nextCount, userLiked: nextLiked },
      };
    });

    showToast({
      type: 'info',
      title: 'Squad Reaction Left! 💜',
      message: 'Your squad memory reaction was saved to the vault.',
      duration: 2000,
    });
  };

  const handleSendSticker = (name: string) => {
    showToast({
      type: 'success',
      title: 'Sticker Shared! ✨',
      message: `Posted "${name}" sticker to squad memories.`,
      duration: 2500,
    });
  };

  return (
    <div className={styles.container}>
      <PageHeading
        title="Squad Lore Vault"
        subtitle="Your private squad memories, polaroids, and Questy chronicles"
        badge={<Badge variant="gold" size="sm">Private Vault</Badge>}
      />

      {/* Recap Banner Card */}
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
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <Badge variant="purple" size="sm">Chronicles</Badge>
            <span className="text-caption">{lore.length} Memories Archived</span>
          </div>
          <h3 className={styles.recapTitle}>The Chaos Crew Anthology</h3>
          <p className={styles.recapDesc}>
            These moments are visible only to your 4 squad members. Never shared with the outside world.
          </p>
        </div>
      </Card>

      {/* Category Filter Chips */}
      <div className={styles.filterRow}>
        {(['all', 'missions', 'milestones', 'chaos'] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            className={`${styles.filterChip} ${activeCategory === cat ? styles.filterChipActive : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat === 'all' ? 'All Memories' : cat.charAt(0).toUpperCase() + cat.slice(1)}
          </button>
        ))}
      </div>

      {/* Memory Timeline Grid */}
      <section className={styles.section}>
        {filteredLore.length === 0 ? (
          <EmptyState
            title="No Memories Found"
            description={`No squad lore matches the "${activeCategory}" filter category.`}
            action={
              <Button variant="outline" size="sm" onClick={() => setActiveCategory('all')}>
                Show All Memories
              </Button>
            }
          />
        ) : (
          <div className={styles.memoryGrid}>
            {filteredLore.map((item) => {
              const likeData = likesMap[item.id] || { count: item.likesCount, userLiked: false };

              return (
                <Card key={item.id} variant="standard" padding="lg" className={styles.loreCard}>
                  {/* Polaroid Frame */}
                  <div className={styles.polaroidFrame}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.title} className={styles.polaroidImg} />
                    ) : (
                      <div className={styles.polaroidPlaceholder}>
                        <span style={{ fontSize: '2.5rem' }}>{item.fallbackIcon || '📸'}</span>
                        <span className={styles.polaroidPlaceholderText}>{item.title}</span>
                      </div>
                    )}
                  </div>

                  <div className={styles.loreCardBody}>
                    <div className={styles.metaRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Avatar name={item.submitterName} size="sm" ring="none" />
                        <span className={styles.submitterName}>{item.submitterName}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <Badge variant="lime" size="sm">+{item.xpAwarded} XP</Badge>
                        <span className="text-caption">{item.date}</span>
                      </div>
                    </div>

                    <h3 className={styles.loreItemTitle}>{item.title}</h3>
                    <p className={styles.loreCaption}>{item.caption}</p>

                    {/* Questy Commentary Bubble */}
                    <div className={styles.questyCommentBox}>
                      <span className={styles.questyTag}>Questy AI Lore:</span>
                      <p className={styles.questyQuote}>{item.questyComment}</p>
                    </div>
                  </div>

                  <CardFooter style={{ marginTop: '4px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button
                      type="button"
                      className={`${styles.reactionBtn} ${likeData.userLiked ? styles.reactionBtnActive : ''}`}
                      onClick={() => handleToggleLike(item.id)}
                    >
                      <Heart
                        size={16}
                        fill={likeData.userLiked ? 'var(--color-pink)' : 'none'}
                        color={likeData.userLiked ? 'var(--color-pink)' : '#A4ABC4'}
                      />
                      <span>{likeData.count} loves</span>
                    </button>

                    <div className={styles.reactionBtn}>
                      <MessageSquare size={16} color="#A4ABC4" />
                      <span>{item.commentsCount} notes</span>
                    </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* Unlocked Squad Sticker Pack */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className="text-section-title">Unlocked Squad Stickers</h2>
          <Badge variant="purple" size="sm">6 of 12 Ready</Badge>
        </div>
        <p className="text-secondary" style={{ fontSize: '0.8125rem' }}>
          Tap any sticker to react across squad memories.
        </p>

        <div className={styles.stickerGrid}>
          {STICKERS.map((stk) => (
            <button
              key={stk.id}
              type="button"
              className={styles.stickerItem}
              onClick={() => handleSendSticker(stk.name)}
            >
              <span>{stk.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
