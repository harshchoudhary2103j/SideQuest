import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Users, PlusCircle, CheckCircle2, Shield } from 'lucide-react';
import { Button, Card, Badge, Avatar, Input, useToast } from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import styles from './OnboardingPage.module.css';

export const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const { squad, createOrJoinSquad } = useSquad();
  const { showToast } = useToast();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Player profile state
  const [userName, setUserName] = useState('Alex Thorne');
  const [userHandle, setUserHandle] = useState('@alex_t');
  const [avatarRing, setAvatarRing] = useState<'lime' | 'purple' | 'gold'>('lime');

  // Step 3: Squad state
  const [squadMode, setSquadMode] = useState<'create' | 'join'>('create');
  const [newSquadName, setNewSquadName] = useState('The Chaos Crew');
  const [newSquadMotto, setNewSquadMotto] = useState('Always up for spontaneous trouble.');
  const [joinCode, setJoinCode] = useState('CHAOS-7729');
  const [inputError, setInputError] = useState<string | null>(null);

  const handleNext = () => {
    setInputError(null);

    if (currentStep === 1) {
      if (!userName.trim()) {
        setInputError('Please enter a display name for your adventurer.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      if (squadMode === 'create' && !newSquadName.trim()) {
        setInputError('Please give your squad a name.');
        return;
      }
      if (squadMode === 'join' && !joinCode.trim()) {
        setInputError('Please enter a squad invite code.');
        return;
      }
      setCurrentStep(4);
    } else if (currentStep === 4) {
      // Save to context
      createOrJoinSquad({
        userName: userName.trim(),
        squadName: squadMode === 'create' ? newSquadName.trim() : undefined,
        inviteCode: squadMode === 'join' ? joinCode.trim() : undefined,
        isCreating: squadMode === 'create',
      });

      showToast({
        type: 'success',
        title: 'Welcome to SideQuest! 🚀',
        message: `You're all set with ${squadMode === 'create' ? newSquadName : squad.name}.`,
      });

      navigate('/app/squad');
    }
  };

  const handleBack = () => {
    setInputError(null);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      navigate('/welcome');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header with back button and progress indicator */}
      <header className={styles.header}>
        <button
          type="button"
          onClick={handleBack}
          className={styles.backButton}
          aria-label="Previous step"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>

        <div className={styles.progressDots} aria-label={`Step ${currentStep} of 4`}>
          {[1, 2, 3, 4].map((stepNum) => (
            <span
              key={stepNum}
              className={`${styles.dot} ${stepNum === currentStep ? styles.dotActive : stepNum < currentStep ? styles.dotCompleted : ''}`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => navigate('/app/squad')}
          className={styles.skipButton}
        >
          Skip demo
        </button>
      </header>

      <main className={styles.main}>
        {/* Step 1: Adventurer Identity */}
        {currentStep === 1 && (
          <div className={styles.stepContent}>
            <div className={styles.mascotMini}>
              <MascotDisplay expression="happy" size="medium" animation="idle" speechBubble="Who are you, adventurer? ✨" />
            </div>

            <Card variant="raised" padding="lg" className={styles.formCard}>
              <Badge variant="lime" size="sm">Step 1 of 4 • Identity</Badge>
              <h1 className={styles.stepTitle}>Create Your Adventurer Card</h1>
              <p className={styles.stepDesc}>This is how your friends will see you on mission proofs and reactions.</p>

              {/* Avatar Ring Preview */}
              <div className={styles.avatarPreviewRow}>
                <Avatar name={userName || 'SQ'} size="xl" status="online" ring={avatarRing} />
                <div className={styles.colorPicks}>
                  <span className="text-caption">Aura Color:</span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {(['lime', 'purple', 'gold'] as const).map((clr) => (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => setAvatarRing(clr)}
                        className={`${styles.auraBtn} ${avatarRing === clr ? styles.auraBtnActive : ''}`}
                        style={{
                          backgroundColor:
                            clr === 'lime' ? 'var(--color-primary-action)' : clr === 'purple' ? 'var(--color-purple)' : 'var(--color-gold)',
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <Input
                label="Display Name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="E.g. Alex Thorne"
                required
                error={inputError || undefined}
              />

              <Input
                label="Handle / Tag"
                value={userHandle}
                onChange={(e) => setUserHandle(e.target.value)}
                placeholder="@alex_t"
              />
            </Card>
          </div>
        )}

        {/* Step 2: Game Principle & Questy Hook */}
        {currentStep === 2 && (
          <div className={styles.stepContent}>
            <div className={styles.mascotMini}>
              <MascotDisplay expression="excited" size="large" animation="float" speechBubble="Small quests. Big stories! ⭐" />
            </div>

            <Card variant="raised" padding="lg" className={styles.formCard}>
              <Badge variant="purple" size="sm">Step 2 of 4 • How It Works</Badge>
              <h1 className={styles.stepTitle}>Your Shared Squad Mascot</h1>
              <p className={styles.stepDesc}>
                Questy belongs to the whole squad. When you complete real-life missions, Questy gains XP and evolves through 5 epic forms.
              </p>

              <div className={styles.rulesPills}>
                <div className={styles.rulePill}>
                  <CheckCircle2 size={16} color="#D4FF38" />
                  <span>Real life only (no fake internet images)</span>
                </div>
                <div className={styles.rulePill}>
                  <CheckCircle2 size={16} color="#D4FF38" />
                  <span>Private friend groups (strictly no strangers)</span>
                </div>
                <div className={styles.rulePill}>
                  <CheckCircle2 size={16} color="#D4FF38" />
                  <span>Permanent squad lore memory vault</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Step 3: Squad Selection (Create vs Join) */}
        {currentStep === 3 && (
          <div className={styles.stepContent}>
            <div className={styles.mascotMini}>
              <MascotDisplay expression="mischievous" size="medium" animation="think" speechBubble="Join an existing squad or forge a new one? 🤝" />
            </div>

            <Card variant="raised" padding="lg" className={styles.formCard}>
              <Badge variant="gold" size="sm">Step 3 of 4 • Squad Setup</Badge>
              <h1 className={styles.stepTitle}>Form Your Circle</h1>

              {/* Mode Toggle Buttons */}
              <div className={styles.toggleRow}>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${squadMode === 'create' ? styles.toggleBtnActive : ''}`}
                  onClick={() => {
                    setSquadMode('create');
                    setInputError(null);
                  }}
                >
                  <PlusCircle size={16} />
                  <span>Create Squad</span>
                </button>
                <button
                  type="button"
                  className={`${styles.toggleBtn} ${squadMode === 'join' ? styles.toggleBtnActive : ''}`}
                  onClick={() => {
                    setSquadMode('join');
                    setInputError(null);
                  }}
                >
                  <Users size={16} />
                  <span>Join with Code</span>
                </button>
              </div>

              {squadMode === 'create' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Squad Name"
                    value={newSquadName}
                    onChange={(e) => setNewSquadName(e.target.value)}
                    placeholder="E.g. Midnight Marauders"
                    required
                    error={inputError || undefined}
                  />
                  <Input
                    label="Squad Motto"
                    value={newSquadMotto}
                    onChange={(e) => setNewSquadMotto(e.target.value)}
                    placeholder="E.g. Always up for spontaneous trouble"
                  />
                  <div className={styles.demoInvitePreview}>
                    <Shield size={16} color="#FFC857" />
                    <span>Your generated demo invite code: <strong>CHAOS-7729</strong></span>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <Input
                    label="Squad Invite Code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="E.g. CHAOS-7729"
                    required
                    helperText="Try entering 'CHAOS-7729' to join The Chaos Crew"
                    error={inputError || undefined}
                  />
                  <div className={styles.squadPreviewBox}>
                    <Avatar name="Chaos Crew" size="sm" ring="lime" />
                    <div>
                      <span className="text-body-strong">The Chaos Crew</span>
                      <p className="text-caption">4 active members • Level 1 Star Pup</p>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          </div>
        )}

        {/* Step 4: Ready Celebration */}
        {currentStep === 4 && (
          <div className={styles.stepContent}>
            <div className={styles.mascotMini}>
              <MascotDisplay expression="proud" size="large" animation="celebrate" speechBubble="Ready to crush daily quests! 👑" showStageBadge />
            </div>

            <Card variant="featured" padding="lg" className={styles.formCard}>
              <Badge variant="lime" size="sm">Step 4 of 4 • Ready!</Badge>
              <h1 className={styles.stepTitle}>Squad Portal Activated</h1>
              <p className={styles.stepDesc}>
                You are entering <strong>{squadMode === 'create' ? newSquadName : squad.name}</strong> as <strong>{userName}</strong>. Questy is eager to begin!
              </p>

              <div className={styles.readySummaryBox}>
                <div className={styles.summaryItem}>
                  <span className="text-caption">Squad Mascot</span>
                  <span className="text-body-strong">★ Lv.1 Star Pup</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className="text-caption">Today’s Quest</span>
                  <span className="text-body-strong">Find the Weirdest Snack</span>
                </div>
              </div>
            </Card>
          </div>
        )}

        <div className={styles.actionWrap}>
          <Button
            variant="primary"
            size="lg"
            fullWidth
            rightIcon={<ChevronRight size={18} />}
            onClick={handleNext}
          >
            {currentStep === 4 ? 'Launch Squad Base' : 'Continue'}
          </Button>
        </div>
      </main>
    </div>
  );
};
