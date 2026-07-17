"use client";

import { useState } from "react";
import { Menu as MenuIcon } from "lucide-react";

interface MenuProps {
  currentLevel: number;
  onLevelDown: () => void;
}

export default function Menu({ currentLevel, onLevelDown }: MenuProps) {
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const close = () => {
    setOpen(false);
    setConfirming(false);
  };

  const toggle = () => {
    if (open) {
      close();
    } else {
      setOpen(true);
    }
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
              disabled={currentLevel <= 1}
              onClick={handleLevelDown}
            >
              {confirming ? "Confirm level down?" : "Level down"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
