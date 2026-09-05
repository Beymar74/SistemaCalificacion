'use client';

import React from 'react';
import { getCarreraConfig } from '@/lib/constants';

interface CarreraBadgeProps {
  carrera?: string;
  size?: 'xs' | 'sm' | 'md';
  variant?: 'badge' | 'subtle' | 'dot' | 'pill';
  className?: string;
}

export default function CarreraBadge({
  carrera,
  size = 'xs',
  variant = 'badge',
  className = '',
}: CarreraBadgeProps) {
  if (!carrera) return null;

  const config = getCarreraConfig(carrera);

  const sizeClasses = {
    xs: 'text-[9px] px-2 py-0.5',
    sm: 'text-[10px] px-2.5 py-1',
    md: 'text-xs px-3 py-1.5',
  }[size];

  if (variant === 'dot') {
    return (
      <span className={`inline-flex items-center gap-1.5 font-bold ${className}`} style={{ color: config.text }}>
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: config.hex }}
        />
        <span className="break-words">{carrera}</span>
      </span>
    );
  }

  if (variant === 'subtle') {
    return (
      <span
        className={`font-black uppercase tracking-wider break-words ${className}`}
        style={{ color: config.hex }}
      >
        {carrera}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-lg font-black uppercase tracking-wider border shadow-xs transition-all leading-tight ${sizeClasses} ${className}`}
      style={{
        backgroundColor: config.bg,
        color: config.text,
        borderColor: config.border,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ backgroundColor: config.hex }}
      />
      <span className="break-words text-left leading-tight">{carrera}</span>
    </span>
  );
}
