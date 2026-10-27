'use client';

import React, { useRef, useState } from 'react';

interface GlassParallaxCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  maxTilt?: number;
  onClick?: () => void;
  isSelected?: boolean;
  selectedBorderColor?: string;
  style?: React.CSSProperties;
}

export const GlassParallaxCard: React.FC<GlassParallaxCardProps> = ({
  children,
  className = '',
  glowColor = 'rgba(56, 189, 248, 0.35)',
  maxTilt = 6,
  onClick,
  isSelected = false,
  selectedBorderColor = '#38bdf8',
  style = {}
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 50 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = -((y - centerY) / centerY) * maxTilt;
    const rotY = ((x - centerX) / centerX) * maxTilt;

    setTilt({ x: rotX, y: rotY });
    setSpotlight({
      x: (x / rect.width) * 100,
      y: (y / rect.height) * 100
    });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        ...style,
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) ${
          isHovered ? 'translateZ(8px)' : 'translateZ(0px)'
        }`,
        transition: isHovered
          ? 'transform 0.08s ease-out, border-color 0.2s, box-shadow 0.2s'
          : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s, box-shadow 0.2s',
        borderColor: isSelected ? selectedBorderColor : undefined
      }}
      className={`relative overflow-hidden rounded-3xl backdrop-blur-2xl bg-gradient-to-b from-[#111928]/85 via-[#0b101a]/90 to-[#05070a]/95 border ${
        isSelected
          ? 'shadow-[0_0_35px_rgba(56,189,248,0.25)] ring-1 ring-white/30'
          : 'border-white/[0.09] shadow-[0_20px_45px_-12px_rgba(0,0,0,0.85)] hover:border-white/[0.25]'
      } ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* Specular Top Edge Highlight Line (Authentic Glass Bevel) */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none z-10" />

      {/* Dynamic Cursor Spotlight Radial Glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-300 z-10"
        style={{
          opacity: isHovered ? 1 : 0,
          background: `radial-gradient(circle 240px at ${spotlight.x}% ${spotlight.y}%, ${glowColor}, transparent 75%)`,
          mixBlendMode: 'screen'
        }}
      />

      {/* Subtle Bottom Ambient Refraction */}
      <div className="absolute bottom-0 left-8 right-8 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none z-10" />

      {/* Card Content Container */}
      <div className="relative z-20 h-full">
        {children}
      </div>
    </div>
  );
};

export default GlassParallaxCard;
