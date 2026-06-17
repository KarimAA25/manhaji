"use client";

/**
 * Horizontal strip of clickable filter chips. Active chips have a darker
 * background + outline. Tones map to existing token-driven soft palette.
 */

export type ChipTone = "neutral" | "warn" | "bad" | "good" | "info";

export type Chip = {
  key:    string;
  label:  string;
  tone:   ChipTone;
  active?: boolean;
};

export default function FilterChipRow({
  chips, onToggle,
}: {
  chips:    Chip[];
  onToggle: (key: string) => void;
}) {
  return (
    <div role="toolbar" aria-label="Filters" className="chip-row">
      {chips.map(chip => (
        <button
          key={chip.key}
          type="button"
          aria-pressed={chip.active ?? false}
          onClick={() => onToggle(chip.key)}
          className={`chip-pill chip-${chip.tone} ${chip.active ? "active" : ""}`}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}
