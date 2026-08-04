"use client";

// FR8X-CON CharacterRing — SVG circular progress counter
// Shows remaining characters like Twitter/X does.

interface CharacterRingProps {
  current: number;
  max: number;
}

export function CharacterRing({ current, max }: CharacterRingProps) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(current / max, 1);
  const strokeDashoffset = circumference * (1 - ratio);
  const remaining = max - current;
  const isWarning = remaining < 100 && remaining >= 0;
  const isOver = remaining < 0;

  const strokeColor = isOver
    ? "#ef4444"
    : isWarning
    ? "#f59e0b"
    : "var(--fr8x-periwinkle)";

  return (
    <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
      <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
        {/* Track */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2.5"
        />
        {/* Progress */}
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          style={{ transition: "stroke-dashoffset 0.2s, stroke 0.2s" }}
        />
      </svg>
      {(isWarning || isOver) && (
        <span
          className={`absolute text-[9px] font-bold ${
            isOver ? "text-red-500" : "text-amber-500"
          }`}
        >
          {remaining}
        </span>
      )}
    </div>
  );
}
