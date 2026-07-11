"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Pause, Play, X } from "lucide-react";
import { REST_SECONDS, routineForLevel, WORK_SECONDS } from "@/lib/exercises";
import { localToday } from "@/lib/localDate";

interface SessionProps {
  level: number;
  onExit: () => void;
}

type Phase = "work" | "rest" | "done";

export default function Session({ level, onExit }: SessionProps) {
  const routine = routineForLevel(level);
  const [phase, setPhase] = useState<Phase>("work");
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(WORK_SECONDS);
  const [paused, setPaused] = useState(false);
  const completePosted = useRef(false);

  useEffect(() => {
    if (paused || phase === "done") return;

    const timeout = setTimeout(() => {
      if (secondsLeft > 1) {
        setSecondsLeft(secondsLeft - 1);
        return;
      }

      // Timer hit zero — transition.
      if (phase === "work") {
        if (index >= routine.length - 1) {
          // Last exercise finished → mark today complete (idempotent).
          if (!completePosted.current) {
            completePosted.current = true;
            fetch("/api/complete", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ date: localToday() }),
            }).catch(() => {
              // Non-fatal; completion just won't be recorded if offline.
            });
          }
          setPhase("done");
        } else {
          setPhase("rest");
          setSecondsLeft(REST_SECONDS);
        }
      } else {
        setIndex(index + 1);
        setPhase("work");
        setSecondsLeft(WORK_SECONDS);
      }
    }, 1000);

    return () => clearTimeout(timeout);
  }, [paused, phase, secondsLeft, index, routine.length]);

  if (phase === "done") {
    return (
      <div className="done-screen">
        <CheckCircle2 size={96} className="done-icon" aria-hidden />
        <h1 className="done-title">Routine complete!</h1>
        <p className="done-subtitle">
          {routine.length} {routine.length === 1 ? "exercise" : "exercises"}{" "}
          done. See you tomorrow.
        </p>
        <button
          type="button"
          className="btn btn-start"
          onClick={onExit}
          style={{ maxWidth: 280 }}
        >
          Done
        </button>
      </div>
    );
  }

  const current = routine[index];
  const next = routine[index + 1];
  const isRest = phase === "rest";
  const Icon = isRest && next ? next.icon : current.icon;

  return (
    <div className="session">
      <p className="session-progress">
        Exercise {index + 1} of {routine.length}
      </p>

      <div className="session-main">
        <Icon
          size={80}
          className={`session-icon${isRest ? " resting" : ""}`}
          aria-hidden
        />
        <p className={`session-phase ${isRest ? "rest" : "work"}`}>
          {isRest ? "Rest" : "Go"}
        </p>
        <h1 className="session-exercise-name">
          {isRest && next ? `Next: ${next.name}` : current.name}
        </h1>
        <div className="session-timer" role="timer" aria-live="polite">
          {secondsLeft}
        </div>
      </div>

      <div className="session-controls">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setPaused(!paused)}
        >
          {paused ? <Play size={22} aria-hidden /> : <Pause size={22} aria-hidden />}
          {paused ? "Resume" : "Pause"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onExit}>
          <X size={22} aria-hidden />
          End
        </button>
      </div>
    </div>
  );
}
