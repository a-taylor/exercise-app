"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Pause, PauseCircle, Play, X } from "lucide-react";
import {
  COUNTDOWN_SECONDS,
  REST_SECONDS,
  routineForLevel,
  WORK_SECONDS,
} from "@/lib/exercises";
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
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Short beep so a 30s exercise's end is audible without watching the screen.
  function playExerciseEndChime() {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctx) return;
    if (!audioCtxRef.current) audioCtxRef.current = new Ctx();
    const ctx = audioCtxRef.current;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
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
        setPhase("work");
        setSecondsLeft(WORK_SECONDS);
      } else if (phase === "work") {
        playExerciseEndChime();
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

  if (paused) {
    return (
      <div className="done-screen">
        <PauseCircle size={96} className="paused-icon" aria-hidden />
        <h1 className="done-title">Paused</h1>
        <div className="session-controls" style={{ paddingTop: 0 }}>
          <button
            type="button"
            className="btn btn-start"
            onClick={() => setPaused(false)}
          >
            <Play size={22} aria-hidden />
            Resume
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
