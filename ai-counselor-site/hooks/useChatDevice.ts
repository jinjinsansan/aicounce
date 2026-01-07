"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

export function useChatDevice(textareaRef: RefObject<HTMLTextAreaElement>) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const update = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile && textareaRef.current) {
        textareaRef.current.blur();
      }
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [textareaRef]);

  const scrollIntoViewOnFocus = useCallback(() => {
    if (!isMobile) return;
    if (!textareaRef.current) return;
    setTimeout(() => {
      textareaRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 300);
  }, [isMobile, textareaRef]);

  return { isMobile, scrollIntoViewOnFocus };
}
