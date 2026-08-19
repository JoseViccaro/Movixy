import React from "react";
import { X, RefreshCw } from "lucide-react";
import type { DiscoveredServer } from "@/domain/models/discovery.model";
import { ServerChip } from "./ServerChip";
import styles from "./ServerPickerSheet.module.css";

export interface ServerPickerSheetProps {
  isOpen: boolean;
  onClose: () => void;
  servers: DiscoveredServer[];
  isScanning?: boolean;
  onScan?: () => void;
  onSelectServer: (server: DiscoveredServer) => void;
  selectedServerUrl?: string;
}

export const ServerPickerSheet: React.FC<ServerPickerSheetProps> = ({
  isOpen,
  onClose,
  servers,
  isScanning,
  onScan,
  onSelectServer,
  selectedServerUrl,
}) => {
  if (!isOpen) return null;

  return (
    <div className={styles.sheetOverlay} onClick={onClose} data-testid="server-picker-sheet">
      <div className={styles.sheetContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>Servidores Detectados</h3>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {onScan && (
              <button
                type="button"
                className={styles.closeBtn}
                onClick={onScan}
                disabled={isScanning}
                aria-label="Escanear red"
                data-focusable="true"
              >
                <RefreshCw size={18} className={isScanning ? "animate-spin" : ""} />
              </button>
            )}
            <button
              type="button"
              className={styles.closeBtn}
              onClick={onClose}
              aria-label="Cerrar"
              data-focusable="true"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className={styles.serverList}>
          {servers.length === 0 ? (
            <p className={styles.emptyText}>
              {isScanning ? "Buscando servidores en la red local..." : "No se encontraron servidores locales."}
            </p>
          ) : (
            servers.map((s) => (
              <ServerChip
                key={s.id || s.url}
                server={s}
                isSelected={selectedServerUrl === s.url}
                onSelect={(server) => {
                  onSelectServer(server);
                  onClose();
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
