"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Pause,
  PauseCircle,
  Play,
  SkipForward,
  X,
} from "lucide-react";
import {
  COUNTDOWN_SECONDS,
  REST_SECONDS,
  routineForLevel,
  WORK_SECONDS,
} from "@/lib/exercises";
import { playEndChime, playStartChime, unlockAudio } from "@/lib/chime";
import { useWakeLock } from "@/lib/useWakeLock";
import { localToday } from "@/lib/localDate";

interface SessionProps {
  level: number;
  onExit: () => void;
}

type Phase = "countdown" | "work" | "rest" | "done";

export default function Session({ level, onExit }: SessionProps) {
  const routine = routineForLevel(level);
  const [phase, setPhase] = useState<Phase>("countdown");
  const [index, setIndex] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(COUNTDOWN_SECONDS);
  const [paused, setPaused] = useState(false);
  const completePosted = useRef(false);

  useWakeLock(phase !== "done");

  // Last exercise finished (or skipped) → mark today complete (idempotent).
  function finishRoutine() {
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
  }

  // From the paused screen: drop the current countdown/exercise/rest, go
  // straight into the next exercise and resume.
  function skip() {
    unlockAudio();
    setPaused(false);
    if (phase === "work" && index >= routine.length - 1) {
      playEndChime();
      finishRoutine();
      return;
    }
    playStartChime();
    if (phase !== "countdown") setIndex(index + 1);
    setPhase("work");
    setSecondsLeft(WORK_SECONDS);
  }

  useEffect(() => {
    if (paused || phase === "done") return;

    const timeout = setTimeout(() => {
      if (secondsLeft > 1) {
        setSecondsLeft(secondsLeft - 1);
        return;
      }

      // Timer hit zero — transition.
      if (phase === "countdown") {
        playStartChime();
        setPhase("work");
        setSecondsLeft(WORK_SECONDS);
      } else if (phase === "work") {
        playEndChime();
        if (index >= routine.length - 1) {
          finishRoutine();
        } else {
          setPhase("rest");
          setSecondsLeft(REST_SECONDS);
        }
      } else {
        playStartChime();
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

  if (paused) {
    return (
      <div className="done-screen">
        <PauseCircle size={96} className="paused-icon" aria-hidden />
        <h1 className="done-title">Paused</h1>
        <div className="session-controls stacked" style={{ paddingTop: 0 }}>
          <button
            type="button"
            className="btn btn-start"
            onClick={() => {
              unlockAudio();
              setPaused(false);
            }}
          >
            <Play size={22} aria-hidden />
            Resume
          </button>
          <button type="button" className="btn btn-secondary" onClick={skip}>
            <SkipForward size={22} aria-hidden />
            Skip
          </button>
          <button type="button" className="btn btn-secondary" onClick={onExit}>
            <X size={22} aria-hidden />
            End
          </button>
        </div>
      </div>
    );
  }

  const current = routine[index];
  const next = routine[index + 1];
  const isRest = phase === "rest";
  const isCountdown = phase === "countdown";
  const Icon = isRest && next ? next.icon : current.icon;

  return (
    <div className="session">
      <p className="session-progress">
        {isCountdown
          ? "Get ready"
          : `Exercise ${index + 1} of ${routine.length}`}
      </p>

      <div className="session-main">
        <Icon
          size={80}
          className={`session-icon${isRest || isCountdown ? " resting" : ""}`}
          aria-hidden
        />
        <p
          className={`session-phase ${isRest || isCountdown ? "rest" : "work"}`}
        >
          {isCountdown ? "Starting in" : isRest ? "Rest" : "Go"}
        </p>
        <h1 className="session-exercise-name">
          {isCountdown ? current.name : isRest && next ? `Next: ${next.name}` : current.name}
        </h1>
        <div className="session-timer" role="timer" aria-live="polite">
          {secondsLeft}
        </div>
      </div>

      <div className="session-controls">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => {
            unlockAudio();
            setPaused(true);
          }}
        >
          <Pause size={22} aria-hidden />
          Pause
        </button>
      </div>
    </div>
  );
}
