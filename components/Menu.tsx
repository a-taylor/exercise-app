"use client";

import { useState } from "react";
import { Menu as MenuIcon } from "lucide-react";
import {
  disablePush,
  enablePush,
  getPushStatus,
  type PushStatus,
} from "@/lib/push";

const REMINDER_LABELS: Record<Exclude<PushStatus, "unsupported">, string> = {
  off: "Turn on 6pm reminder",
  on: "Turn off reminder",
  blocked: "Notifications blocked",
};

interface MenuProps {
  currentLevel: number;
  onLevelDown: () => void;
  onShowHistory: () => void;
}

export default function Menu({
  currentLevel,
  onLevelDown,
  onShowHistory,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [pushStatus, setPushStatus] = useState<PushStatus>("unsupported");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirming(false);
    setPushError(false);
  };

  const toggle = () => {
    if (open) {
      close();
    } else {
      setOpen(true);
      getPushStatus().then(setPushStatus, () => setPushStatus("unsupported"));
    }
  };

  // No awaits before enablePush(): iOS only shows the permission prompt
  // when it's requested directly from the tap.
  const handleReminderToggle = () => {
    setPushBusy(true);
    setPushError(false);
    (pushStatus === "on" ? disablePush() : enablePush())
      .then(setPushStatus, () => setPushError(true))
      .finally(() => setPushBusy(false));
  };

  const handleLevelDown = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onLevelDown();
    close();
  };

  return (
    <div className="menu">
      <button
        type="button"
        className="menu-trigger"
        aria-label="Menu"
        aria-expanded={open}
        onClick={toggle}
      >
        <MenuIcon size={22} aria-hidden />
      </button>
      {open && (
        <>
          <div className="menu-backdrop" onClick={close} />
          <div className="menu-dropdown" role="menu">
            <button
              type="button"
              className="menu-item"
              role="menuitem"
              onClick={() => {
                onShowHistory();
                close();
              }}
            >
              Last 4 weeks
            </button>
            <button
              type="button"
              className="menu-item"
              role="menuitem"
              disabled={currentLevel <= 1}
              onClick={handleLevelDown}
            >
              {confirming ? "Confirm level down?" : "Level down"}
            </button>
            {pushStatus !== "unsupported" && (
              <button
                type="button"
                className="menu-item"
                role="menuitem"
                disabled={pushBusy || pushStatus === "blocked"}
                onClick={handleReminderToggle}
              >
                {pushError
                  ? "Couldn't update reminder"
                  : REMINDER_LABELS[pushStatus]}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
