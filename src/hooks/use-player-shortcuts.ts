"use client";

import { useEffect, useRef } from "react";

/**
 * Keyboard map for the CINEMORA player.
 *
 * The hook is deliberately dumb: it owns the global `keydown` listener and the
 * rules for *when* a shortcut should be ignored (typing, modifier keys, the
 * seek/volume sliders, native button activation). Everything else is delegated
 * to the caller's handlers, which always read fresh state.
 */
export interface PlayerShortcutHandlers {
  togglePlay: () => void;
  seekBy: (deltaSeconds: number) => void;
  seekToFraction: (fraction: number) => void;
  volumeUp: () => void;
  volumeDown: () => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  cycleCaptions: () => void;
  togglePip: () => void;
  openShortcuts: () => void;
  closeOverlays: () => void;
  changeRate: (direction: 1 | -1) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "select") return true;
  return target.isContentEditable;
}

function isSliderTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && target.closest('[role="slider"]') !== null;
}

/**
 * Binds the player keyboard shortcuts while `enabled` is true.
 * Disable it while a dialog/menu owns focus so Escape and arrow keys can close
 * or navigate the overlay instead of scrubbing the film.
 */
export function usePlayerShortcuts(
  handlers: PlayerShortcutHandlers,
  enabled = true,
): void {
  const handlersRef = useRef(handlers);

  // Keep the latest handlers without re-binding the listener every render.
  useEffect(() => {
    handlersRef.current = handlers;
  });

  useEffect(() => {
    if (!enabled) return;
    if (typeof window === "undefined") return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      // Leave browser/OS shortcuts (and screen-reader modifiers) alone.
      if (event.ctrlKey || event.metaKey || event.altKey) return;

      const target = event.target;
      if (isEditableTarget(target)) return;
      // Sliders own their arrow/Home/End handling.
      if (isSliderTarget(target)) return;

      const key = event.key;
      const isSpace = key === " " || key === "Spacebar";
      const tagName = target instanceof HTMLElement ? target.tagName.toLowerCase() : "";

      // Space/Enter on a focused button or link is native activation —
      // don't fire the shortcut on top of the click.
      if (
        (tagName === "button" && (isSpace || key === "Enter")) ||
        (tagName === "a" && key === "Enter")
      ) {
        return;
      }

      const actions = handlersRef.current;
      let handled = true;

      if (isSpace || key === "k" || key === "K") {
        actions.togglePlay();
      } else if (key === "ArrowLeft") {
        actions.seekBy(-10);
      } else if (key === "ArrowRight") {
        actions.seekBy(10);
      } else if (key === "j" || key === "J") {
        actions.seekBy(-10);
      } else if (key === "l" || key === "L") {
        actions.seekBy(10);
      } else if (key === "ArrowUp") {
        actions.volumeUp();
      } else if (key === "ArrowDown") {
        actions.volumeDown();
      } else if (key === "m" || key === "M") {
        actions.toggleMute();
      } else if (key === "f" || key === "F") {
        actions.toggleFullscreen();
      } else if (key === "c" || key === "C") {
        actions.cycleCaptions();
      } else if (key === "p" || key === "P") {
        actions.togglePip();
      } else if (key === "?" || (key === "/" && event.shiftKey)) {
        actions.openShortcuts();
      } else if (key === "Escape") {
        actions.closeOverlays();
      } else if (key.length === 1 && key >= "0" && key <= "9") {
        actions.seekToFraction(Number(key) / 10);
      } else if (event.shiftKey && key === ">") {
        actions.changeRate(1);
      } else if (event.shiftKey && key === "<") {
        actions.changeRate(-1);
      } else {
        handled = false;
      }

      if (handled) {
        // Space would scroll, arrows would scroll, "/" opens quick-find, etc.
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [enabled]);
}
