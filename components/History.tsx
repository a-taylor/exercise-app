"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { fourWeekWindow } from "@/lib/calendar";
import { localToday } from "@/lib/localDate";

const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

interface HistoryProps {
  onExit: () => void;
}

export default function History({ onExit }: HistoryProps) {
  const today = localToday();
  const { cells, leadingPad, start, end } = useMemo(
    () => fourWeekWindow(today),
    [today],
  );
  const [completed, setCompleted] = useState<Map<string, number> | null>(
    null,
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/history?start=${start}&end=${end}`, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: { completed: { date: string; level: number }[] }) => {
        if (!cancelled) {
          setCompleted(new Map(data.completed.map((c) => [c.date, c.level])));
        }
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [start, end]);

  const doneCount = completed
    ? cells.filter((c) => completed.has(c.date)).length
    : 0;

  return (
    <div className="history">
      <header className="history-header">
        <h1 className="history-title">Last 4 weeks</h1>
        <button
          type="button"
          className="menu-trigger"
          aria-label="Close"
          onClick={onExit}
        >
          <X size={22} aria-hidden />
        </button>
      </header>

      {error ? (
        <p className="error-note">
          Couldn&apos;t load your history. Check your connection and try again.
        </p>
      ) : (
        <p className="history-subtitle">
          {completed
            ? `${doneCount} ${doneCount === 1 ? "session" : "sessions"} in the last 4 weeks`
            : " "}
        </p>
      )}

      <div className="history-weekdays" aria-hidden>
        {WEEKDAYS.map((label, i) => (
          <span key={i} className="history-weekday">
            {label}
          </span>
        ))}
      </div>

      <div className="history-grid" role="grid" aria-label="Last 4 weeks">
        {Array.from({ length: leadingPad }, (_, i) => (
          <div key={`pad-${i}`} className="history-cell pad" aria-hidden />
        ))}
        {cells.map((cell) => {
          const level = completed?.get(cell.date);
          const done = level !== undefined;
          const className = [
            "history-cell",
            cell.isToday ? "today" : "",
            done ? "done" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <div
              key={cell.date}
              className={className}
              role="gridcell"
              aria-label={`${cell.date}${done ? `, completed, ${level} exercises` : ""}`}
            >
              <span className="history-daynum">{cell.dayOfMonth}</span>
              {done && (
                <div className="history-done-stack">
                  <span className="history-count" aria-hidden>
                    {level}
                  </span>
                  <Check className="history-tick" size={22} aria-hidden />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
