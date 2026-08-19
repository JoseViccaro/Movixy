export type GestureType = 
  | "none"
  | "volume"
  | "brightness"
  | "scrub"
  | "double-tap-left"
  | "double-tap-right";

export interface TouchPosition {
  x: number;
  y: number;
  time: number;
}

export interface GestureHUDState {
  type: GestureType;
  value: number; // Volume (0-100), Brightness (0-100), or Scrub Delta/Position in seconds
  isVisible: boolean;
  label?: string;
  icon?: "volume" | "brightness" | "forward" | "backward";
}

export interface GestureAction {
  type: "adjust-volume" | "adjust-brightness" | "seek" | "preview-scrub";
  value: number;
}
