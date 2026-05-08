"use client";

import { useMemo, useState } from "react";
import {
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Users, DollarSign, Zap, Database, Activity, Clock,
  Layers, BarChart2, GitBranch, Globe, TrendingUp,
} from "lucide-react";
import type { NormalizedRecord, DailyByModel, HourlyByModel, SessionRecord } from "./page";

// ─── Pricing (per million tokens) ────────────────────────────────────────────
const MODEL_PRICING: Record<string, { input: number; output: number; cache_read: number; cache_creation: number }> = {
  "claude-opus-4-5":            { input: 15,   output: 75,   cache_read: 1.5,  cache_creation: 18.75 },
  "claude-opus-4":              { input: 15,   output: 75,   cache_read: 1.5,  cache_creation: 18.75 },
  "claude-opus-4-6":            { input: 15,   output: 75,   cache_read: 1.5,  cache_creation: 18.75 },
  "claude-opus-4-7":            { input: 15,   output: 75,   cache_read: 1.5,  cache_creation: 18.75 },
  "claude-sonnet-4-5":          { input: 3,    output: 15,   cache_read: 0.3,  cache_creation: 3.75  },
  "claude-sonnet-4":            { input: 3,    output: 15,   cache_read: 0.3,  cache_creation: 3.75  },
  "claude-sonnet-4-6":          { input: 3,    output: 15,   cache_read: 0.3,  cache_creation: 3.75  },
  "claude-3-5-sonnet-20241022": { input: 3,    output: 15,   cache_read: 0.3,  cache_creation: 3.75  },
  "claude-3-5-haiku-20241022":  { input: 0.8,  output: 4,    cache_read: 0.08, cache_creation: 1     },
  "claude-haiku-4-5-20251001":  { input: 0.8,  output: 4,    cache_read: 0.08, cache_creation: 1     },
  "claude-3-opus-20240229":     { input: 15,   output: 75,   cache_read: 1.5,  cache_creation: 18.75 },
  "claude-3-haiku-20240307":    { input: 0.25, output: 1.25, cache_read: 0.03, cache_creation: 0.3   },
};

function getModelPricing(model: string) {
  if (MODEL_PRICING[model]) return MODEL_PRICING[model];
  const m = model.toLowerCase();
  if (m.includes("opus"))   return MODEL_PRICING["claude-opus-4-5"];
  if (m.includes("sonnet")) return MODEL_PRICING["claude-3-5-sonnet-20241022"];
  if (m.includes("haiku"))  return MODEL_PRICING["claude-3-5-haiku-20241022"];
  return { input: 3, output: 15, cache_read: 0.3, cache_creation: 3.75 };
}

function calcCost(input: number, output: number, cache_read: number, cache_creation: number, model: string): number {
  const p = getModelPricing(model);
  return (input * p.input + output * p.output + cache_read * p.cache_read + cache_creation * p.cache_creation) / 1_000_000;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

function formatShort(model: string) {
  if (!model) return "Unknown";
  const m = model.toLowerCase();
  if (m.includes("opus-4-7"))   return "Opus 4.7";
  if (m.includes("opus-4-6"))   return "Opus 4.6";
  if (m.includes("opus-4-5"))   return "Opus 4.5";
  if (m.includes("opus-4"))     return "Opus 4";
  if (m.includes("sonnet-4-6")) return "Sonnet 4.6";
  if (m.includes("sonnet-4-5")) return "Sonnet 4.5";
  if (m.includes("sonnet-4"))   return "Sonnet 4";
  if (m.includes("3-5-sonnet")) return "3.5 Sonnet";
  if (m.includes("haiku-4-5"))  return "Haiku 4.5";
  if (m.includes("3-5-haiku"))  return "3.5 Haiku";
  if (m.includes("3-opus"))     return "3 Opus";
  if (m.includes("3-haiku"))    return "3 Haiku";
  if (m.includes("opus"))       return "Opus";
  if (m.includes("sonnet"))     return "Sonnet";
  if (m.includes("haiku"))      return "Haiku";
  return model.length > 16 ? model.slice(0, 14) + "…" : model;
}

function getDateCutoff(range: string): string | null {
  const now = new Date();
  switch (range) {
    case "7d":  return new Date(now.getTime() - 7 * 86_400_000).toISOString().slice(0, 10);
    case "30d": return new Date(now.getTime() - 30 * 86_400_000).toISOString().slice(0, 10);
    case "90d": return new Date(now.getTime() - 90 * 86_400_000).toISOString().slice(0, 10);
    case "week": {
      const d = new Date(now); d.setDate(d.getDate() - d.getDay());
      return d.toISOString().slice(0, 10);
    }
    case "month": return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    case "prevmonth": {
      const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
      const mo = now.getMonth() === 0 ? 12 : now.getMonth();
      return `${y}-${String(mo).padStart(2, "0")}-01`;
    }
    default: return null;
  }
}

function getDateEnd(range: string): string | null {
  if (range !== "prevmonth") return null;
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
}

function costColor(cost: number) {
  if (cost < 0.5)  return "text-emerald-600";
  if (cost < 5)    return "text-yellow-600";
  if (cost < 20)   return "text-orange-500";
  return "text-red-600";
}

// ─── Chart Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, isCost = false }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-2xl rounded-xl p-3 min-w-[160px] text-xs">
      <p className="font-bold text-gray-800 mb-2 pb-1.5 border-b border-gray-100 truncate">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: p.fill ?? p.color }} />
            <span className="text-gray-500 truncate">{p.name}</span>
          </div>
          <span className="font-mono font-bold text-gray-900 shrink-0">
            {isCost ? "$" + Number(p.value).toFixed(3) : formatTokens(Number(p.value))}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Section divider ─────────────────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-border" />
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">{label}</span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}

// ─── Card section header ──────────────────────────────────────────────────────
function SectionHeader({
  icon: Icon, iconBg, iconColor, title, subtitle, right,
}: {
  icon: any; iconBg: string; iconColor: string;
  title: string; subtitle?: string; right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2.5">
        <div className={`p-1.5 rounded-lg ${iconBg}`}>
          <Icon className={`h-4 w-4 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-semibold leading-tight">{title}</p>
          {subtitle && <p className="text-xs text-muted-foreground leading-tight">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

// ─── Constants ───────────────────────────────────────────────────────────────
const MODEL_COLORS = [
  "#6366f1", "#22d3ee", "#f59e0b", "#10b981",
  "#8b5cf6", "#f43f5e", "#06b6d4", "#84cc16",
];
const USER_COLORS = [
  "#3b82f6", "#8b5cf6", "#10b981", "#f59e0b",
  "#f43f5e", "#06b6d4", "#84cc16", "#6366f1",
];
const STACK_COLORS = {
  input: "#6366f1", output: "#22d3ee", cache_read: "#10b981", cache_creation: "#f59e0b",
};
const DATE_RANGES = [
  { label: "7d", value: "7d" }, { label: "30d", value: "30d" },
  { label: "90d", value: "90d" }, { label: "All", value: "all" },
  { label: "This Week", value: "week" }, { label: "This Month", value: "month" },
  { label: "Prev Month", value: "prevmonth" },
];

type SessionWithUser = SessionRecord & { username: string };

// ─── Component ───────────────────────────────────────────────────────────────
interface Props { records: NormalizedRecord[] }

export default function ClaudeUsesCharts({ records }: Props) {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [selectedUsers, setSelectedUsers]   = useState<string[]>([]);
  const [dateRange, setDateRange]           = useState("all");

  const allModels = useMemo(() => {
    const set = new Set<string>();
    for (const r of records) {
      for (const m of r.all_models) if (m) set.add(m);
      if (r.model_type) set.add(r.model_type);
      for (const d of r.daily_by_model) if (d.model) set.add(d.model);
    }
    return Array.from(set).sort();
  }, [records]);

  const allUsers = useMemo(
    () => [...new Set(records.map((r) => r.username).filter(Boolean))].sort(),
    [records],
  );

  const cutoff    = useMemo(() => getDateCutoff(dateRange), [dateRange]);
  const cutoffEnd = useMemo(() => getDateEnd(dateRange), [dateRange]);

  const hasRichData = useMemo(
    () => records.some((r) => r.daily_by_model.length > 0 || r.sessions_all.length > 0),
    [records],
  );

  const allDaily = useMemo((): DailyByModel[] => {
    const result: DailyByModel[] = [];
    for (const r of records) {
      if (selectedUsers.length > 0 && !selectedUsers.includes(r.username)) continue;
      for (const d of r.daily_by_model) {
        if (cutoff && d.day < cutoff) continue;
        if (cutoffEnd && d.day > cutoffEnd) continue;
        if (selectedModels.length > 0 && !selectedModels.includes(d.model)) continue;
        result.push(d);
      }
    }
    return result;
  }, [records, cutoff, cutoffEnd, selectedModels, selectedUsers]);

  const allSessions = useMemo((): SessionWithUser[] => {
    const result: SessionWithUser[] = [];
    for (const r of records) {
      if (selectedUsers.length > 0 && !selectedUsers.includes(r.username)) continue;
      for (const s of r.sessions_all) {
        if (cutoff && s.last_date && s.last_date < cutoff) continue;
        if (cutoffEnd && s.last_date && s.last_date > cutoffEnd) continue;
        if (selectedModels.length > 0 && !selectedModels.includes(s.model)) continue;
        result.push({ ...s, username: r.username });
      }
    }
    return result;
  }, [records, cutoff, cutoffEnd, selectedModels, selectedUsers]);

  const allHourly = useMemo((): HourlyByModel[] => {
    const result: HourlyByModel[] = [];
    for (const r of records) {
      if (selectedUsers.length > 0 && !selectedUsers.includes(r.username)) continue;
      for (const h of r.hourly_by_model) {
        if (cutoff && h.day < cutoff) continue;
        if (cutoffEnd && h.day > cutoffEnd) continue;
        if (selectedModels.length > 0 && !selectedModels.includes(h.model)) continue;
        result.push(h);
      }
    }
    return result;
  }, [records, cutoff, cutoffEnd, selectedModels, selectedUsers]);

  const stats = useMemo(() => {
    if (hasRichData) {
      return {
        totalSessions:      allSessions.length,
        totalTurns:         allDaily.reduce((s, d) => s + d.turns, 0),
        totalInput:         allDaily.reduce((s, d) => s + d.input, 0),
        totalOutput:        allDaily.reduce((s, d) => s + d.output, 0),
        totalCacheRead:     allDaily.reduce((s, d) => s + d.cache_read, 0),
        totalCacheCreation: allDaily.reduce((s, d) => s + d.cache_creation, 0),
        totalCost:          allDaily.reduce((s, d) => s + calcCost(d.input, d.output, d.cache_read, d.cache_creation, d.model), 0),
      };
    }
    const filtered = records.filter((r) => {
      if (!r.sent_at) return true;
      const day = r.sent_at.slice(0, 10);
      if (cutoff && day < cutoff) return false;
      if (cutoffEnd && day > cutoffEnd) return false;
      return true;
    });
    return {
      totalSessions:      filtered.length,      totalTurns:         0,
      totalInput:         filtered.reduce((s, r) => s + r.input_tokens, 0),
      totalOutput:        filtered.reduce((s, r) => s + r.output_tokens, 0),
      totalCacheRead:     0,      totalCacheCreation: 0,
      totalCost:          filtered.reduce((s, r) => s + r.total_cost, 0),
    };
  }, [hasRichData, allDaily, allSessions, records, cutoff, cutoffEnd]);

  const dailyChartData = useMemo(() => {
    const map = new Map<string, { input: number; output: number; cache_read: number; cache_creation: number; turns: number }>();
    for (const d of allDaily) {
      const v = map.get(d.day) ?? { input: 0, output: 0, cache_read: 0, cache_creation: 0, turns: 0 };
      v.input += d.input; v.output += d.output; v.cache_read += d.cache_read; v.cache_creation += d.cache_creation; v.turns += d.turns;
      map.set(d.day, v);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([day, v]) => ({ day, ...v }));
  }, [allDaily]);

  const hourlyChartData = useMemo(() => {
    const map = new Map<number, { output: number; turns: number; count: number }>();
    for (const h of allHourly) {
      const v = map.get(h.hour) ?? { output: 0, turns: 0, count: 0 };
      v.output += h.output; v.turns += h.turns; v.count += 1;
      map.set(h.hour, v);
    }
    return Array.from({ length: 24 }, (_, i) => {
      const v = map.get(i) ?? { output: 0, turns: 0, count: 0 };
      return { hour: i, label: `${String(i).padStart(2, "0")}:00`, avg_output: v.count > 0 ? Math.round(v.output / v.count) : 0 };
    });
  }, [allHourly]);

  const byModelData = useMemo(() => {
    const map = new Map<string, { input: number; output: number; cache_read: number; cache_creation: number; turns: number }>();
    for (const d of allDaily) {
      const v = map.get(d.model) ?? { input: 0, output: 0, cache_read: 0, cache_creation: 0, turns: 0 };
      v.input += d.input; v.output += d.output; v.cache_read += d.cache_read; v.cache_creation += d.cache_creation; v.turns += d.turns;
      map.set(d.model, v);
    }
    return Array.from(map.entries())
      .map(([model, v]) => ({ model, label: formatShort(model), total: v.input + v.output + v.cache_read + v.cache_creation, cost: calcCost(v.input, v.output, v.cache_read, v.cache_creation, model), ...v }))
      .sort((a, b) => b.total - a.total);
  }, [allDaily]);

  const topProjectsData = useMemo(() => {
    const map = new Map<string, { input: number; output: number }>();
    for (const s of allSessions) {
      const key = s.project || "—";
      const v = map.get(key) ?? { input: 0, output: 0 };
      v.input += s.input; v.output += s.output;
      map.set(key, v);
    }
    return Array.from(map.entries())
      .map(([project, v]) => ({ project: project.length > 28 ? project.slice(0, 26) + "…" : project, total: v.input + v.output }))
      .sort((a, b) => b.total - a.total).slice(0, 10);
  }, [allSessions]);

  const costByProjectTable = useMemo(() => {
    const map = new Map<string, { input: number; output: number; cache_read: number; cache_creation: number; turns: number; sessions: number }>();
    for (const s of allSessions) {
      const key = s.project || "—";
      const v = map.get(key) ?? { input: 0, output: 0, cache_read: 0, cache_creation: 0, turns: 0, sessions: 0 };
      v.input += s.input; v.output += s.output; v.cache_read += s.cache_read; v.cache_creation += s.cache_creation; v.turns += s.turns; v.sessions += 1;
      map.set(key, v);
    }
    return Array.from(map.entries()).map(([project, v]) => ({ project, ...v, cost: calcCost(v.input, v.output, v.cache_read, v.cache_creation, "") })).sort((a, b) => b.cost - a.cost);
  }, [allSessions]);

  const costByProjectBranch = useMemo(() => {
    const map = new Map<string, { input: number; output: number; cache_read: number; cache_creation: number; turns: number; sessions: number }>();
    for (const s of allSessions) {
      const key = `${s.project || "—"}|||${s.branch || "—"}`;
      const v = map.get(key) ?? { input: 0, output: 0, cache_read: 0, cache_creation: 0, turns: 0, sessions: 0 };
      v.input += s.input; v.output += s.output; v.cache_read += s.cache_read; v.cache_creation += s.cache_creation; v.turns += s.turns; v.sessions += 1;
      map.set(key, v);
    }
    return Array.from(map.entries()).map(([key, v]) => { const [project, branch] = key.split("|||"); return { project, branch, ...v, cost: calcCost(v.input, v.output, v.cache_read, v.cache_creation, "") }; }).sort((a, b) => b.cost - a.cost);
  }, [allSessions]);

  const recentSessions = useMemo(
    () => [...allSessions].sort((a, b) => (b.last_date || "").localeCompare(a.last_date || "")).slice(0, 20),
    [allSessions],
  );

  const userSummaryData = useMemo(() => {
    return records.map((r) => {
      const daily = r.daily_by_model.filter((d) => {
        if (cutoff && d.day < cutoff) return false;
        if (cutoffEnd && d.day > cutoffEnd) return false;
        if (selectedModels.length > 0 && !selectedModels.includes(d.model)) return false;
        return true;
      });
      const sessions = r.sessions_all.filter((s) => {
        if (cutoff && s.last_date && s.last_date < cutoff) return false;
        if (cutoffEnd && s.last_date && s.last_date > cutoffEnd) return false;
        if (selectedModels.length > 0 && !selectedModels.includes(s.model)) return false;
        return true;
      });
      const totalInput = daily.reduce((s, d) => s + d.input, 0);
      const totalOutput = daily.reduce((s, d) => s + d.output, 0);
      const totalCacheRead = daily.reduce((s, d) => s + d.cache_read, 0);
      const totalCacheCreation = daily.reduce((s, d) => s + d.cache_creation, 0);
      const totalTurns = daily.reduce((s, d) => s + d.turns, 0);
      const cost = daily.reduce((s, d) => s + calcCost(d.input, d.output, d.cache_read, d.cache_creation, d.model), 0);
      const usedModels = [...new Set(daily.map((d) => d.model))].map(formatShort).join(", ") || "—";
      const lastActive = sessions.length > 0
        ? [...sessions].sort((a, b) => (b.last_date || "").localeCompare(a.last_date || ""))[0].last_date || "—"
        : "—";
      return { username: r.username, host: r.host, platform: r.platform, sessions: sessions.length, turns: totalTurns, input: totalInput, output: totalOutput, cache_read: totalCacheRead, cache_creation: totalCacheCreation, cost, models: usedModels, lastActive };
    }).sort((a, b) => b.cost - a.cost);
  }, [records, cutoff, cutoffEnd, selectedModels]);

  const topUsersChart = useMemo(
    () => userSummaryData.slice(0, 10).map((u) => ({ user: u.username, cost: u.cost })),
    [userSummaryData],
  );

  const maxUserCost = userSummaryData[0]?.cost ?? 1;

  const toggleModel = (model: string) => setSelectedModels((prev) => prev.includes(model) ? prev.filter((m) => m !== model) : [...prev, model]);
  const toggleUser  = (user: string)  => setSelectedUsers((prev)  => prev.includes(user)  ? prev.filter((u) => u !== user)  : [...prev, user]);

  const activeUserCount  = selectedUsers.length > 0 ? selectedUsers.length : allUsers.length;
  const xAxisInterval    = Math.max(0, Math.floor(dailyChartData.length / 8) - 1);

  // ── Rank badge ───────────────────────────────────────────────────────────
  const rankBadge = (i: number) => (
    <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold shrink-0 ${
      i === 0 ? "bg-yellow-100 text-yellow-700 ring-1 ring-yellow-300" :
      i === 1 ? "bg-gray-100 text-gray-600 ring-1 ring-gray-300" :
      i === 2 ? "bg-orange-100 text-orange-600 ring-1 ring-orange-300" :
      "bg-muted text-muted-foreground"
    }`}>{i + 1}</span>
  );

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">

      {/* ── Stats Bar ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {[
          { label: "Users",         value: activeUserCount.toString(),           sub: `of ${allUsers.length} registered`,   icon: Users,      accent: "bg-blue-500",   iconBg: "bg-blue-50",   iconColor: "text-blue-600"   },
          { label: "Sessions",      value: stats.totalSessions.toLocaleString(), sub: "total sessions",                     icon: Activity,   accent: "bg-indigo-500", iconBg: "bg-indigo-50", iconColor: "text-indigo-600" },
          { label: "Turns",         value: formatTokens(stats.totalTurns),       sub: "conversation turns",                 icon: Clock,      accent: "bg-emerald-500",iconBg: "bg-emerald-50",iconColor: "text-emerald-600"},
          { label: "Input Tokens",  value: formatTokens(stats.totalInput),       sub: "prompt tokens",                      icon: Zap,        accent: "bg-cyan-500",   iconBg: "bg-cyan-50",   iconColor: "text-cyan-600"   },
          { label: "Output Tokens", value: formatTokens(stats.totalOutput),      sub: "completion tokens",                  icon: TrendingUp, accent: "bg-teal-500",   iconBg: "bg-teal-50",   iconColor: "text-teal-600"   },
          { label: "Cache Read",    value: formatTokens(stats.totalCacheRead),   sub: "from prompt cache",                  icon: Layers,     accent: "bg-violet-500", iconBg: "bg-violet-50", iconColor: "text-violet-600" },
          { label: "Est. Cost",     value: "$" + stats.totalCost.toFixed(2),     sub: "all users combined",                 icon: DollarSign, accent: "bg-amber-500",  iconBg: "bg-amber-50",  iconColor: "text-amber-600"  },
        ].map((s) => (
          <Card key={s.label} className="border-0 shadow-md overflow-hidden bg-white">
            <div className={`h-1 w-full ${s.accent}`} />
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{s.label}</p>
                  <p className="text-2xl font-extrabold mt-1 tabular-nums leading-none">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 leading-tight">{s.sub}</p>
                </div>
                <div className={`p-2 rounded-xl shrink-0 ${s.iconBg}`}>
                  <s.icon className={`h-5 w-5 ${s.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* ── Filters ───────────────────────────────────────────────────────── */}
      <Card className="border shadow-sm bg-white">
        <CardHeader className="pb-3 border-b">
          <SectionHeader icon={BarChart2} iconBg="bg-slate-100" iconColor="text-slate-500" title="Filters" subtitle="Narrow down data by user, model and date range" />
        </CardHeader>
        <CardContent className="pt-3 space-y-3">
          {allUsers.length > 1 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-14">Users</span>
              {allUsers.map((u, i) => (
                <button key={u} onClick={() => toggleUser(u)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                    selectedUsers.includes(u) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-600 border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: USER_COLORS[i % USER_COLORS.length] }} />
                  {u}
                </button>
              ))}
              {selectedUsers.length > 0 && <button onClick={() => setSelectedUsers([])} className="text-xs text-blue-500 hover:underline ml-1">Clear</button>}
            </div>
          )}
          {allModels.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-14">Models</span>
              {allModels.map((m, i) => (
                <button key={m} onClick={() => toggleModel(m)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all shadow-sm ${
                    selectedModels.includes(m) ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:bg-indigo-50"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                  {formatShort(m)}
                </button>
              ))}
              {selectedModels.length > 0 && <button onClick={() => setSelectedModels([])} className="text-xs text-indigo-500 hover:underline ml-1">Clear</button>}
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-14">Range</span>
            <div className="flex flex-wrap gap-1.5">
              {DATE_RANGES.map((r) => (
                <button key={r.value} onClick={() => setDateRange(r.value)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    dateRange === r.value ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >{r.label}</button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Users Overview ────────────────────────────────────────────────── */}
      {userSummaryData.length > 0 && (
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader
              icon={Users} iconBg="bg-blue-50" iconColor="text-blue-600"
              title="Users Overview"
              subtitle={`${userSummaryData.length} user${userSummaryData.length !== 1 ? "s" : ""} · click a row to filter all charts`}
              right={selectedUsers.length > 0 && (
                <button onClick={() => setSelectedUsers([])} className="text-xs font-medium text-blue-600 hover:underline px-2 py-1 bg-blue-50 rounded-lg">
                  Show all
                </button>
              )}
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-10 text-center">#</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Host</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Turns</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Cache</TableHead>
                    <TableHead className="text-right min-w-[140px]">Est. Cost</TableHead>
                    <TableHead>Models</TableHead>
                    <TableHead>Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userSummaryData.map((u, i) => {
                    const isSelected = selectedUsers.includes(u.username);
                    return (
                      <TableRow key={u.username} onClick={() => toggleUser(u.username)}
                        className={`cursor-pointer transition-colors ${isSelected ? "bg-blue-50/80 hover:bg-blue-50" : i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"}`}
                      >
                        <TableCell className="text-center py-3">{rankBadge(i)}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center gap-2">
                            {isSelected && <span className="h-3 w-0.5 bg-blue-500 rounded-full" />}
                            <span className="h-7 w-7 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0" style={{ backgroundColor: USER_COLORS[i % USER_COLORS.length] }}>
                              {u.username[0]?.toUpperCase()}
                            </span>
                            <div>
                              <p className="font-semibold text-sm leading-tight">{u.username}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3">{u.host || "—"}</TableCell>
                        <TableCell className="py-3">
                          {u.platform ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{u.platform}</Badge>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-right font-mono text-sm py-3 font-semibold">{u.sessions}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-3">{u.turns.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-3 text-indigo-600">{formatTokens(u.input)}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-3 text-cyan-600">{formatTokens(u.output)}</TableCell>
                        <TableCell className="text-right font-mono text-sm py-3 text-teal-600">{formatTokens(u.cache_read + u.cache_creation)}</TableCell>
                        <TableCell className="py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                              <div className="h-1.5 rounded-full bg-amber-400 transition-all" style={{ width: `${Math.min(100, (u.cost / maxUserCost) * 100)}%` }} />
                            </div>
                            <span className={`font-mono text-sm font-bold ${costColor(u.cost)}`}>${u.cost.toFixed(2)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3 max-w-[200px] truncate">{u.models}</TableCell>
                        <TableCell className="text-xs text-muted-foreground py-3 whitespace-nowrap">{u.lastActive}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <SectionLabel label="Charts & Analytics" />

      {/* ── Daily Token Usage ─────────────────────────────────────────────── */}
      <Card className="border shadow-sm bg-white">
        <CardHeader className="pb-3 border-b">
          <SectionHeader icon={BarChart2} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Daily Token Usage" subtitle="Input · Output · Cache Read · Cache Create stacked" />
        </CardHeader>
        <CardContent className="pt-4">
          {dailyChartData.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No data for the selected range</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyChartData} margin={{ top: 4, right: 8, bottom: 44, left: 0 }} barSize={dailyChartData.length > 20 ? 8 : 16}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#94a3b8" }} angle={-35} textAnchor="end" interval={xAxisInterval} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={formatTokens} width={48} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Legend iconType="square" iconSize={10} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Bar dataKey="input"          stackId="a" fill={STACK_COLORS.input}          name="Input" />
                <Bar dataKey="output"         stackId="a" fill={STACK_COLORS.output}         name="Output" />
                <Bar dataKey="cache_read"     stackId="a" fill={STACK_COLORS.cache_read}     name="Cache Read" />
                <Bar dataKey="cache_creation" stackId="a" fill={STACK_COLORS.cache_creation} name="Cache Create" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── Average Hourly Distribution ───────────────────────────────────── */}
      <Card className="border shadow-sm bg-white">
        <CardHeader className="pb-3 border-b">
          <SectionHeader icon={Clock} iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Average Hourly Distribution" subtitle="Average output tokens per hour of day" />
        </CardHeader>
        <CardContent className="pt-4">
          {allHourly.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">No hourly data</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlyChartData} margin={{ top: 4, right: 8, bottom: 20, left: 0 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={1} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={formatTokens} width={48} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Bar dataKey="avg_output" fill="#6366f1" name="Avg Output" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* ── By Model + Top Users ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader icon={Database} iconBg="bg-violet-50" iconColor="text-violet-600" title="By Model" subtitle="Token distribution per model" />
          </CardHeader>
          <CardContent className="pt-4">
            {byModelData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data</p>
            ) : (
              <div className="flex items-center gap-6">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={byModelData} dataKey="total" nameKey="label" cx="50%" cy="50%" outerRadius={82} innerRadius={38} paddingAngle={2}>
                      {byModelData.map((_, i) => <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />)}
                    </Pie>
                    <Tooltip content={<ChartTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2.5 min-w-0">
                  {byModelData.map((m, i) => (
                    <div key={m.model} className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                          <span className="text-xs font-medium truncate">{m.label}</span>
                        </div>
                        <span className="text-xs font-mono font-bold shrink-0">{formatTokens(m.total)}</span>
                      </div>
                      <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${(m.total / (byModelData[0]?.total || 1)) * 100}%`, backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader icon={TrendingUp} iconBg="bg-amber-50" iconColor="text-amber-600" title="Top Users by Cost" subtitle="Estimated spend ranked by user" />
          </CardHeader>
          <CardContent className="pt-4">
            {topUsersChart.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-10">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(160, topUsersChart.length * 36)}>
                <BarChart layout="vertical" data={topUsersChart} margin={{ top: 4, right: 52, bottom: 4, left: 8 }}>
                  <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={(v) => "$" + v.toFixed(0)} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="user" tick={{ fontSize: 11, fill: "#374151", fontWeight: 600 }} width={90} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip isCost />} cursor={{ fill: "rgba(245,158,11,0.06)" }} />
                  <Bar dataKey="cost" fill="#f59e0b" name="Est. Cost" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Top Projects ─────────────────────────────────────────────────── */}
      {topProjectsData.length > 0 && (
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader icon={Globe} iconBg="bg-cyan-50" iconColor="text-cyan-600" title="Top Projects by Tokens" subtitle={`Top ${topProjectsData.length} projects · Input + Output combined`} />
          </CardHeader>
          <CardContent className="pt-4">
            <ResponsiveContainer width="100%" height={Math.max(160, topProjectsData.length * 32)}>
              <BarChart layout="vertical" data={topProjectsData} margin={{ top: 4, right: 16, bottom: 4, left: 8 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} tickFormatter={formatTokens} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="project" tick={{ fontSize: 10, fill: "#374151" }} width={150} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(99,102,241,0.04)" }} />
                <Bar dataKey="total" fill="#6366f1" name="Tokens" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      <SectionLabel label="Data Tables" />

      {/* ── Cost by Model ─────────────────────────────────────────────────── */}
      <Card className="border shadow-sm bg-white">
        <CardHeader className="pb-3 border-b">
          <SectionHeader icon={Database} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Cost by Model"
            right={<Badge variant="secondary" className="text-xs">{byModelData.length} models</Badge>}
          />
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 hover:bg-slate-50">
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Turns</TableHead>
                <TableHead className="text-right">Input</TableHead>
                <TableHead className="text-right">Output</TableHead>
                <TableHead className="text-right">Cache Read</TableHead>
                <TableHead className="text-right">Cache Create</TableHead>
                <TableHead className="text-right">Est. Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byModelData.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground text-sm">No data</TableCell></TableRow>
              ) : byModelData.map((m, i) => (
                <TableRow key={m.model} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"}>
                  <TableCell className="text-center">{rankBadge(i)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      <span className="text-sm font-semibold">{m.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm">{m.turns.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-indigo-600">{formatTokens(m.input)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-cyan-600">{formatTokens(m.output)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-teal-600">{formatTokens(m.cache_read)}</TableCell>
                  <TableCell className="text-right font-mono text-sm text-amber-600">{formatTokens(m.cache_creation)}</TableCell>
                  <TableCell className="text-right">
                    <span className={`font-mono text-sm font-bold ${costColor(m.cost)}`}>${m.cost.toFixed(4)}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ── Recent Sessions ───────────────────────────────────────────────── */}
      {allSessions.length > 0 && (
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader icon={Activity} iconBg="bg-emerald-50" iconColor="text-emerald-600" title="Recent Sessions"
              subtitle="Last 20 sessions sorted by date"
              right={<Badge variant="secondary" className="text-xs">{allSessions.length} total</Badge>}
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead>Session</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="text-right">Dur.</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead className="text-right">Turns</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentSessions.map((s, i) => {
                    const cost = calcCost(s.input, s.output, s.cache_read, s.cache_creation, s.model);
                    return (
                      <TableRow key={s.session_id + i} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"}>
                        <TableCell>
                          <span className="font-mono text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold">
                            {s.session_id ? s.session_id.slice(0, 8) : "—"}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-medium text-muted-foreground">{s.username || "—"}</TableCell>
                        <TableCell className="text-sm max-w-[130px] truncate font-medium">{s.project || "—"}</TableCell>
                        <TableCell>
                          {s.branch ? (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <GitBranch className="h-3 w-3 shrink-0" />
                              <span className="truncate max-w-[70px]">{s.branch}</span>
                            </div>
                          ) : "—"}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{s.last_date || "—"}</TableCell>
                        <TableCell className="text-right text-xs font-mono font-medium">{s.duration_min ? s.duration_min + "m" : "—"}</TableCell>
                        <TableCell><span className="text-xs font-semibold">{formatShort(s.model)}</span></TableCell>
                        <TableCell className="text-right font-mono text-sm font-semibold">{s.turns}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-indigo-600">{formatTokens(s.input)}</TableCell>
                        <TableCell className="text-right font-mono text-sm text-cyan-600">{formatTokens(s.output)}</TableCell>
                        <TableCell className="text-right">
                          <span className={`font-mono text-sm font-bold ${costColor(cost)}`}>${cost.toFixed(4)}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Cost by Project ───────────────────────────────────────────────── */}
      {costByProjectTable.length > 0 && (
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader icon={Globe} iconBg="bg-teal-50" iconColor="text-teal-600" title="Cost by Project"
              right={<Badge variant="secondary" className="text-xs">{costByProjectTable.length} projects</Badge>}
            />
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="w-8 text-center">#</TableHead>
                  <TableHead>Project</TableHead>
                  <TableHead className="text-right">Sessions</TableHead>
                  <TableHead className="text-right">Turns</TableHead>
                  <TableHead className="text-right">Input</TableHead>
                  <TableHead className="text-right">Output</TableHead>
                  <TableHead className="text-right">Cache Read</TableHead>
                  <TableHead className="text-right">Cache Create</TableHead>
                  <TableHead className="text-right">Est. Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {costByProjectTable.map((p, i) => (
                  <TableRow key={p.project} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"}>
                    <TableCell className="text-center">{rankBadge(i)}</TableCell>
                    <TableCell className="font-semibold text-sm">{p.project}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{p.sessions}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{p.turns.toLocaleString()}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-indigo-600">{formatTokens(p.input)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-cyan-600">{formatTokens(p.output)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-teal-600">{formatTokens(p.cache_read)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-amber-600">{formatTokens(p.cache_creation)}</TableCell>
                    <TableCell className="text-right">
                      <span className={`font-mono text-sm font-bold ${costColor(p.cost)}`}>${p.cost.toFixed(4)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* ── Cost by Project & Branch ──────────────────────────────────────── */}
      {costByProjectBranch.length > 0 && (
        <Card className="border shadow-sm bg-white">
          <CardHeader className="pb-3 border-b">
            <SectionHeader icon={GitBranch} iconBg="bg-violet-50" iconColor="text-violet-600" title="Cost by Project & Branch"
              right={<Badge variant="secondary" className="text-xs">{costByProjectBranch.length} combinations</Badge>}
            />
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 hover:bg-slate-50">
                    <TableHead className="w-8 text-center">#</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Branch</TableHead>
                    <TableHead className="text-right">Sessions</TableHead>
                    <TableHead className="text-right">Turns</TableHead>
                    <TableHead className="text-right">Input</TableHead>
                    <TableHead className="text-right">Output</TableHead>
                    <TableHead className="text-right">Cache Read</TableHead>
                    <TableHead className="text-right">Cache Create</TableHead>
                    <TableHead className="text-right">Est. Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costByProjectBranch.map((p, i) => (
                    <TableRow key={i} className={i % 2 === 0 ? "bg-white hover:bg-slate-50" : "bg-slate-50/40 hover:bg-slate-50"}>
                      <TableCell className="text-center">{rankBadge(i)}</TableCell>
                      <TableCell className="font-semibold text-sm max-w-[160px] truncate">{p.project}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <GitBranch className="h-3 w-3 shrink-0" />
                          <span className="truncate max-w-[90px]">{p.branch}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.sessions}</TableCell>
                      <TableCell className="text-right font-mono text-sm">{p.turns.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-indigo-600">{formatTokens(p.input)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-cyan-600">{formatTokens(p.output)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-teal-600">{formatTokens(p.cache_read)}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-amber-600">{formatTokens(p.cache_creation)}</TableCell>
                      <TableCell className="text-right">
                        <span className={`font-mono text-sm font-bold ${costColor(p.cost)}`}>${p.cost.toFixed(4)}</span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
