"use client";

import { useState } from "react";
import { CheckCircle2, ChevronUp, Play } from "lucide-react";
import { MAX_LEVEL, routineForLevel, routineSeconds } from "@/lib/exercises";
import { unlockAudio } from "@/lib/chime";
import Menu from "@/components/Menu";

interface HomeProps {
  currentLevel: number;
  completedToday: boolean;
  completionsAtLevel: number;
  daysAtLevel: number;
  onStart: () => void;
  onLevelUp: () => void;
  onLevelDown: () => void;
  onShowHistory: () => void;
}

export default function Home({
  currentLevel,
  completedToday,
  completionsAtLevel,
  daysAtLevel,
  onStart,
  onLevelUp,
  onLevelDown,
  onShowHistory,
}: HomeProps) {
  const routine = routineForLevel(currentLevel);
  const atMax = currentLevel >= MAX_LEVEL;
  const minutes = Math.max(1, Math.round(routineSeconds(currentLevel) / 60));
  const newest = routine.length - 1;
  // Tapped tile, whose name the caption shows; null → show the newest.
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected !== null && selected < routine.length ? selected : null;

  return (
    <>
      <header className="home-header">
        <div className="home-header-top">
          <h1 className="home-title">Today&apos;s Routine</h1>
          <Menu
            currentLevel={currentLevel}
            onLevelDown={onLevelDown}
            onShowHistory={onShowHistory}
          />
        </div>
        <p className="home-level-label">Level</p>
        <p className="home-level">{currentLevel}</p>
        <p className="home-subtitle">
          {routine.length} {routine.length === 1 ? "exercise" : "exercises"} ·
          ~{minutes} min
        </p>
        {completionsAtLevel > 0 && (
          <p className="home-stats">
            Done {completionsAtLevel}{" "}
            {completionsAtLevel === 1 ? "time" : "times"} over {daysAtLevel}{" "}
            {daysAtLevel === 1 ? "day" : "days"} at this level
          </p>
        )}
        {completedToday && (
          <span className="completed-badge">
            <CheckCircle2 size={18} aria-hidden />
            Completed today
          </span>
        )}
      </header>

      <ul className="routine-grid">
        {routine.map((exercise, i) => {
          const Icon = exercise.icon;
          const classes = ["routine-tile"];
          if (i === newest) classes.push("newest");
          if (i === shown) classes.push("selected");
          return (
            <li key={exercise.name}>
              <button
                type="button"
                className={classes.join(" ")}
                aria-label={exercise.name}
                aria-pressed={i === shown}
                onClick={() => setSelected(i === shown ? null : i)}
              >
                <Icon size={22} aria-hidden />
                <span className="routine-tile-index">{i + 1}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="routine-caption" aria-live="polite">
        {shown !== null
          ? `${shown + 1} · ${routine[shown].name}`
          : `Newest: ${routine[newest].name}`}
      </p>

      <div className="home-actions">
        <button
          type="button"
          className="btn btn-start"
          onClick={() => {
            // iOS only lets audio play from a context resumed in a gesture.
            unlockAudio();
            onStart();
          }}
        >
          <Play size={22} aria-hidden />
          Start
        </button>
        {atMax ? (
          <p className="level-max-note">Full routine reached</p>
        ) : (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onLevelUp}
          >
            <ChevronUp size={22} aria-hidden />
            Level Up
          </button>
        )}
      </div>
    </>
  );
}
