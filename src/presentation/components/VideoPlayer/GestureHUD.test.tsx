import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { GestureHUD } from "./GestureHUD";

describe("GestureHUD", () => {
  it("should not render when isVisible is false", () => {
    const { container } = render(
      <GestureHUD state={{ type: "volume", value: 50, isVisible: false }} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("should render volume badge when visible", () => {
    render(
      <GestureHUD
        state={{ type: "volume", value: 75, isVisible: true, label: "75%" }}
      />
    );
    expect(screen.getByTestId("gesture-hud")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
  });
});
