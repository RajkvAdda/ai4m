"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { BrainCircuit, KeyRound, BarChart2 } from "lucide-react";
import type { NormalizedRecord } from "./page";

const CLAUDE_MODELS = [
  { value: "claude-opus-4-5", label: "Claude Opus 4.5", color: "text-purple-600" },
  { value: "claude-sonnet-4-5", label: "Claude Sonnet 4.5", color: "text-indigo-600" },
  { value: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet", color: "text-blue-600" },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", color: "text-teal-600" },
  { value: "claude-3-opus-20240229", label: "Claude 3 Opus", color: "text-violet-600" },
  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku", color: "text-cyan-600" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editRecord?: NormalizedRecord | null;
}

const empty = {
  username: "",
  host: "",
  platform: "",
  sent_at: "",
  model_type: "",
  input_tokens: "",
  output_tokens: "",
  total_cost: "",
};

export default function ClaudeUsesForm({ open, onClose, onSaved, editRecord }: Props) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(empty);

  useEffect(() => {
    if (editRecord) {
      setForm({
        username: editRecord.username,
        host: editRecord.host,
        platform: editRecord.platform,
        sent_at: editRecord.sent_at ? editRecord.sent_at.slice(0, 16) : "",
        model_type: editRecord.model_type ?? "",
        input_tokens: editRecord.input_tokens > 0 ? String(editRecord.input_tokens) : "",
        output_tokens: editRecord.output_tokens > 0 ? String(editRecord.output_tokens) : "",
        total_cost: editRecord.total_cost > 0 ? String(editRecord.total_cost) : "",
      });
    } else {
      setForm(empty);
    }
  }, [editRecord, open]);

  const handleChange = (key: keyof typeof empty, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const totalTokensPreview =
    (Number(form.input_tokens) || 0) + (Number(form.output_tokens) || 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.username.trim()) {
      toast({ title: "Username is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        model_type: form.model_type || undefined,
        input_tokens: form.input_tokens ? Number(form.input_tokens) : 0,
        output_tokens: form.output_tokens ? Number(form.output_tokens) : 0,
        total_cost: form.total_cost ? Number(form.total_cost) : 0,
      };

      let res: Response;

      if (editRecord) {
        res = await fetch("/api/claudeUses", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            _id: editRecord._id,
            username: form.username.trim(),
            host: form.host.trim(),
            platform: form.platform.trim(),
            sent_at: form.sent_at || new Date().toISOString(),
            data,
          }),
        });
      } else {
        res = await fetch("/api/claudeUses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: form.username.trim(),
            host: form.host.trim(),
            platform: form.platform.trim(),
            sent_at: form.sent_at || new Date().toISOString(),
            data,
          }),
        });
      }

      const json = await res.json();
      if (res.ok) {
        toast({
          title: editRecord ? "Record Updated" : "Record Saved",
          description: json.message,
        });
        onSaved();
        onClose();
      } else {
        toast({
          title: "Error",
          description: JSON.stringify(json.error),
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden gap-0">
        {/* Gradient modal header */}
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <BrainCircuit className="h-5 w-5" />
              {editRecord ? "Edit Claude Usage" : "Add Claude Usage"}
            </DialogTitle>
            <p className="text-indigo-100 text-xs mt-0.5">
              {editRecord
                ? "Update token usage and charges for this record"
                : "Upsert based on username + host + platform combination"}
            </p>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* Identity section */}
          <div className="rounded-xl border border-indigo-100 bg-gradient-to-br from-indigo-50/60 to-blue-50/40 p-4 space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <KeyRound className="h-3.5 w-3.5 text-indigo-500" />
              <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                Identity Key
              </span>
              <span className="text-xs text-indigo-400 font-normal normal-case ml-1">
                unique combination
              </span>
            </div>

            <div className="space-y-1">
              <Label htmlFor="username" className="text-xs font-medium text-gray-700">
                Username <span className="text-red-500">*</span>
              </Label>
              <Input
                id="username"
                placeholder="e.g. john_doe"
                value={form.username}
                onChange={(e) => handleChange("username", e.target.value)}
                className="bg-white/80 border-indigo-100 focus:border-indigo-300 h-9 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="host" className="text-xs font-medium text-gray-700">Host</Label>
                <Input
                  id="host"
                  placeholder="e.g. DESKTOP-ABC"
                  value={form.host}
                  onChange={(e) => handleChange("host", e.target.value)}
                  className="bg-white/80 border-indigo-100 focus:border-indigo-300 h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="platform" className="text-xs font-medium text-gray-700">Platform</Label>
                <Input
                  id="platform"
                  placeholder="e.g. Windows"
                  value={form.platform}
                  onChange={(e) => handleChange("platform", e.target.value)}
                  className="bg-white/80 border-indigo-100 focus:border-indigo-300 h-9 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Model + Timestamp */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="model_type" className="text-xs font-medium text-gray-700">
                Model Type
              </Label>
              <Select value={form.model_type} onValueChange={(v) => handleChange("model_type", v)}>
                <SelectTrigger id="model_type" className="h-9 text-sm bg-white border-gray-200">
                  <SelectValue placeholder="Select model…" />
                </SelectTrigger>
                <SelectContent>
                  {CLAUDE_MODELS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      <span className={`text-sm ${m.color}`}>{m.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sent_at" className="text-xs font-medium text-gray-700">
                Recorded At
              </Label>
              <Input
                id="sent_at"
                type="datetime-local"
                value={form.sent_at}
                onChange={(e) => handleChange("sent_at", e.target.value)}
                className="h-9 text-sm bg-white border-gray-200"
              />
            </div>
          </div>

          {/* Metrics section */}
          <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/60 to-orange-50/30 p-4 space-y-3">
            <div className="flex items-center gap-1.5 mb-1">
              <BarChart2 className="h-3.5 w-3.5 text-amber-500" />
              <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                Usage Metrics
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="input_tokens" className="text-xs font-medium text-gray-700">
                  Input Tokens
                </Label>
                <Input
                  id="input_tokens"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.input_tokens}
                  onChange={(e) => handleChange("input_tokens", e.target.value)}
                  className="bg-white/80 border-indigo-100 focus:border-indigo-300 h-9 text-sm font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="output_tokens" className="text-xs font-medium text-gray-700">
                  Output Tokens
                </Label>
                <Input
                  id="output_tokens"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={form.output_tokens}
                  onChange={(e) => handleChange("output_tokens", e.target.value)}
                  className="bg-white/80 border-cyan-100 focus:border-cyan-300 h-9 text-sm font-mono"
                />
              </div>
            </div>

            {/* Live total tokens preview */}
            {totalTokensPreview > 0 && (
              <div className="flex items-center justify-between rounded-lg bg-purple-50 border border-purple-100 px-3 py-2">
                <span className="text-xs text-purple-600 font-medium">Total Tokens</span>
                <span className="font-mono text-sm font-bold text-purple-700">
                  {totalTokensPreview.toLocaleString()}
                </span>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="total_cost" className="text-xs font-medium text-gray-700">
                Total Cost (USD)
              </Label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-sm text-amber-500 font-semibold">$</span>
                <Input
                  id="total_cost"
                  type="number"
                  min="0"
                  step="0.0001"
                  placeholder="0.0000"
                  value={form.total_cost}
                  onChange={(e) => handleChange("total_cost", e.target.value)}
                  className="pl-6 bg-white/80 border-amber-100 focus:border-amber-300 h-9 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={saving} className="h-9">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={saving}
              className="h-9 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-sm"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                  Saving…
                </span>
              ) : editRecord ? "Update Record" : "Save Record"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
