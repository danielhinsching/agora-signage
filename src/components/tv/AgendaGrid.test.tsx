import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { AgendaGrid } from "@/components/tv/AgendaGrid";

describe("AgendaGrid mobile orientation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-10T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders fixed Monday-Sunday week with seven day sections", () => {
    render(<AgendaGrid events={[]} orientation="mobile" />);

    expect(screen.getByText("Agenda Mobile")).toBeInTheDocument();
    expect(screen.getByText("Semana Seg-Dom")).toBeInTheDocument();
    expect(screen.getByText("06/04 a 12/04")).toBeInTheDocument();
    expect(screen.getAllByText("Sem eventos")).toHaveLength(7);
  });

  it("moves to the next week when navigation is clicked", () => {
    render(<AgendaGrid events={[]} orientation="mobile" />);

    fireEvent.click(screen.getByRole("button", { name: "Próxima semana" }));

    expect(screen.getByText("13/04 a 19/04")).toBeInTheDocument();
  });

  it("keeps legacy empty state for non-mobile layouts", () => {
    render(<AgendaGrid events={[]} orientation="horizontal" />);

    expect(screen.getByText("Nenhum evento programado")).toBeInTheDocument();
  });
});
