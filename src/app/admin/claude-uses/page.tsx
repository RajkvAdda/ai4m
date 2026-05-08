"use client";

import React, { useCallback, useEffect, useState } from "react";
import { IClaudeUses } from "@/types/claudeUses";
import ClaudeUsesCharts from "./claude-uses-charts";
import ClaudeUsesTable from "./claude-uses-table";
import ClaudeUsesForm from "./claude-uses-form";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { BrainCircuit, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

// Shape exposed to child components after normalization
export type NormalizedRecord = {
  _id: string;
  username: string;
  host: string;
  platform: string;
  sent_at?: string;
  input_tokens: number;
  output_tokens: number;
  total_cost: number;
  model_type: string;
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
    createdAt: r.createdAt as any,
    updatedAt: r.updatedAt as any,
  };
}

export default function ClaudeUsesPage() {
  const [records, setRecords] = useState<NormalizedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<NormalizedRecord | null>(null);

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

  const handleEdit = (r: NormalizedRecord) => {
    setEditRecord(r);
    setFormOpen(true);
  };

  const handleAdd = () => {
    setEditRecord(null);
    setFormOpen(true);
  };

  const handleFormClose = () => {
    setFormOpen(false);
    setEditRecord(null);
  };

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
          <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40">
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

      {/* Charts & Stats */}
      <ClaudeUsesCharts records={records} />

      {/* Table */}
      <ClaudeUsesTable
        records={records}
        onEdit={handleEdit}
        onAdd={handleAdd}
        onDeleted={fetchRecords}
      />

      {/* Add / Edit Form */}
      <ClaudeUsesForm
        open={formOpen}
        onClose={handleFormClose}
        onSaved={fetchRecords}
        editRecord={editRecord}
      />
    </div>
  );
}
