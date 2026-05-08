"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cpu, DollarSign, Users, Zap, Hash } from "lucide-react";
import type { NormalizedRecord } from "./page";

const tokenChartConfig: ChartConfig = {
  input_tokens: { label: "Input Tokens", color: "#6366f1" },
  output_tokens: { label: "Output Tokens", color: "#22d3ee" },
};

const costChartConfig: ChartConfig = {
  total_cost: { label: "Total Cost ($)", color: "#f59e0b" },
};

function formatTokens(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

interface Props {
  records: NormalizedRecord[];
}

export default function ClaudeUsesCharts({ records }: Props) {
  const totalInputTokens = records.reduce((s, r) => s + r.input_tokens, 0);
  const totalOutputTokens = records.reduce((s, r) => s + r.output_tokens, 0);
  const totalTokens = totalInputTokens + totalOutputTokens;
  const totalCost = records.reduce((s, r) => s + r.total_cost, 0);
  const totalUsers = records.length;

  // bar chart — top 15 by total tokens
  const barData = [...records]
    .sort((a, b) => b.input_tokens + b.output_tokens - (a.input_tokens + a.output_tokens))
    .slice(0, 15)
    .map((r) => ({
      username: r.username.length > 12 ? r.username.slice(0, 12) + "…" : r.username,
      input_tokens: r.input_tokens,
      output_tokens: r.output_tokens,
    }));

  // cost per user sorted alphabetically
  const costData = [...records]
    .sort((a, b) => a.username.localeCompare(b.username))
    .map((r) => ({
      name: r.username.length > 10 ? r.username.slice(0, 10) + "…" : r.username,
      total_cost: r.total_cost,
    }));

  const stats = [
    {
      label: "Total Input Tokens",
      value: formatTokens(totalInputTokens),
      icon: Cpu,
      color: "text-indigo-500",
      bg: "bg-indigo-50",
    },
    {
      label: "Total Output Tokens",
      value: formatTokens(totalOutputTokens),
      icon: Zap,
      color: "text-cyan-500",
      bg: "bg-cyan-50",
    },
    {
      label: "Total Tokens",
      value: formatTokens(totalTokens),
      icon: Hash,
      color: "text-violet-500",
      bg: "bg-violet-50",
    },
    {
      label: "Total Cost",
      value: "$" + totalCost.toFixed(4),
      icon: DollarSign,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Active Users",
      value: totalUsers.toString(),
      icon: Users,
      color: "text-emerald-500",
      bg: "bg-emerald-50",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground leading-tight">{s.label}</p>
                <p className="text-lg font-bold tabular-nums">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tokens per User Bar Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Token Usage per User</CardTitle>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data</p>
            ) : (
              <ChartContainer config={tokenChartConfig} className="h-[260px] w-full">
                <BarChart data={barData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="username"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={formatTokens} width={48} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar dataKey="input_tokens" fill="var(--color-input_tokens)" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="output_tokens" fill="var(--color-output_tokens)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Cost per User Area Chart */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Cost per User</CardTitle>
          </CardHeader>
          <CardContent>
            {costData.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No cost data</p>
            ) : (
              <ChartContainer config={costChartConfig} className="h-[260px] w-full">
                <AreaChart data={costData} margin={{ top: 4, right: 8, bottom: 40, left: 0 }}>
                  <defs>
                    <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    angle={-35}
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => "$" + v.toFixed(2)} width={56} />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => ["$" + Number(value).toFixed(4), "Cost"]}
                      />
                    }
                  />
                  <Area
                    type="monotone"
                    dataKey="total_cost"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    fill="url(#costGradient)"
                    dot={{ fill: "#f59e0b", strokeWidth: 0, r: 3 }}
                  />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
