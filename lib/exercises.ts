import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Armchair,
  ArrowDownUp,
  Footprints,
  Minus,
  MoveDiagonal,
  MoveDown,
  MoveVertical,
  PersonStanding,
  Rabbit,
  RotateCw,
  StepForward,
} from "lucide-react";

export const MAX_LEVEL = 12;
export const WORK_SECONDS = 30;
export const REST_SECONDS = 10;

export interface Exercise {
  name: string;
  icon: LucideIcon;
}

// The 12 exercises, in fixed order (SPEC.md "The 12 Exercises").
export const EXERCISES: Exercise[] = [
  { name: "Jumping Jacks", icon: PersonStanding },
  { name: "Wall Sit", icon: Armchair },
  { name: "Push-Up", icon: MoveDown },
  { name: "Abdominal Crunch", icon: Activity },
  { name: "Step-Up onto Chair", icon: Footprints },
  { name: "Squat", icon: ArrowDownUp },
  { name: "Triceps Dip on Chair", icon: MoveVertical },
  { name: "Plank", icon: Minus },
  { name: "High Knees Running in Place", icon: Rabbit },
  { name: "Lunge", icon: StepForward },
  { name: "Push-Up and Rotation", icon: RotateCw },
  { name: "Side Plank", icon: MoveDiagonal },
];

// Today's routine = exercises #1 through #currentLevel.
export function routineForLevel(level: number): Exercise[] {
  return EXERCISES.slice(0, Math.min(Math.max(level, 1), MAX_LEVEL));
}
