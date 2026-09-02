"use client";

const MUTE_KEY = "gdg-audio-muted";

export function isAudioMuted(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(MUTE_KEY) === "true";
}

export function setAudioMuted(muted: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(MUTE_KEY, String(muted));
  window.dispatchEvent(new CustomEvent("gdg-audio-change", { detail: { muted } }));
}

export function toggleAudioMuted(): boolean {
  const current = isAudioMuted();
  const next = !current;
  setAudioMuted(next);
  return next;
}
