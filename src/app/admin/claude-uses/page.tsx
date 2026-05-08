"use client";

import React, { useCallback, useEffect, useState } from "react";
import { IClaudeUses } from "@/types/claudeUses";
import ClaudeUsesCharts from "./claude-uses-charts";
import ClaudeUsesTable from "./claude-uses-table";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/claudeUses");
      const json = await res.json();
      const raw: IClaudeUses[] = json.data ?? [];
      setRecords(raw.map(normalize));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  if (loading)
    return (
      <div className="flex items-center justify-center mt-10 p-10">
        <span className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mr-2"></span>
        <span className="text-lg font-semibold">Loading...</span>
      </div>
    );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-50">
            <BrainCircuit className="h-5 w-5 text-indigo-500" />
          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight">Claude Usage</h1>
            <p className="text-xs text-muted-foreground">
              Token consumption &amp; charges per user
            </p>
          </div>
          <Badge variant="secondary" className="ml-1">
            {records.length} user{records.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={fetchRecords}
          className="gap-1.5"
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Separator />

      {/* Analytics Dashboard */}
      <ClaudeUsesCharts records={records} />

      {/* Records Table */}
      <ClaudeUsesTable records={records} />
    </div>
  );
}
