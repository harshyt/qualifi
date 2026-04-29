"use client";
import { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { lightTokens } from "@/theme/tokens";

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
  const t = lightTokens;

  const [animatedValue, setAnimatedValue] = useState(0);
  const displayed = animate ? animatedValue : score;
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!animate) return;
    const start = performance.now();
    const duration = 800;

    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setAnimatedValue(Math.round(eased * score));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [score, animate]);

  const radius = size * 0.38;
  const strokeWidth = size * 0.075;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (circumference * displayed) / 100;

  let arcColor: string, trackColor: string;
  if (score >= 70) {
    arcColor = t.successBase;
    trackColor = t.successMuted;
  } else if (score >= 50) {
    arcColor = t.warningBase;
    trackColor = t.warningMuted;
  } else {
    arcColor = t.dangerBase;
    trackColor = t.dangerMuted;
  }

  const center = size / 2;
  const fontSize = size * 0.25;

  return (
    <Box
      sx={{
        display: "inline-flex",
        position: "relative",
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: "rotate(-90deg)" }}
        aria-hidden="true"
      >
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={trackColor}
          strokeWidth={strokeWidth}
          opacity={0.35}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={arcColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      {showLabel && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span
            style={{
              fontSize,
              fontWeight: 700,
              color: arcColor,
              lineHeight: 1,
            }}
          >
            {displayed}
          </span>
        </Box>
      )}
    </Box>
  );
}
