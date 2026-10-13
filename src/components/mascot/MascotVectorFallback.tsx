import React from 'react';
import type {
  MascotExpression,
  MascotEvolutionLevel,
  MascotPose,
} from '../../types/mascot';

interface MascotVectorFallbackProps {
  expression?: MascotExpression;
  evolutionLevel?: MascotEvolutionLevel;
  pose?: MascotPose;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  alt?: string;
}

export const MascotVectorFallback: React.FC<MascotVectorFallbackProps> = ({
  expression = 'happy',
  evolutionLevel = 1,
  pose = 'wave',
  className = '',
  alt = 'Questy the Stardust Creature',
}) => {
  // Eye variations based on expression
  const renderEyes = () => {
    switch (expression) {
      case 'excited':
        return (
          <g>
            {/* Left eye sparkle star */}
            <circle cx="40" cy="52" r="7" fill="#4C1D95" />
            <polygon points="40,47 41.5,50.5 45,52 41.5,53.5 40,57 38.5,53.5 35,52 38.5,50.5" fill="#D4FF38" />
            <circle cx="37" cy="49" r="2.2" fill="#FFFFFF" />
            {/* Right eye sparkle star */}
            <circle cx="60" cy="52" r="7" fill="#4C1D95" />
            <polygon points="60,47 61.5,50.5 65,52 61.5,53.5 60,57 58.5,53.5 55,52 58.5,50.5" fill="#D4FF38" />
            <circle cx="57" cy="49" r="2.2" fill="#FFFFFF" />
          </g>
        );
      case 'mischievous':
        return (
          <g>
            {/* Mischievous tilted eyes */}
            <ellipse cx="40" cy="53" rx="6.5" ry="5.5" fill="#4C1D95" transform="rotate(-10 40 53)" />
            <circle cx="39" cy="51" r="2" fill="#FFFFFF" />
            <ellipse cx="60" cy="53" rx="6.5" ry="5.5" fill="#4C1D95" transform="rotate(10 60 53)" />
            <circle cx="59" cy="51" r="2" fill="#FFFFFF" />
          </g>
        );
      case 'surprised':
        return (
          <g>
            {/* Big round wide eyes */}
            <circle cx="39" cy="50" r="7.5" fill="#4C1D95" />
            <circle cx="37" cy="48" r="3" fill="#FFFFFF" />
            <circle cx="61" cy="50" r="7.5" fill="#4C1D95" />
            <circle cx="59" cy="48" r="3" fill="#FFFFFF" />
          </g>
        );
      case 'sleepy':
        return (
          <g>
            {/* Sleepy closed arcs */}
            <path d="M34 54 Q40 60 46 54" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M54 54 Q60 60 66 54" stroke="#4C1D95" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Zzz floating bubbles */}
            <text x="68" y="44" fill="#7C3AED" fontSize="10" fontWeight="bold" fontFamily="sans-serif">z</text>
            <text x="74" y="36" fill="#A78BFA" fontSize="13" fontWeight="bold" fontFamily="sans-serif">Z</text>
          </g>
        );
      case 'proud':
        return (
          <g>
            {/* Confident happy arches */}
            <path d="M34 53 Q40 47 46 53" stroke="#4C1D95" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="50" r="1.5" fill="#D4FF38" />
            <path d="M54 53 Q60 47 66 53" stroke="#4C1D95" strokeWidth="3.2" strokeLinecap="round" fill="none" />
            <circle cx="58" cy="50" r="1.5" fill="#D4FF38" />
          </g>
        );
      case 'sad':
        return (
          <g>
            {/* Droopy teary eyes */}
            <ellipse cx="40" cy="53" rx="6" ry="7" fill="#4C1D95" />
            <circle cx="39" cy="51" r="2.5" fill="#FFFFFF" />
            <circle cx="35" cy="57" r="2" fill="#60A5FA" opacity="0.8" />
            <ellipse cx="60" cy="53" rx="6" ry="7" fill="#4C1D95" />
            <circle cx="59" cy="51" r="2.5" fill="#FFFFFF" />
          </g>
        );
      case 'angry':
        return (
          <g>
            {/* Slanted brows with cute eyes */}
            <line x1="33" y1="45" x2="46" y2="49" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="40" cy="53" rx="5.5" ry="6.5" fill="#4C1D95" />
            <circle cx="39" cy="51" r="1.8" fill="#FFFFFF" />
            <line x1="67" y1="45" x2="54" y2="49" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
            <ellipse cx="60" cy="53" rx="5.5" ry="6.5" fill="#4C1D95" />
            <circle cx="59" cy="51" r="1.8" fill="#FFFFFF" />
          </g>
        );
      case 'happy':
      default:
        return (
          <g>
            {/* Default signature large violet eyes */}
            <ellipse cx="40" cy="52" rx="6.5" ry="7.5" fill="#4C1D95" />
            <circle cx="38" cy="49" r="2.8" fill="#FFFFFF" />
            <circle cx="42" cy="54" r="1.2" fill="#FFFFFF" />
            <ellipse cx="60" cy="52" rx="6.5" ry="7.5" fill="#4C1D95" />
            <circle cx="58" cy="49" r="2.8" fill="#FFFFFF" />
            <circle cx="62" cy="54" r="1.2" fill="#FFFFFF" />
          </g>
        );
    }
  };

  // Mouth variations
  const renderMouth = () => {
    switch (expression) {
      case 'excited':
        return (
          <path d="M45 61 Q50 68 55 61 Z" fill="#F04F9D" stroke="#11162A" strokeWidth="1.5" />
        );
      case 'mischievous':
        return (
          <path d="M46 62 Q52 66 57 60" stroke="#11162A" strokeWidth="2" strokeLinecap="round" fill="none" />
        );
      case 'surprised':
        return (
          <ellipse cx="50" cy="63" rx="3.5" ry="4.5" fill="#4C1D95" />
        );
      case 'sleepy':
        return (
          <path d="M47 62 Q50 64 53 62" stroke="#11162A" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        );
      case 'proud':
        return (
          <path d="M44 61 Q50 66 56 61" stroke="#11162A" strokeWidth="2.2" strokeLinecap="round" fill="none" />
        );
      case 'sad':
        return (
          <path d="M45 64 Q50 60 55 64" stroke="#11162A" strokeWidth="2" strokeLinecap="round" fill="none" />
        );
      case 'angry':
        return (
          <path d="M46 63 L54 63" stroke="#11162A" strokeWidth="2.2" strokeLinecap="round" />
        );
      case 'happy':
      default:
        return (
          <path d="M45 60 Q50 65 55 60" stroke="#11162A" strokeWidth="2" strokeLinecap="round" fill="none" />
        );
    }
  };

  // Render accessories based on evolution stage
  const renderEvolutionStageDetails = () => {
    switch (evolutionLevel) {
      case 5:
        // Legendary Questy: Cosmic Wings + Ethereal Halo + Grand Cape
        return (
          <g>
            {/* Celestial Wings */}
            <path
              d="M18 48 C6 30, 2 52, 14 68 C8 78, 20 74, 24 64 Z"
              fill="url(#legendaryWingGrad)"
              opacity="0.95"
            />
            <path
              d="M82 48 C94 30, 98 52, 86 68 C92 78, 80 74, 76 64 Z"
              fill="url(#legendaryWingGrad)"
              opacity="0.95"
            />
            {/* Stellar Aura */}
            <circle cx="50" cy="54" r="44" stroke="#D4FF38" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
            {/* Hero Mantle */}
            <path d="M30 68 C35 76, 65 76, 70 68 C74 84, 26 84, 30 68 Z" fill="#7C3AED" />
          </g>
        );
      case 4:
        // Star Guardian: Guardian Pauldrons / Mini Wing Flares
        return (
          <g>
            <path d="M22 52 C14 42, 14 58, 23 66 Z" fill="#7C3AED" opacity="0.8" />
            <path d="M78 52 C86 42, 86 58, 77 66 Z" fill="#7C3AED" opacity="0.8" />
            {/* Gold pauldrons */}
            <circle cx="28" cy="62" r="4" fill="#FFC857" />
            <circle cx="72" cy="62" r="4" fill="#FFC857" />
          </g>
        );
      case 3:
        // Quest Pal: Glowing Adventure Satchel / Backpack Straps
        return (
          <g>
            <path d="M26 62 Q30 72 34 78" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
            <path d="M74 62 Q70 72 66 78" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round" />
            {/* Cute side satchel */}
            <rect x="70" y="66" width="10" height="12" rx="3" fill="#7C3AED" />
            <circle cx="75" cy="72" r="1.5" fill="#D4FF38" />
          </g>
        );
      case 2:
        // Glow Buddy: Mini Backpack and Straps
        return (
          <g>
            <path d="M28 64 Q32 72 36 76" stroke="#9061F9" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M72 64 Q68 72 64 76" stroke="#9061F9" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        );
      case 1:
      default:
        return null;
    }
  };

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label={alt}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', width: '100%', height: '100%' }}
    >
      <defs>
        {/* Body Gradient: Stardust fluffy white with soft lavender tone */}
        <radialGradient id="bodyGrad" cx="45%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#F5F6FF" />
          <stop offset="100%" stopColor="#E2DBFC" />
        </radialGradient>

        {/* Horn Gradient: Violet with bright purple tip */}
        <linearGradient id="hornGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#6D28D9" />
          <stop offset="60%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#A78BFA" />
        </linearGradient>

        {/* Crown Gold Gradient */}
        <linearGradient id="goldCrownGrad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#D97706" />
          <stop offset="50%" stopColor="#FFC857" />
          <stop offset="100%" stopColor="#FEF08A" />
        </linearGradient>

        {/* Star Charm Lime Gradient */}
        <linearGradient id="limeStarGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E9FF70" />
          <stop offset="100%" stopColor="#D4FF38" />
        </linearGradient>

        {/* Legendary Wing Gradient */}
        <linearGradient id="legendaryWingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C084FC" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#D4FF38" />
        </linearGradient>

        {/* Soft shadow filter */}
        <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Atmospheric Stardust Aura */}
      <circle cx="50" cy="56" r="38" fill="#7C3AED" fillOpacity={0.12 + evolutionLevel * 0.04} />

      {/* Evolution Back Details (Wings, Straps, Satchels) */}
      {renderEvolutionStageDetails()}

      {/* Left Horn */}
      <path
        d="M26 38 C21 22, 30 18, 33 30 Z"
        fill="url(#hornGrad)"
      />
      {/* Right Horn */}
      <path
        d="M74 38 C79 22, 70 18, 67 30 Z"
        fill="url(#hornGrad)"
      />

      {/* Main Fluffy Stardust Body */}
      <ellipse
        cx="50"
        cy="56"
        rx="32"
        ry="28"
        fill="url(#bodyGrad)"
        stroke="#D5CDFA"
        strokeWidth="1.2"
      />

      {/* Fluffy Side Tufts */}
      <circle cx="21" cy="56" r="8" fill="url(#bodyGrad)" />
      <circle cx="79" cy="56" r="8" fill="url(#bodyGrad)" />

      {/* Questy Golden Crown */}
      <g id="crown" transform={evolutionLevel >= 4 ? 'scale(1.15) translate(-6.5, -4)' : ''}>
        <path
          d="M39 25 L43 31 L50 24 L57 31 L61 25 L59 34 L41 34 Z"
          fill="url(#goldCrownGrad)"
          stroke="#B45309"
          strokeWidth="0.8"
        />
        {/* Crown Star / Jewel */}
        <circle cx="50" cy="27" r="1.6" fill="#D4FF38" />
        <circle cx="43" cy="30" r="1" fill="#FFFFFF" />
        <circle cx="57" cy="30" r="1" fill="#FFFFFF" />
      </g>

      {/* Blushing Pink Cheeks */}
      <ellipse cx="28" cy="58" rx="5" ry="3.5" fill="#F04F9D" opacity="0.45" />
      <ellipse cx="72" cy="58" rx="5" ry="3.5" fill="#F04F9D" opacity="0.45" />

      {/* Expressive Eyes */}
      {renderEyes()}

      {/* Expressive Mouth */}
      {renderMouth()}

      {/* Signature Star-Shaped Squad Chest Charm */}
      <g id="chestCharm" transform="translate(0, 4)">
        <polygon
          points="50,68 52.5,73.5 58,74.5 54,78.5 55,84 50,81.5 45,84 46,78.5 42,74.5 47.5,73.5"
          fill="url(#limeStarGrad)"
          stroke="#9ED900"
          strokeWidth="0.8"
        />
        <circle cx="50" cy="76.5" r="1.5" fill="#FFFFFF" />
      </g>

      {/* Cute Little Paws based on pose */}
      {pose === 'wave' ? (
        <g>
          {/* Left Paws resting */}
          <ellipse cx="32" cy="76" rx="5.5" ry="4" fill="#FFFFFF" stroke="#D5CDFA" strokeWidth="0.8" />
          {/* Right Paw waving up */}
          <ellipse cx="78" cy="44" rx="5" ry="6" fill="#FFFFFF" stroke="#D5CDFA" strokeWidth="0.8" transform="rotate(-20 78 44)" />
        </g>
      ) : pose === 'celebrate' || pose === 'jump' ? (
        <g>
          {/* Both paws raised in victory */}
          <ellipse cx="22" cy="44" rx="5" ry="6" fill="#FFFFFF" stroke="#D5CDFA" strokeWidth="0.8" transform="rotate(20 22 44)" />
          <ellipse cx="78" cy="44" rx="5" ry="6" fill="#FFFFFF" stroke="#D5CDFA" strokeWidth="0.8" transform="rotate(-20 78 44)" />
        </g>
      ) : (
        <g>
          {/* Standard resting paws */}
          <ellipse cx="34" cy="76" rx="5.5" ry="4" fill="#FFFFFF" stroke="#D5CDFA" strokeWidth="0.8" />
          <ellipse cx="66" cy="76" rx="5.5" ry="4" fill="#FFFFFF" stroke="#D5CDFA" strokeWidth="0.8" />
        </g>
      )}

      {/* Sparkles around character */}
      <polygon points="18,34 19,36 21,37 19,38 18,40 17,38 15,37 17,36" fill="#FFC857" opacity="0.8" />
      <polygon points="82,34 83,36 85,37 83,38 82,40 81,38 79,37 81,36" fill="#D4FF38" opacity="0.8" />
    </svg>
  );
};
