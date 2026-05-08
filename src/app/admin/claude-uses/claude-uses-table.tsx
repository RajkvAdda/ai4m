"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, ArrowUpDown } from "lucide-react";
import type { NormalizedRecord } from "./page";

type SortKey =
  | "username"
  | "input_tokens"
  | "output_tokens"
  | "total_tokens"
  | "total_cost"
  | "model_type"
  | "sent_at";
type SortDir = "asc" | "desc";

function formatTokens(n: number) {

  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

const MODEL_META: Record<string, { label: string; cls: string }> = {
  "claude-opus-4-5":            { label: "Opus 4.5",   cls: "bg-purple-100 text-purple-700 border-purple-200" },
  "claude-sonnet-4-5":          { label: "Sonnet 4.5", cls: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  "claude-3-5-sonnet-20241022": { label: "3.5 Sonnet", cls: "bg-blue-100 text-blue-700 border-blue-200" },
  "claude-3-5-haiku-20241022":  { label: "3.5 Haiku",  cls: "bg-teal-100 text-teal-700 border-teal-200" },
  "claude-3-opus-20240229":     { label: "3 Opus",     cls: "bg-violet-100 text-violet-700 border-violet-200" },
  "claude-3-haiku-20240307":    { label: "3 Haiku",    cls: "bg-cyan-100 text-cyan-700 border-cyan-200" },
};

function getModelMeta(model: string) {
  if (!model) return null;
  if (MODEL_META[model]) return MODEL_META[model];
  const m = model.toLowerCase();
  if (m.includes("opus"))   return { label: model, cls: "bg-purple-100 text-purple-700 border-purple-200" };
  if (m.includes("sonnet")) return { label: model, cls: "bg-indigo-100 text-indigo-700 border-indigo-200" };
  if (m.includes("haiku"))  return { label: model, cls: "bg-cyan-100 text-cyan-700 border-cyan-200" };
  return { label: model, cls: "bg-gray-100 text-gray-600 border-gray-200" };
}

interface Props {
  records: NormalizedRecord[];
}

export default function ClaudeUsesTable({ records }: Props) {
  const [search, setSearch] = useState("");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("total_cost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const platforms = useMemo(
    () => Array.from(new Set(records.map((r) => r.platform).filter(Boolean))),
    [records],
  );
  const models = useMemo(
    () => Array.from(new Set(records.map((r) => r.model_type).filter(Boolean))),
    [records],
  );

  const filtered = useMemo(() => {
    let data = records.filter((r) => {
      const q = search.toLowerCase();
      return (
        (!q || r.username.toLowerCase().includes(q) || r.host.toLowerCase().includes(q)) &&
        (platformFilter === "all" || r.platform === platformFilter) &&
        (modelFilter === "all" || r.model_type === modelFilter)
      );
    });

    return [...data].sort((a, b) => {
      let av: string | number =
        sortKey === "total_tokens"
          ? a.input_tokens + a.output_tokens
          : ((a as any)[sortKey] ?? "");
      let bv: string | number =
        sortKey === "total_tokens"
          ? b.input_tokens + b.output_tokens
          : ((b as any)[sortKey] ?? "");
      if (typeof av === "string") av = av.toLowerCase();
      if (typeof bv === "string") bv = bv.toLowerCase();
      return av < bv ? (sortDir === "asc" ? -1 : 1) : av > bv ? (sortDir === "asc" ? 1 : -1) : 0;
    });
  }, [records, search, platformFilter, modelFilter, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const SortBtn = ({ col }: { col: SortKey }) => (
    <button
      onClick={() => toggleSort(col)}
      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
    >
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold">
          All Records{" "}
          <Badge variant="secondary" className="ml-1">
            {filtered.length}
          </Badge>
        </CardTitle>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mt-2">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search username or host…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          {platforms.length > 0 && (
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="h-8 w-[140px] text-sm">
                <SelectValue placeholder="Platform" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Platforms</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {models.length > 0 && (
            <Select value={modelFilter} onValueChange={setModelFilter}>
              <SelectTrigger className="h-8 w-[160px] text-sm">
                <SelectValue placeholder="All Models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="whitespace-nowrap">
                  <span className="flex items-center gap-1">Username <SortBtn col="username" /></span>
                </TableHead>
                <TableHead>Host</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead className="whitespace-nowrap">
                  <span className="flex items-center gap-1">Model <SortBtn col="model_type" /></span>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">Input Tokens <SortBtn col="input_tokens" /></span>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">Output Tokens <SortBtn col="output_tokens" /></span>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">Total Tokens <SortBtn col="total_tokens" /></span>
                </TableHead>
                <TableHead className="text-right whitespace-nowrap">
                  <span className="flex items-center justify-end gap-1">Cost (USD) <SortBtn col="total_cost" /></span>
                </TableHead>
                <TableHead className="whitespace-nowrap">
                  <span className="flex items-center gap-1">Recorded At <SortBtn col="sent_at" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-10 text-muted-foreground text-sm">
                    No records found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((r) => {
                  const totalTokens = r.input_tokens + r.output_tokens;
                  const meta = getModelMeta(r.model_type);
                  return (
                    <TableRow key={r._id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">{r.username}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.host || "—"}</TableCell>
                      <TableCell>
                        {r.platform ? (
                          <Badge variant="outline" className="text-xs">{r.platform}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        {meta ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${meta.cls}`}>
                            {meta.label}
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-indigo-600">
                        {formatTokens(r.input_tokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-cyan-600">
                        {formatTokens(r.output_tokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-violet-600 font-semibold">
                        {formatTokens(totalTokens)}
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600 font-semibold">
                        ${r.total_cost.toFixed(4)}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer totals */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap gap-4 px-4 py-2.5 bg-muted/20 border-t text-xs text-muted-foreground">
            <span>
              Input: <span className="font-semibold text-indigo-600">{formatTokens(filtered.reduce((s, r) => s + r.input_tokens, 0))}</span>
            </span>
            <span>
              Output: <span className="font-semibold text-cyan-600">{formatTokens(filtered.reduce((s, r) => s + r.output_tokens, 0))}</span>
            </span>
            <span>
              Total: <span className="font-semibold text-violet-600">{formatTokens(filtered.reduce((s, r) => s + r.input_tokens + r.output_tokens, 0))}</span>
            </span>
            <span>
              Cost: <span className="font-semibold text-amber-600">${filtered.reduce((s, r) => s + r.total_cost, 0).toFixed(4)}</span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
