import React from "react";
import { Server } from "lucide-react";
import type { DiscoveredServer } from "@/domain/models/discovery.model";
import styles from "./ServerChip.module.css";

export interface ServerChipProps {
  server: DiscoveredServer;
  isSelected?: boolean;
  onSelect: (server: DiscoveredServer) => void;
}

export const ServerChip: React.FC<ServerChipProps> = ({
  server,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      className={`${styles.chip} ${isSelected ? styles.chipActive : ""}`}
      onClick={() => onSelect(server)}
      data-focusable="true"
      data-testid="server-chip"
    >
      <span className={`${styles.dot} ${!server.isReachable ? styles.dotOffline : ""}`} />
      <Server size={14} />
      <span>{server.name}</span>
      {server.latencyMs > 0 && (
        <span className={styles.latency}>{server.latencyMs}ms</span>
      )}
    </button>
  );
};
