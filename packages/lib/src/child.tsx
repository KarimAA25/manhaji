"use client";

export const ALL_CHILDREN_ID = "all" as const;
export type ChildId = string | typeof ALL_CHILDREN_ID;

export type DemoChild = {
  id: string;
  full_name: string;
  initial: string;
  grade_label: string;
  alert_count?: number;
};

export const DEMO_CHILDREN: DemoChild[] = [
  { id: "layla-al-habsi",  full_name: "Layla Al-Habsi",  initial: "L", grade_label: "10A · HS" },
  { id: "omar-al-habsi",   full_name: "Omar Al-Habsi",   initial: "O", grade_label: "7B · MS",  alert_count: 1 },
  { id: "yasmin-al-habsi", full_name: "Yasmin Al-Habsi", initial: "Y", grade_label: "KG2 · Primary" },
];

const STORAGE_KEY = "manhaj.parent.activeChild";

export function readActiveChildId(childList: DemoChild[] = DEMO_CHILDREN): ChildId {
  if (typeof localStorage === "undefined") return ALL_CHILDREN_ID;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return ALL_CHILDREN_ID;
  if (stored === ALL_CHILDREN_ID) return ALL_CHILDREN_ID;
  if (childList.some(c => c.id === stored)) return stored;
  return ALL_CHILDREN_ID;
}

export function writeActiveChildId(id: ChildId): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, id);
}

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type ActiveChildState = {
  activeId: ChildId;
  setActive: (id: ChildId) => void;
  children: DemoChild[];
};

const ActiveChildContext = createContext<ActiveChildState | null>(null);

export function ActiveChildProvider({
  children: reactChildren,
  realChildren,
}: {
  children: ReactNode;
  realChildren?: DemoChild[];
}) {
  const childList = realChildren && realChildren.length > 0 ? realChildren : DEMO_CHILDREN;

  const [activeId, setActiveId] = useState<ChildId>(() => {
    if (typeof window === "undefined") return ALL_CHILDREN_ID;
    return readActiveChildId(childList);
  });

  const setActive = useCallback((id: ChildId) => {
    setActiveId(id);
    writeActiveChildId(id);
  }, []);

  return (
    <ActiveChildContext.Provider value={{ activeId, setActive, children: childList }}>
      {reactChildren}
    </ActiveChildContext.Provider>
  );
}

export function useActiveChild(): ActiveChildState {
  const ctx = useContext(ActiveChildContext);
  if (!ctx) throw new Error("useActiveChild must be used inside <ActiveChildProvider>");
  return ctx;
}

/** Resolve the active child object — or null when the household view is active. */
export function getActiveChild(activeId: ChildId, childList: DemoChild[] = DEMO_CHILDREN): DemoChild | null {
  if (activeId === ALL_CHILDREN_ID) return null;
  return childList.find(c => c.id === activeId) ?? null;
}
