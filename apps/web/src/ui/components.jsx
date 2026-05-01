import React from "react";
import { Link } from "react-router-dom";

export function Card({ title, children, right }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 shadow-sm">
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="text-sm font-semibold text-slate-100">{title}</div>
          {right}
        </div>
      )}
      {children}
    </div>
  );
}

export function Button({ children, kind = "primary", className = "", ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:opacity-60";
  const styles =
    kind === "primary"
      ? "bg-sky-500 text-slate-950 hover:bg-sky-400"
      : kind === "ghost"
        ? "bg-transparent hover:bg-slate-800 text-slate-100 border border-slate-800"
        : "bg-slate-800 text-slate-100 hover:bg-slate-700";
  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ label, hint, className = "", ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-xs font-medium text-slate-300">{label}</div>}
      <input
        className={`w-full rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${className}`}
        {...props}
      />
      {hint && <div className="mt-1 text-xs text-slate-400">{hint}</div>}
    </label>
  );
}

export function Select({ label, className = "", children, ...props }) {
  return (
    <label className="block">
      {label && <div className="mb-1 text-xs font-medium text-slate-300">{label}</div>}
      <select
        className={`w-full rounded-xl border border-slate-800 bg-slate-950/30 px-3 py-2 text-sm text-slate-100 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/30 ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({ children, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-800 text-slate-100",
    sky: "bg-sky-500/15 text-sky-200 border border-sky-500/30",
    amber: "bg-amber-500/15 text-amber-200 border border-amber-500/30",
    rose: "bg-rose-500/15 text-rose-200 border border-rose-500/30",
    emerald: "bg-emerald-500/15 text-emerald-200 border border-emerald-500/30",
  };
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${tones[tone] || tones.slate}`}>{children}</span>;
}

export function TopNav({ user, onLogout }) {
  return (
    <div className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-sm font-semibold tracking-tight">
          Task Manager
        </Link>
        <div className="flex items-center gap-2">
          {user && <div className="hidden text-xs text-slate-400 sm:block">{user.email}</div>}
          {user && (
            <Button kind="ghost" onClick={onLogout}>
              Logout
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

