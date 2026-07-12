"use client";

import { CheckCircle2, ChevronUp, Play } from "lucide-react";
import { MAX_LEVEL, routineForLevel } from "@/lib/exercises";

interface HomeProps {
  currentLevel: number;
  completedToday: boolean;
  completionsAtLevel: number;
  daysAtLevel: number;
  onStart: () => void;
  onLevelUp: () => void;
}

export default function Home({
  currentLevel,
  completedToday,
  completionsAtLevel,
  daysAtLevel,
  onStart,
  onLevelUp,
}: HomeProps) {
  const routine = routineForLevel(currentLevel);
  const atMax = currentLevel >= MAX_LEVEL;

  return (
    <>
      <header className="home-header">
        <h1 className="home-title">Today&apos;s Routine</h1>
        <p className="home-subtitle">
          Level {currentLevel} · {routine.length}{" "}
          {routine.length === 1 ? "exercise" : "exercises"} · 30s each
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

      <ul className="routine-list">
        {routine.map((exercise, i) => {
          const Icon = exercise.icon;
          return (
            <li key={exercise.name} className="routine-item">
              <span className="routine-item-icon">
                <Icon size={22} aria-hidden />
              </span>
              <span>{exercise.name}</span>
              <span className="routine-item-index">{i + 1}</span>
            </li>
          );
        })}
      </ul>

      <div className="home-actions">
        <button type="button" className="btn btn-start" onClick={onStart}>
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
