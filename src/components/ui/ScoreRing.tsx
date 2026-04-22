"use client";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@mui/material/styles";
import { lightTokens, darkTokens } from "@/theme/tokens";

interface ScoreRingProps {
  score: number;
  size?: number;
  animate?: boolean;
  showLabel?: boolean;
}

export default function ScoreRing({
  score,
  size = 56,
  animate = true,
  showLabel = true,
}: ScoreRingProps) {
  const theme = useTheme();
  const t = theme.palette.mode === "dark" ? darkTokens : lightTokens;

  const arcColor =
    score >= 70 ? t.successBase : score >= 50 ? t.warningBase : t.dangerBase;
  const trackColor =
    score >= 70 ? t.successMuted : score >= 50 ? t.warningMuted : t.dangerMuted;

  const radius = size * 0.38;
  const strokeWidth = size * 0.075;
  const circumference = 2 * Math.PI * radius;
  const cx = size / 2;
  const cy = size / 2;

  const [displayed, setDisplayed] = useState(animate ? 0 : score);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) {
      setDisplayed(score);
      return;
    }
    const duration = 800;
    const start = performance.now();
    const from = 0;
    const to = score;

    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animate]);

  const offset = circumference - (circumference * displayed) / 100;
  const fontSize = size * 0.25;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-label={`Score: ${score}`}
    >
      {/* track */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={strokeWidth}
        opacity={0.35}
      />
      {/* arc */}
      <circle
        cx={cx}
        cy={cy}
        r={radius}
        fill="none"
        stroke={arcColor}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: "rotate(-90deg)", transformOrigin: "center" }}
      />
      {showLabel && (
        <text
          x={cx}
          y={cy}
          dominantBaseline="central"
          textAnchor="middle"
          fontSize={fontSize}
          fontWeight={700}
          fill={arcColor}
          fontFamily='"DM Sans", "Inter", system-ui, sans-serif'
        >
          {displayed}
        </text>
      )}
    </svg>
  );
}
