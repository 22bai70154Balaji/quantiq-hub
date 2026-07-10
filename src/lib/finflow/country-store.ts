import { useSyncExternalStore } from "react";
import type { Country } from "./countries";

const KEY = "finflow.country";

function initial(): Country {
  if (typeof window === "undefined") return "IN";
  const stored = window.localStorage.getItem(KEY);
  if (stored === "IN" || stored === "US" || stored === "AE") return stored;
  return "IN";
}

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
  return () => { listeners.delete(l); };
}

export function useCountry(): [Country, (c: Country) => void] {
  const c = useSyncExternalStore(subscribeCountry, getCountry, () => "IN" as Country);
  return [c, setCountry];
}
