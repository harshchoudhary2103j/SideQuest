import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Video,
  Mic,
  CheckCircle2,
  Sparkles,
  X,
  UploadCloud,
  Send,
  AlertCircle,
} from 'lucide-react';
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Badge,
  Avatar,
  Input,
  useToast,
} from '../components/ui';
import { MascotDisplay } from '../components/mascot';
import { useSquad } from '../context';
import type { SubmissionType, SquadMemberSubmission } from '../types';
import styles from './MissionDetailPage.module.css';

export const MissionDetailPage: React.FC = () => {
  const { missionId } = useParams<{ missionId: string }>();
  const navigate = useNavigate();
  const { getMissionById, submitMissionProof, missions } = useSquad();
  const { showToast } = useToast();
  const mission = (missionId ? getMissionById(missionId) : undefined) || missions[0];

  const [activeTab, setActiveTab] = useState<SubmissionType>('photo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  // Simulated Voice Recording
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSeconds, setVoiceSeconds] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URLs on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Voice recording timer simulation
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      interval = setInterval(() => {
        setVoiceSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  if (!mission) {
    return (
      <div className={styles.container}>
        <Button variant="ghost" onClick={() => navigate('/app/missions')} leftIcon={<ArrowLeft size={16} />}>
          Back to Missions
        </Button>
        <Card variant="standard" padding="lg">
          <p>Mission not found in current squad records.</p>
        </Card>
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 50MB strictly enforced by mission-proof bucket)
    const MAX_SIZE = 50 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setFileError('File size exceeds the 50MB limit. Please choose a smaller file.');
      return;
    }

    // Validate MIME types matching storage policy
    const ALLOWED_IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const ALLOWED_VIDEOS = ['video/mp4', 'video/webm'];

    if (activeTab === 'photo' && !ALLOWED_IMAGES.includes(file.type)) {
      setFileError('Unsupported image format. Allowed formats: JPG, PNG, WebP, GIF.');
      return;
    }

    if (activeTab === 'video' && !ALLOWED_VIDEOS.includes(file.type)) {
      setFileError('Unsupported video format. Allowed formats: MP4, WebM.');
      return;
    }

    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }

    const objectUrl = URL.createObjectURL(file);
    setSelectedFile(file);
    setPreviewUrl(objectUrl);
  };

  const handleRemovePreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  };

  const handleSubmitProof = async () => {
    if (isSubmitting) return; // Prevent duplicate clicks
    setFileError(null);

    if (activeTab === 'photo' && !selectedFile && !previewUrl) {
      setFileError('Please snap or upload a proof photo before submitting.');
      return;
    }

    if (activeTab === 'video' && !selectedFile && !previewUrl) {
      setFileError('Please select or record a proof video before submitting.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitMissionProof(mission.id, {
        type: activeTab,
        caption: caption.trim() || undefined,
        file: selectedFile,
        mediaUrl: previewUrl || undefined,
      });

      if (!result.success) {
        setFileError(result.error || 'Failed to submit proof. Please try again.');
        showToast({
          type: 'error',
          title: 'Submission Failed',
          message: result.error || 'Could not persist mission proof.',
        });
        setIsSubmitting(false);
        return;
      }

      showToast({
        type: 'success',
        title: 'Proof Submitted! 🎉',
        message: 'Stored securely in private squad vault. Pending squad review.',
      });

      navigate(`/app/missions/${mission.id}/result`, {
        state: {
          proofUrl: result.signedUrl || previewUrl,
          caption: caption.trim(),
          type: activeTab,
        },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Submission failed';
      setFileError(msg);
      showToast({
        type: 'error',
        title: 'Submission Error',
        message: msg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.container}>
      {/* Navigation Header */}
      <div className={styles.backRow}>
        <button
          type="button"
          onClick={() => navigate('/app/missions')}
          className={styles.backButton}
        >
          <ArrowLeft size={18} />
          <span>Back to Missions</span>
        </button>
      </div>

      {/* Main Mission Header Card */}
      <Card variant="featured" padding="lg" className={styles.headerCard}>
        <div className={styles.badgeRow}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Badge variant="lime" size="sm">{mission.category.toUpperCase()}</Badge>
            <Badge variant="purple" size="sm">{mission.difficulty.toUpperCase()}</Badge>
          </div>
          <span className={styles.xpBadge}>+{mission.xpReward} XP</span>
        </div>

        <div>
          <h1 className={styles.missionTitle}>{mission.title}</h1>
          <p className={styles.missionDesc}>{mission.description}</p>
        </div>

        <div className={styles.metaGrid}>
          <div className={styles.metaItem}>
            <span className={styles.metaVal}>{mission.deadlineText}</span>
            <span className={styles.metaLabel}>Time Window</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaVal}>{mission.squadSubmissions.length} of 4</span>
            <span className={styles.metaLabel}>Squad Proofs</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaVal}>Private Vault</span>
            <span className={styles.metaLabel}>Visibility</span>
          </div>
        </div>
      </Card>

      {/* Rules & Checklist */}
      <Card variant="standard" padding="md" className={styles.rulesSection}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
          <MascotDisplay
            expression={mission.briefingExpression}
            size="small"
            animation="think"
          />
          <div>
            <CardTitle>Mission Rules & Guidelines</CardTitle>
            <CardDescription>{mission.briefingSpeech}</CardDescription>
          </div>
        </div>
        <CardContent>
          <div className={styles.rulesList}>
            {mission.rules.map((rule: string, idx: number) => (
              <div key={idx} className={styles.ruleItem}>
                <CheckCircle2 size={16} color="#45D6A0" className={styles.ruleIcon} />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Submission Station */}
      <Card variant="raised" padding="lg" className={styles.submissionCard}>
        <div className={styles.submissionHeader}>
          <h2 className="text-card-title">Submit Squad Proof</h2>
          <Badge variant="gold" size="sm" icon={<Sparkles size={12} />}>
            +{mission.xpReward} XP
          </Badge>
        </div>

        {/* Format Selector Tabs */}
        <div className={styles.formatTabs} role="tablist">
          <button
            type="button"
            className={`${styles.formatTab} ${activeTab === 'photo' ? styles.formatTabActive : ''}`}
            onClick={() => {
              setActiveTab('photo');
              handleRemovePreview();
            }}
          >
            <Camera size={16} />
            <span>Photo Proof</span>
          </button>
          <button
            type="button"
            className={`${styles.formatTab} ${activeTab === 'video' ? styles.formatTabActive : ''}`}
            onClick={() => {
              setActiveTab('video');
              handleRemovePreview();
            }}
          >
            <Video size={16} />
            <span>Short Video</span>
          </button>
          <button
            type="button"
            className={`${styles.formatTab} ${activeTab === 'voice' ? styles.formatTabActive : ''}`}
            onClick={() => {
              setActiveTab('voice');
              handleRemovePreview();
            }}
          >
            <Mic size={16} />
            <span>Voice Note</span>
          </button>
        </div>

        {/* Tab 1 & 2: Photo or Video File Picker */}
        {(activeTab === 'photo' || activeTab === 'video') && (
          <div>
            {!previewUrl ? (
              <div
                className={styles.dropZone}
                onClick={() => fileInputRef.current?.click()}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
                }}
              >
                <div className={styles.uploadIconWrap}>
                  <UploadCloud size={24} />
                </div>
                <div className={styles.dropText}>
                  <span className={styles.dropTitle}>
                    {activeTab === 'photo' ? 'Tap to choose or snap photo' : 'Tap to select or record video'}
                  </span>
                  <span className={styles.dropHint}>Supports JPG, PNG, WebP, MP4 up to 50MB</span>
                </div>

                {/* Direct Camera Capture Button */}
                <button
                  type="button"
                  className={styles.cameraActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    cameraInputRef.current?.click();
                  }}
                >
                  <Camera size={14} />
                  <span>{activeTab === 'photo' ? 'Open Camera' : 'Record Video'}</span>
                </button>

                {/* File picker input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={activeTab === 'photo' ? 'image/jpeg,image/png,image/webp,image/gif' : 'video/mp4,video/webm'}
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />

                {/* Native camera capture input */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept={activeTab === 'photo' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
                  capture="environment"
                  className={styles.hiddenInput}
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className={styles.previewContainer}>
                {activeTab === 'photo' ? (
                  <img src={previewUrl} alt="Selected proof" className={styles.previewMedia} />
                ) : (
                  <video src={previewUrl} controls className={styles.previewMedia} />
                )}
                <button
                  type="button"
                  className={styles.removePreviewBtn}
                  onClick={handleRemovePreview}
                  aria-label="Remove selected media"
                  disabled={isSubmitting}
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Simulated Voice Note Station */}
        {activeTab === 'voice' && (
          <div className={styles.voiceBox}>
            <button
              type="button"
              className={`${styles.micButton} ${isRecording ? styles.micButtonRecording : ''}`}
              onClick={() => {
                if (isRecording) {
                  setIsRecording(false);
                  showToast({ type: 'info', title: 'Voice Recorded', message: `${voiceSeconds}s voice memo ready!` });
                } else {
                  setIsRecording(true);
                  setVoiceSeconds(0);
                }
              }}
            >
              <Mic size={28} />
            </button>
            <div>
              <p className="text-body-strong">
                {isRecording ? `Recording... 00:${voiceSeconds.toString().padStart(2, '0')}` : voiceSeconds > 0 ? `Recorded: 00:${voiceSeconds.toString().padStart(2, '0')}` : 'Tap microphone to simulate voice note'}
              </p>
              <p className="text-caption">Hold for spontaneous squad commentary</p>
            </div>
          </div>
        )}

        {fileError && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-error)', fontSize: '0.8125rem' }}>
            <AlertCircle size={16} />
            <span>{fileError}</span>
          </div>
        )}

        {/* Caption Field */}
        <Input
          label="Squad Caption / Story Notes"
          placeholder="What made this hilarious or weird? E.g., 'Ate this under the bridge with Alex...'"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isSubmitting}
        />

        {isSubmitting && (
          <div className={styles.uploadingNote}>
            <UploadCloud size={16} className={styles.spinningIcon} />
            <span>Securing proof in private squad vault and updating records...</span>
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          fullWidth
          isLoading={isSubmitting}
          disabled={isSubmitting}
          rightIcon={<Send size={18} />}
          onClick={handleSubmitProof}
        >
          {isSubmitting ? 'Securing Proof in Vault...' : 'Submit Proof to Squad'}
        </Button>
      </Card>

      {/* Squad Submissions Feed with Authorized Proof Display */}
      {mission.squadSubmissions.length > 0 && (
        <section className={styles.squadSubmissionsSection}>
          <h2 className="text-section-title">Squad Submissions ({mission.squadSubmissions.length})</h2>
          <Card variant="standard" padding="md">
            {mission.squadSubmissions.map((sub: SquadMemberSubmission) => (
              <div key={sub.id} className={styles.submissionItem}>
                <Avatar name={sub.memberName} size="md" status="online" ring="lime" />
                <div className={styles.subMeta}>
                  <div className={styles.subNameRow}>
                    <span className={styles.subName}>{sub.memberName}</span>
                    <span className={styles.subTime}>{sub.submittedAt}</span>
                  </div>
                  {sub.caption && <p className={styles.subCaption}>{sub.caption}</p>}
                  {sub.mediaUrl && (
                    sub.type === 'video' ? (
                      <video src={sub.mediaUrl} controls className={styles.feedMedia} />
                    ) : (
                      <img src={sub.mediaUrl} alt="Squad proof" className={styles.feedMedia} />
                    )
                  )}
                </div>
              </div>
            ))}
          </Card>
        </section>
      )}
    </div>
  );
};
