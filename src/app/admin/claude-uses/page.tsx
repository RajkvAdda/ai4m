"use client";

import React, { useCallback, useEffect, useState } from "react";
import { IClaudeUses } from "@/types/claudeUses";
import ClaudeUsesCharts from "./claude-uses-charts";
import ClaudeUsesTable from "./claude-uses-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BrainCircuit, RefreshCw } from "lucide-react";

// Rich data sub-types
export type DailyByModel = {
  day: string;
  model: string;
  input: number;
  output: number;
  cache_read: number;
  cache_creation: number;
  turns: number;
};

export type HourlyByModel = {
  day: string;
  hour: number;
  model: string;
  output: number;
  turns: number;
};

export type SessionRecord = {
  session_id: string;
  project: string;
  branch: string;
  last: string;
  last_date: string;
  duration_min: number;
  model: string;
  turns: number;
  input: number;
  output: number;
  cache_read: number;
  cache_creation: number;
};

// Shape exposed to child components after normalization
export type NormalizedRecord = {
  _id: string;
  username: string;
  host: string;
  platform: string;
  sent_at?: string;
  // legacy flat fields (backwards compat)
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  model_type: string;
  // rich fields
  all_models: string[];
  daily_by_model: DailyByModel[];
  hourly_by_model: HourlyByModel[];
  sessions_all: SessionRecord[];
  createdAt?: string;
  updatedAt?: string;
};

function normalize(r: IClaudeUses): NormalizedRecord {
  const d = r.data ?? {};
  return {
    _id: String(r._id),
    username: r.username,
    host: r.host ?? "",
    platform: r.platform ?? "",
    sent_at: r.sent_at,
    input_tokens: Number(d.input_tokens ?? 0),
    output_tokens: Number(d.output_tokens ?? 0),
    total_cost: Number(d.total_cost ?? 0),
    model_type: String(d.model_type ?? ""),
    all_models: Array.isArray(d.all_models) ? d.all_models : [],
    daily_by_model: Array.isArray(d.daily_by_model) ? d.daily_by_model : [],
    hourly_by_model: Array.isArray(d.hourly_by_model) ? d.hourly_by_model : [],
    sessions_all: Array.isArray(d.sessions_all) ? d.sessions_all : [],
    createdAt: r.createdAt as any,
    updatedAt: r.updatedAt as any,
  };
}

export default function ClaudeUsesPage() {
  const [records, setRecords] = useState<NormalizedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claudeUses");
      const json = await res.json();
      const raw: IClaudeUses[] = json.data ?? [];
      setRecords(raw.map(normalize));
      setLastUpdated(new Date());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Only show legacy flat-data table if records actually contain legacy fields
  const hasLegacyFlatData = records.some(
    (r) => r.input_tokens > 0 || r.output_tokens > 0 || r.total_cost > 0,
  );

  if (loading && records.length === 0)
    return (
      <div className="flex flex-col items-center justify-center mt-16 gap-4">
        <div className="relative h-14 w-14">
          <div className="absolute inset-0 rounded-full border-4 border-indigo-100" />
          <div className="absolute inset-0 rounded-full border-4 border-t-indigo-600 animate-spin" />
        </div>
        <p className="text-sm font-semibold text-muted-foreground">Loading usage data…</p>
      </div>
    );

  return (
    <div className="space-y-4 pb-10">
      {/* ── Dashboard Header ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-700" />
        <div className="absolute -top-14 -right-14 w-44 h-44 bg-white/10 rounded-full" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full" />
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-white/5 rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="relative px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl border border-white/20 shrink-0">
              <BrainCircuit className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-tight tracking-tight">
                Claude Code Usage Dashboard
              </h1>
              <div className="flex items-center gap-2 mt-1">
                {loading ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <RefreshCw className="h-3 w-3 animate-spin" />
                    Refreshing…
                  </span>
                ) : lastUpdated ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-white/70">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                    </span>
                    Updated · {lastUpdated.toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="text-xs text-white/60">Connecting…</span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-center backdrop-blur-sm">
              <p className="text-2xl font-extrabold text-white tabular-nums leading-none">{records.length}</p>
              <p className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">Users</p>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchRecords}
              disabled={loading}
              className="text-white hover:text-white hover:bg-white/20 border border-white/20 gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Rescan
            </Button>
          </div>
        </div>
      </div>

      <ClaudeUsesCharts records={records} />
      {hasLegacyFlatData && <ClaudeUsesTable records={records} />}
    </div>
  );
}
