/**
 * Manhaj design tokens — TypeScript surface.
 *
 * Read from design-tokens.json at build time. Use these in React inline-style
 * objects so the values stay in sync with the CSS variables:
 *
 *   import { tokens } from "@/lib/tokens";
 *   <div style={{ padding: tokens.space[4], color: tokens.color.ink }}>
 *
 * Long-term we want every component to consume tokens; for now the migration
 * is gradual — legacy hex literals and ad-hoc px values still exist and that's
 * fine. New code should reach for tokens first.
 */

import tokensJson from "./design-tokens.json";

export const tokens = tokensJson as {
  color: Record<string, string>;
  space: Record<string, string>;
  font_size: Record<string, string>;
  font_weight: Record<string, number>;
  line_height: Record<string, string>;
  radius: Record<string, string>;
  shadow: Record<string, string>;
  breakpoint: Record<string, string>;
};

/** Short aliases for the most common categories — easier in inline styles. */
export const color    = tokens.color;
export const space    = tokens.space;
export const fontSize = tokens.font_size;
export const radius   = tokens.radius;
export const shadow   = tokens.shadow;
