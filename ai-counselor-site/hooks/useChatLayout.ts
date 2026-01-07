"use client";

import { useCallback, useLayoutEffect, useRef, useState, type MutableRefObject } from "react";

type HTMLElementRef<T extends HTMLElement> = MutableRefObject<T | null>;

export type ChatLayoutRefs = {
  composerRef: HTMLElementRef<HTMLDivElement>;
  scrollContainerRef: HTMLElementRef<HTMLDivElement>;
  messagesEndRef: HTMLElementRef<HTMLDivElement>;
  autoScrollRef: React.MutableRefObject<boolean>;
  scheduleScroll: () => void;
  composerHeight: number;
};

export function useChatLayout(): ChatLayoutRefs {
  const composerRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const autoScrollRef = useRef(true);
  const scrollFrameRef = useRef<number | undefined>(undefined);
  const [composerHeight, setComposerHeight] = useState(0);

  useLayoutEffect(() => {
    if (!composerRef.current) return;

    const updateHeight = () => {
      if (composerRef.current) {
        setComposerHeight(composerRef.current.offsetHeight);
      }
    };

    updateHeight();

    if (typeof ResizeObserver === "undefined") {
      const interval = window.setInterval(updateHeight, 500);
      return () => window.clearInterval(interval);
    }

    const observer = new ResizeObserver(updateHeight);
    observer.observe(composerRef.current);

    return () => observer.disconnect();
  }, []);

  const scheduleScroll = useCallback(() => {
    if (!autoScrollRef.current) return;
    if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    scrollFrameRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    });
  }, []);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distance = container.scrollHeight - (container.scrollTop + container.clientHeight);
      autoScrollRef.current = distance < 120;
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  useLayoutEffect(() => {
    return () => {
      if (scrollFrameRef.current) cancelAnimationFrame(scrollFrameRef.current);
    };
  }, []);

  return {
    composerRef,
    scrollContainerRef,
    messagesEndRef,
    autoScrollRef,
    scheduleScroll,
    composerHeight,
  };
}
