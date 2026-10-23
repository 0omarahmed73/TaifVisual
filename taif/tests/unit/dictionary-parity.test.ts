/**
 * T050 (US3): runtime deep key-parity between en.ts and ar.ts, plus a scan
 * for empty strings and TODO/placeholder text. The Dictionary interface
 * already catches missing keys at compile time; this test catches silent
 * drift at runtime too.
 */
import { describe, expect, it } from "vitest";
import { en } from "@/content/en";
import { ar } from "@/content/ar";

function keysDeep(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object") return [prefix];
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => keysDeep(item, `${prefix}[${index}]`));
  }
  return Object.entries(value as Record<string, unknown>).flatMap(([key, val]) =>
    keysDeep(val, prefix ? `${prefix}.${key}` : key),
  );
}

function leafStrings(value: unknown): string[] {
  const found: string[] = [];
  const visit = (node: unknown): void => {
    if (typeof node === "string") {
      found.push(node);
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node && typeof node === "object") {
      Object.values(node).forEach(visit);
    }
  };
  visit(value);
  return found;
}

describe("dictionary parity (T050)", () => {
  it("en and ar have identical key trees", () => {
    const enKeys = keysDeep(en).sort();
    const arKeys = keysDeep(ar).sort();
    expect(arKeys).toEqual(enKeys);
  });

  it("no empty strings in either locale", () => {
    for (const [locale, dict] of [["en", en], ["ar", ar]] as const) {
      const strings = leafStrings(dict);
      expect(strings.length, `${locale} should have strings`).toBeGreaterThan(0);
      for (const text of strings) {
        expect(text.trim().length, `${locale} empty string`).toBeGreaterThan(0);
      }
    }
  });

  it("no TODO or placeholder text in either locale", () => {
    const forbidden = /\b(TODO|FIXME|PLACEHOLDER|TBD|XXX)\b/;
    for (const [locale, dict] of [["en", en], ["ar", ar]] as const) {
      for (const text of leafStrings(dict)) {
        expect(text, `${locale} contains placeholder`).not.toMatch(forbidden);
      }
    }
  });
});
