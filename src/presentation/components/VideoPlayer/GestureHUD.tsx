import React from "react";
import { Volume2, Sun, FastForward, Rewind } from "lucide-react";
import type { GestureHUDState } from "@/domain/models/gesture.model";
import styles from "./GestureHUD.module.css";

export interface GestureHUDProps {
  state: GestureHUDState;
}

export const GestureHUD: React.FC<GestureHUDProps> = ({ state }) => {
  if (!state.isVisible || state.type === "none") return null;

  return (
    <div className={styles.hudContainer} data-testid="gesture-hud">
      {state.type === "volume" && <Volume2 size={32} className={styles.hudIcon} />}
      {state.type === "brightness" && <Sun size={32} className={styles.hudIcon} />}
      {(state.type === "double-tap-right" || (state.type === "scrub" && state.value >= 0)) && (
        <FastForward size={32} className={styles.hudIcon} />
      )}
      {(state.type === "double-tap-left" || (state.type === "scrub" && state.value < 0)) && (
        <Rewind size={32} className={styles.hudIcon} />
      )}

      {state.label && <span className={styles.hudLabel}>{state.label}</span>}

      {(state.type === "volume" || state.type === "brightness") && (
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${Math.min(100, Math.max(0, state.value))}%` }}
          />
        </div>
      )}
    </div>
  );
};
