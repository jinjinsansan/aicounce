"use client";

import { useEffect, useState } from "react";

type MaybePromise<T> = T | Promise<T>;

export function useResolvedParams<T>(params: MaybePromise<T>) {
  const [asyncValue, setAsyncValue] = useState<T | null>(null);
  const pending = isPromise(params);

  useEffect(() => {
    if (!pending) {
      return;
    }

    let active = true;
    (params as Promise<T>).then((resolved) => {
      if (active) {
        setAsyncValue(resolved);
      }
    });

    return () => {
      active = false;
    };
  }, [params, pending]);

  return pending ? asyncValue : (params as T);
}

function isPromise<T>(value: MaybePromise<T>): value is Promise<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<T>).then === "function"
  );
}
