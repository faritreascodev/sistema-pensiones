"use client";

import { useEffect, useRef, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";

function queryFrom(form: HTMLFormElement) {
  const data = new FormData(form);
  const query = new URLSearchParams();
  for (const [key, value] of data.entries()) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (!trimmed || key === "page") continue;
    query.set(key, trimmed);
  }
  return query.toString();
}

export function LiveFilters({ path, className, children }: { path: string; className?: string; children: ReactNode }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const timer = useRef<number>(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function go(immediate: boolean) {
    const form = formRef.current;
    if (!form) return;
    const query = queryFrom(form);
    const url = query ? `${path}?${query}` : path;
    window.clearTimeout(timer.current);
    const run = () => router.replace(url, { scroll: false });
    if (immediate) run();
    else timer.current = window.setTimeout(run, 280);
  }

  function onChange(event: FormEvent<HTMLFormElement>) {
    const target = event.target;
    const text =
      target instanceof HTMLInputElement &&
      (target.type === "text" || target.type === "search" || target.type === "");
    go(!text);
  }

  return (
    <form
      ref={formRef}
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        go(true);
      }}
      onChange={onChange}
    >
      {children}
    </form>
  );
}
