/// <reference types="vitest/globals" />
import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { axe } from "jest-axe";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings2, Info } from "lucide-react";

// Minimal isolated harness mirroring header dialogs in Index.tsx
function NisabDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Pengaturan Nisab" className="h-11 w-11">
          <Settings2 className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Pengaturan Nisab</DialogTitle>
          <DialogDescription className="sr-only">Atur standar nisab.</DialogDescription>
        </DialogHeader>
        <Label htmlFor="gold-price">Harga Emas</Label>
        <Input id="gold-price" defaultValue="1200000" />
      </DialogContent>
    </Dialog>
  );
}

function InfoDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Panduan Zakat" className="h-11 w-11">
          <Info className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Panduan Zakat</DialogTitle>
          <DialogDescription className="sr-only">Panduan singkat tentang zakat.</DialogDescription>
        </DialogHeader>
        <p>Rukun Islam ke-4.</p>
      </DialogContent>
    </Dialog>
  );
}

describe("A11y — Header dialogs", () => {
  it("Nisab trigger button has accessible name + 44px tap target", () => {
    render(<NisabDialog />);
    const btn = screen.getByRole("button", { name: "Pengaturan Nisab" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/h-11/);
    expect(btn.className).toMatch(/w-11/);
  });

  it("Info trigger button has accessible name + 44px tap target", () => {
    render(<InfoDialog />);
    const btn = screen.getByRole("button", { name: "Panduan Zakat" });
    expect(btn).toBeInTheDocument();
    expect(btn.className).toMatch(/h-11/);
  });

  it("Nisab dialog opens with title and labeled input on click (keyboard reachable)", async () => {
    render(<NisabDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Pengaturan Nisab" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Pengaturan Nisab")).toBeInTheDocument();
    // Labeled input — keyboard/SR accessible
    expect(within(dialog).getByLabelText("Harga Emas")).toBeInTheDocument();
    // Close button (Radix) is focusable
    expect(within(dialog).getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("Info dialog opens with proper title", async () => {
    render(<InfoDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Panduan Zakat" }));
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Panduan Zakat")).toBeInTheDocument();
  });

  it("Nisab dialog has no axe violations when open", async () => {
    const { container } = render(<NisabDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Pengaturan Nisab" }));
    await screen.findByRole("dialog");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("Info dialog has no axe violations when open", async () => {
    const { container } = render(<InfoDialog />);
    fireEvent.click(screen.getByRole("button", { name: "Panduan Zakat" }));
    await screen.findByRole("dialog");
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
