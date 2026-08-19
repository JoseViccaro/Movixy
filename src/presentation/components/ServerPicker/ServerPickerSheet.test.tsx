import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ServerPickerSheet } from "./ServerPickerSheet";

describe("ServerPickerSheet", () => {
  it("should not render when isOpen is false", () => {
    const { container } = render(
      <ServerPickerSheet isOpen={false} onClose={vi.fn()} servers={[]} onSelectServer={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render list of servers and call onSelectServer when chip is clicked", () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    const mockServers = [
      {
        id: "s1",
        name: "Living Room Jellyfin",
        url: "http://192.168.1.50:8096",
        latencyMs: 15,
        source: "lan-sweep" as const,
        lastSeen: Date.now(),
        isReachable: true,
      },
    ];

    render(
      <ServerPickerSheet
        isOpen={true}
        onClose={onClose}
        servers={mockServers}
        onSelectServer={onSelect}
      />
    );

    expect(screen.getByTestId("server-picker-sheet")).toBeInTheDocument();
    expect(screen.getByText("Living Room Jellyfin")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Living Room Jellyfin"));
    expect(onSelect).toHaveBeenCalledWith(mockServers[0]);
    expect(onClose).toHaveBeenCalled();
  });
});
