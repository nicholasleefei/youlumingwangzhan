import React from "react";

// Playbit 风格的 GUI 应用图标
export function GuiAppIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="10" y="10" width="180" height="180" rx="8" />
      <line x1="10" y1="35" x2="190" y2="35" />
      <circle cx="28" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="42" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="56" cy="23" r="3" fill="currentColor" stroke="none" />
      <path d="M40 100 Q70 70 100 100 T160 100" />
      <circle cx="160" cy="100" r="4" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Playbit 风格的 CLI 应用图标
export function CliAppIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="10" y="10" width="180" height="180" rx="8" />
      <line x1="10" y1="35" x2="190" y2="35" />
      <circle cx="28" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="42" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="56" cy="23" r="3" fill="currentColor" stroke="none" />
      <path d="M50 70 L80 95 L50 120" />
      <line x1="90" y1="95" x2="130" y2="95" />
      <line x1="50" y1="135" x2="150" y2="135" />
      <line x1="50" y1="155" x2="120" y2="155" />
    </svg>
  );
}

// Playbit 风格的通用应用图标
export function AppIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="10" y="10" width="180" height="180" rx="8" />
      <line x1="10" y1="35" x2="190" y2="35" />
      <circle cx="28" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="42" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="56" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="100" cy="110" r="50" />
      <line x1="100" y1="60" x2="100" y2="100" />
      <line x1="100" y1="110" x2="70" y2="140" />
      <line x1="100" y1="110" x2="130" y2="140" />
    </svg>
  );
}

// Playbit 风格的系统调用图标
export function SyscallIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="10" y="10" width="180" height="180" rx="8" />
      <line x1="10" y1="35" x2="190" y2="35" />
      <circle cx="28" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="42" cy="23" r="3" fill="currentColor" stroke="none" />
      <circle cx="56" cy="23" r="3" fill="currentColor" stroke="none" />
      <line x1="100" y1="50" x2="100" y2="150" />
      <line x1="50" y1="100" x2="150" y2="100" />
      <line x1="65" y1="65" x2="135" y2="135" />
      <line x1="135" y1="65" x2="65" y2="135" />
    </svg>
  );
}

// Playbit 风格的简单表情图标
export function SimpleEmojiIcon({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="10" y="10" width="180" height="180" rx="8" />
      <circle cx="100" cy="100" r="60" />
      <circle cx="75" cy="85" r="8" fill="currentColor" stroke="none" />
      <circle cx="125" cy="85" r="8" fill="currentColor" stroke="none" />
      <path d="M70 125 Q100 150 130 125" />
    </svg>
  );
}

// Playbit 风格的装饰性图案
export function PlaybitPattern({ className = "w-full h-full" }: { className?: string }) {
  return (
    <svg viewBox="0 0 400 200" className={className} fill="none" stroke="currentColor" strokeWidth="1">
      <g strokeOpacity="0.3">
        <circle cx="50" cy="50" r="30" />
        <circle cx="150" cy="150" r="40" />
        <circle cx="300" cy="80" r="25" />
        <circle cx="380" cy="160" r="35" />
        <rect x="80" y="100" width="50" height="50" rx="5" />
        <rect x="220" y="120" width="60" height="40" rx="4" />
      </g>
    </svg>
  );
}
