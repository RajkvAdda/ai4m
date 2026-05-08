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
  const [countdown, setCountdown] = useState(30);

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claudeUses");
      const json = await res.json();
      const raw: IClaudeUses[] = json.data ?? [];
      setRecords(raw.map(normalize));
      setLastUpdated(new Date());
      setCountdown(30);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Auto-refresh countdown — only starts after first load
  useEffect(() => {
    if (!lastUpdated) return;
    const t = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          fetchRecords();
          return 30;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [fetchRecords, lastUpdated]);

  if (loading && records.length === 0)
    return (
      <div className="flex items-center justify-center mt-10 p-10">
        <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2" />
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    );

  return (
    <div className="space-y-4 pb-10">
      {/* ── Dashboard Header ───────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3 shadow-sm">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="p-2 rounded-lg bg-indigo-50 shrink-0">
            <BrainCircuit className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight text-gray-900 tracking-tight">
              Claude Code Usage Dashboard
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {lastUpdated
                ? `Updated: ${lastUpdated.toLocaleString()} · Auto-refresh in ${countdown}s`
                : "Fetching data…"}
            </p>
          </div>
          <Badge variant="secondary" className="text-xs ml-1">
            {records.length} user{records.length !== 1 ? "s" : ""}
          </Badge>
          {loading && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <RefreshCw className="h-3 w-3 animate-spin" />
              Refreshing…
            </span>
          )}
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRecords}
          disabled={loading}
          className="gap-1.5 h-8 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Rescan
        </Button>
      </div>

      <ClaudeUsesCharts records={records} />
      <ClaudeUsesTable records={records} />
    </div>
  );
}
