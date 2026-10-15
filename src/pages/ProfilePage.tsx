import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Trophy, Lock, Unlock, Copy, Edit3, LogOut, Loader2, Shield, UserPlus } from 'lucide-react';
import {
  PageHeading,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Badge,
  Avatar,
  ProgressBar,
  Button,
  Modal,
  Input,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { EVOLUTION_STAGES, STAGE_XP_THRESHOLDS } from '../components/mascot/mascotRegistry';
import { useSquad, useAuth } from '../context';
import type { MascotEvolutionLevel } from '../types/mascot';
import styles from './ProfilePage.module.css';

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { squad, hasSquad } = useSquad();
  const { user, profile, updateProfile, signOut } = useAuth();
  const { showToast } = useToast();

  const currentMember = squad.members.find((m) => m.isCurrentUser) || squad.members[0];

  // Derive real user display details
  const displayName = profile?.display_name || user?.user_metadata?.display_name || currentMember?.name || 'Alex Thorne';
  const displayHandle = user?.email ? `@${user.email.split('@')[0]}` : (currentMember?.handle || '@alex_t');
  const userAvatarRing = (profile?.aura as 'lime' | 'purple' | 'gold') || currentMember?.avatarRing || 'lime';
  const userRole = currentMember?.role || 'member';

  const [previewLevel, setPreviewLevel] = useState<MascotEvolutionLevel>(squad.evolutionLevel);

  // Edit Profile Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState(displayName);
  const [editAura, setEditAura] = useState<'lime' | 'purple' | 'gold'>(userAvatarRing);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const activeStage = EVOLUTION_STAGES[previewLevel];
  const isUnlocked = previewLevel <= squad.evolutionLevel;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(squad.inviteCode);
    showToast({
      type: 'success',
      title: 'Squad Invite Code Copied! 📋',
      message: `Code: ${squad.inviteCode} copied. Share with your squad!`,
    });
  };

  const handleOpenEdit = () => {
    setEditName(displayName);
    setEditAura(userAvatarRing);
    setEditError(null);
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async () => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setEditError('Display name cannot be empty.');
      return;
    }
    if (trimmed.length > 50) {
      setEditError('Display name must be 50 characters or less.');
      return;
    }

    setIsSavingProfile(true);
    setEditError(null);
    try {
      const { error } = await updateProfile({
        display_name: trimmed,
        aura: editAura,
      });

      if (error) {
        setEditError(error.message);
        showToast({
          type: 'error',
          title: 'Update Failed',
          message: error.message,
        });
        return;
      }

      showToast({
        type: 'success',
        title: 'Profile Updated! ✨',
        message: 'Your adventurer card has been saved to Supabase.',
      });
      setIsEditModalOpen(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.';
      setEditError(msg);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    showToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have been safely signed out.',
    });
    navigate('/welcome');
  };

  return (
    <div className={styles.container}>
      <PageHeading
        title="Squad Profile"
        subtitle="Your adventurer card and Questy evolution vault"
        badge={<Badge variant="lime" size="sm">{hasSquad ? squad.name : 'Adventurer'}</Badge>}
        actions={
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Edit3 size={14} />}
            onClick={handleOpenEdit}
          >
            Edit Profile
          </Button>
        }
      />

      {/* Adventurer Identity Card */}
      <Card variant="featured" padding="lg" className={styles.adventurerCard}>
        <div className={styles.profileHeader}>
          <Avatar
            name={displayName}
            size="xl"
            status={currentMember.status}
            ring={userAvatarRing}
          />
          <div className={styles.profileMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className={styles.userName}>{displayName}</h2>
              <Badge variant="purple" size="sm">{userRole}</Badge>
            </div>
            <span className={styles.squadRole}>
              {displayHandle} • {hasSquad ? squad.name : 'No Squad Yet'}
            </span>

            <div className={styles.badgeRow}>
              <Badge variant="lime" size="sm" icon={<Flame size={12} />}>
                {squad.streakDays} Day Streak
              </Badge>
              <Badge variant="gold" size="sm" icon={<Trophy size={12} />}>
                {currentMember.completedMissions} Quests Crushed
              </Badge>
            </div>
          </div>
        </div>

        <div className={styles.statsGrid}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{currentMember.personalXp}</span>
            <span className={styles.statLabel}>Personal XP</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>#{currentMember.personalXp >= 400 ? '1' : '2'}</span>
            <span className={styles.statLabel}>Squad Rank</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>{hasSquad ? squad.members.length : 0}</span>
            <span className={styles.statLabel}>Squad Mates</span>
          </div>
        </div>
      </Card>

      {/* Questy Evolution Vault Showcase */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h2 className="text-section-title">Mascot Evolution Vault</h2>
            <Badge variant="purple" size="sm">All 5 Stages</Badge>
          </div>
          <span className="text-caption">
            Current Form: Lv.{squad.evolutionLevel}
          </span>
        </div>

        <Card variant="standard" padding="lg" className={styles.evolutionCard}>
          {/* Status Flag */}
          <div className={styles.statusBannerRow}>
            {previewLevel === squad.evolutionLevel ? (
              <Badge variant="lime" size="sm" icon={<Flame size={12} />}>
                Active Squad Form (Lv.{previewLevel})
              </Badge>
            ) : isUnlocked ? (
              <Badge variant="purple" size="sm" icon={<Unlock size={12} />}>
                Unlocked Archive Form (Lv.{previewLevel})
              </Badge>
            ) : (
              <Badge variant="neutral" size="sm" icon={<Lock size={12} />}>
                Locked Preview • Requires {STAGE_XP_THRESHOLDS[previewLevel]} Squad XP ({Math.max(0, STAGE_XP_THRESHOLDS[previewLevel] - squad.currentXp)} XP needed)
              </Badge>
            )}
          </div>

          <div className={styles.stageMascotWrap}>
            <MascotDisplay
              key={previewLevel}
              evolutionLevel={previewLevel}
              expression={previewLevel === squad.evolutionLevel ? 'excited' : isUnlocked ? 'happy' : 'sleepy'}
              size="large"
              animation={previewLevel === squad.evolutionLevel ? 'float' : 'none'}
              showStageBadge={false}
              speechBubble={
                previewLevel === squad.evolutionLevel
                  ? activeStage.tagline
                  : isUnlocked
                  ? activeStage.tagline
                  : `Locked: Unlocks at ${STAGE_XP_THRESHOLDS[previewLevel]} Squad XP 🔒`
              }
            />
          </div>

          <div className={styles.stageDescriptionBox}>
            <h3 className={styles.stageName}>Level {activeStage.level}: {activeStage.name}</h3>
            <p className={styles.stageTagline}>“{activeStage.tagline}”</p>
            <p className={styles.stageDesc}>{activeStage.description}</p>

            {!isUnlocked && (
              <div className={styles.lockedNotice}>
                <Lock size={14} color="#FFC857" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Preview Only:</strong> Locked stages cannot become your active squad companion until unlocked through real-world quests. Complete missions to earn XP!
                </span>
              </div>
            )}
          </div>

          {/* Level Switcher Selector */}
          <div className={styles.stageSelectorRow}>
            {([1, 2, 3, 4, 5] as MascotEvolutionLevel[]).map((lvl) => {
              const unlocked = lvl <= squad.evolutionLevel;
              const isCurrentForm = lvl === squad.evolutionLevel;
              const isSelected = lvl === previewLevel;

              let btnClass = styles.levelButton;
              if (isSelected) {
                if (isCurrentForm) {
                  btnClass = `${styles.levelButton} ${styles.levelButtonCurrent}`;
                } else if (unlocked) {
                  btnClass = `${styles.levelButton} ${styles.levelButtonUnlockedActive}`;
                } else {
                  btnClass = `${styles.levelButton} ${styles.levelButtonLockedActive}`;
                }
              }

              return (
                <button
                  key={lvl}
                  type="button"
                  className={btnClass}
                  onClick={() => setPreviewLevel(lvl)}
                  title={
                    isCurrentForm
                      ? 'Current Active Squad Form'
                      : unlocked
                      ? `Unlocked Stage ${lvl}`
                      : `Locked Stage ${lvl} (Requires ${STAGE_XP_THRESHOLDS[lvl]} XP)`
                  }
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {!unlocked && <Lock size={10} />}
                    Lv.{lvl}
                  </span>
                  {isCurrentForm && (
                    <span className={styles.currentFormTag}>Active</span>
                  )}
                </button>
              );
            })}
          </div>

          <div style={{ width: '100%', maxWidth: '380px', marginTop: '16px' }}>
            <ProgressBar
              value={squad.currentXp}
              max={squad.targetXp}
              label={`Squad Progress toward next level: ${squad.currentXp} / ${squad.targetXp} XP`}
              showValue
              variant="gradient"
              size="sm"
            />
          </div>
        </Card>
      </section>

      {/* Squad Settings & Invite Box */}
      <section className={styles.section}>
        <h2 className="text-section-title">Squad Details & Invitation</h2>
        {hasSquad ? (
          <Card variant="standard" padding="md">
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardTitle>{squad.name}</CardTitle>
                <Badge variant="gold" size="sm">Level {squad.level}</Badge>
              </div>
              <CardDescription>{squad.motto}</CardDescription>
            </CardHeader>

            <CardContent>
              <div className={styles.inviteShareBox}>
                <div className={styles.codeTextGroup}>
                  <span className="text-caption">Squad Invite Code</span>
                  <span className={styles.codeNumber}>{squad.inviteCode}</span>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Copy size={14} />}
                  onClick={handleCopyCode}
                >
                  Copy Code
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card variant="standard" padding="lg">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '12px' }}>
              <Shield size={32} color="#D4FF38" />
              <div>
                <h3 className="text-body-strong">You Haven't Joined a Squad Yet</h3>
                <p className="text-caption" style={{ maxWidth: '360px', marginTop: '4px' }}>
                  SideQuest is best experienced with your inner circle. Forge a new squad or enter a friend's invite code to get started.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                leftIcon={<UserPlus size={16} />}
                onClick={() => navigate('/onboarding')}
              >
                Join or Create Squad
              </Button>
            </div>
          </Card>
        )}
      </section>

      {/* Squad Roster List */}
      {hasSquad && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className="text-section-title">Squad Roster ({squad.members.length})</h2>
            <span className="text-caption">Inner Circle</span>
          </div>

          <Card variant="standard" padding="md">
            <div className={styles.rosterList}>
              {squad.members.map((member) => (
                <div key={member.id} className={styles.rosterItem}>
                  <Avatar name={member.name} size="md" status={member.status} ring={member.avatarRing} />
                  <div className={styles.rosterMeta}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className="text-body-strong">{member.name}</span>
                      {member.isCurrentUser && <Badge variant="lime" size="sm">You</Badge>}
                    </div>
                    <span className="text-caption">{member.role} • {member.completedMissions} quests</span>
                  </div>
                  <span className={styles.rosterXp}>+{member.personalXp} XP</span>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Account & Session Management */}
      <section className={styles.section}>
        <h2 className="text-section-title">Account & Security</h2>
        <Card variant="standard" padding="md" className={styles.accountCard}>
          <div className={styles.accountDetails}>
            <span className={styles.accountLabel}>Authenticated Email</span>
            <span className={styles.accountVal}>{user?.email || 'Local Mock Session'}</span>
          </div>
          <div className={styles.accountDetails}>
            <span className={styles.accountLabel}>User ID (Supabase Auth)</span>
            <span className={styles.accountVal}>{user?.id ? `${user.id.slice(0, 8)}...${user.id.slice(-6)}` : 'N/A'}</span>
          </div>

          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="outline"
              size="md"
              leftIcon={<LogOut size={16} />}
              onClick={handleSignOut}
            >
              Sign Out
            </Button>
          </div>
        </Card>
      </section>

      {/* Edit Profile Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Adventurer Profile"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveProfile();
          }}
          style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <Input
            label="Display Name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            placeholder="E.g. Alex Thorne"
            required
            error={editError || undefined}
          />

          <div>
            <label className="text-caption" style={{ display: 'block', marginBottom: '6px', color: 'var(--color-text-secondary)' }}>
              Aura Color
            </label>
            <div className={styles.auraRow}>
              {(['lime', 'purple', 'gold'] as const).map((aura) => (
                <button
                  key={aura}
                  type="button"
                  onClick={() => setEditAura(aura)}
                  className={`${styles.auraOption} ${editAura === aura ? styles.auraOptionActive : ''}`}
                  style={{
                    backgroundColor:
                      aura === 'lime' ? 'var(--color-primary-action)' : aura === 'purple' ? 'var(--color-purple)' : 'var(--color-gold)',
                  }}
                  title={`${aura.charAt(0).toUpperCase() + aura.slice(1)} Aura`}
                />
              ))}
            </div>
          </div>

          <div className={styles.modalButtons}>
            <Button
              variant="ghost"
              size="md"
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              disabled={isSavingProfile}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              type="submit"
              disabled={isSavingProfile}
              leftIcon={isSavingProfile ? <Loader2 size={16} className="animate-spin" /> : undefined}
            >
              {isSavingProfile ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
