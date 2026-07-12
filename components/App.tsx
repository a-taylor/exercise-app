"use client";

import { useCallback, useEffect, useState } from "react";
import Home from "@/components/Home";
import Session from "@/components/Session";
import { localToday } from "@/lib/localDate";

interface AppState {
  currentLevel: number;
  completedToday: boolean;
  completionsAtLevel: number;
  daysAtLevel: number;
}

export default function App() {
  const [state, setState] = useState<AppState | null>(null);
  const [error, setError] = useState(false);
  const [inSession, setInSession] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`/api/state?date=${localToday()}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState(await res.json());
      setError(false);
    } catch {
      setError(true);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleLevelUp = useCallback(async () => {
    try {
      const res = await fetch("/api/level-up", { method: "POST" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await refresh();
    } catch {
      // Leave state unchanged; user can retry.
    }
  }, [refresh]);

  const handleSessionExit = useCallback(() => {
    setInSession(false);
    refresh();
  }, [refresh]);

  if (error) {
    return (
      <main className="app">
        <p className="error-note">
          Couldn&apos;t reach the server. Check your connection and reload.
        </p>
      </main>
    );
  }

  if (!state) {
    return (
      <main className="app">
        <p className="loading">Loading…</p>
      </main>
    );
  }

  if (inSession) {
    return (
      <main className="app">
        <Session level={state.currentLevel} onExit={handleSessionExit} />
      </main>
    );
  }

  return (
    <main className="app">
      <Home
        currentLevel={state.currentLevel}
        completedToday={state.completedToday}
        completionsAtLevel={state.completionsAtLevel}
        daysAtLevel={state.daysAtLevel}
        onStart={() => setInSession(true)}
        onLevelUp={handleLevelUp}
      />
    </main>
  );
}
