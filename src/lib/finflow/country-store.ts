import { create } from "zustand";
import type { Country } from "./countries";

// Simple client-side store for country preference. Persists via localStorage.
const KEY = "finflow.country";

function initial(): Country {
  if (typeof window === "undefined") return "IN";
  const stored = window.localStorage.getItem(KEY);
  if (stored === "IN" || stored === "US" || stored === "AE") return stored;
  return "IN";
}

type Store = { country: Country; setCountry: (c: Country) => void };

// tiny store to avoid pulling zustand — implement subscription manually
type Listener = () => void;
const listeners = new Set<Listener>();
let state: Country = "IN";
let initialized = false;

function ensureInit() {
  if (!initialized && typeof window !== "undefined") {
    state = initial();
    initialized = true;
  }
}

export function getCountry(): Country {
  ensureInit();
  return state;
}

export function setCountry(c: Country) {
  ensureInit();
  state = c;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, c);
  listeners.forEach((l) => l());
}

export function subscribeCountry(l: Listener) {
  listeners.add(l);
  return () => listeners.delete(l);
}

// React hook
import { useSyncExternalStore } from "react";
export function useCountry(): [Country, (c: Country) => void] {
  const c = useSyncExternalStore(
    (cb) => { const off = subscribeCountry(cb); return () => { off; }; },
    () => getCountry(),
    () => "IN" as Country,
  );
  return [c, setCountry];
}

// suppress unused
export const _unused = create;
export type _S = Store;
