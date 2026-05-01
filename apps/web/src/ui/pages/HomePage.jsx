import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";
import { Card, Button, Input, Badge } from "../components.jsx";

function statusTone(status) {
  if (status === "DONE") return "emerald";
  if (status === "IN_PROGRESS") return "sky";
  if (status === "BLOCKED") return "rose";
  return "amber";
}

export function HomePage() {
  const qc = useQueryClient();
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const projectsQ = useQuery({
    queryKey: ["projects"],
    queryFn: async () => (await api.get("/projects")).data,
  });

  const dashboardQ = useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => (await api.get("/dashboard")).data,
  });

  const overdue = useMemo(() => dashboardQ.data?.counts?.overdue ?? 0, [dashboardQ.data]);

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <Card title="Dashboard">
          {dashboardQ.isLoading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : dashboardQ.isError ? (
            <div className="text-sm text-rose-200">Failed to load dashboard</div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {Object.entries(dashboardQ.data.counts.byStatus).map(([k, v]) => (
                  <Badge key={k} tone={statusTone(k)}>
                    {k}: {v}
                  </Badge>
                ))}
              </div>
              <div className="text-sm text-slate-300">
                Overdue: <span className={overdue ? "text-rose-200 font-semibold" : "text-slate-200"}>{overdue}</span>
              </div>
              <div className="text-xs text-slate-400">Tip: members can update status of tasks assigned to them.</div>
            </div>
          )}
        </Card>

        <Card title="Create project">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setCreating(true);
              try {
                await api.post("/projects", { name: projectName, description: projectDesc || undefined });
                setProjectName("");
                setProjectDesc("");
                await qc.invalidateQueries({ queryKey: ["projects"] });
              } catch (err) {
                setError(err?.response?.data?.error || "Failed to create project");
              } finally {
                setCreating(false);
              }
            }}
          >
            <Input label="Name" value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="Website redesign" />
            <Input label="Description (optional)" value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="High-level goals, timeline…" />
            {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div>}
            <Button className="w-full" disabled={creating || !projectName.trim()}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </form>
        </Card>

        <Card title="My tasks">
          {dashboardQ.isLoading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : (
            <div className="space-y-2">
              {(dashboardQ.data?.myTasks || []).slice(0, 6).map((t) => (
                <div key={t.id} className="rounded-xl border border-slate-800 bg-slate-950/30 p-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-sm font-medium">{t.title}</div>
                    <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">{t.project.name}</div>
                </div>
              ))}
              {!dashboardQ.data?.myTasks?.length && <div className="text-sm text-slate-400">No assigned tasks yet.</div>}
            </div>
          )}
        </Card>
      </div>

      <Card
        title="Projects"
        right={
          <Button kind="ghost" onClick={() => qc.invalidateQueries({ queryKey: ["projects"] })}>
            Refresh
          </Button>
        }
      >
        {projectsQ.isLoading ? (
          <div className="text-sm text-slate-400">Loading…</div>
        ) : projectsQ.isError ? (
          <div className="text-sm text-rose-200">Failed to load projects</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {(projectsQ.data?.projects || []).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="group rounded-2xl border border-slate-800 bg-slate-950/30 p-4 hover:border-slate-700">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">{p.name}</div>
                    {p.description && <div className="mt-1 text-xs text-slate-400 line-clamp-2">{p.description}</div>}
                  </div>
                  <Badge tone={p.myRole === "ADMIN" ? "sky" : "slate"}>{p.myRole}</Badge>
                </div>
                <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                  <span>{p.counts.tasks} tasks</span>
                  <span className="opacity-40">•</span>
                  <span>{p.counts.memberships} members</span>
                </div>
              </Link>
            ))}
            {!projectsQ.data?.projects?.length && <div className="text-sm text-slate-400">Create your first project to get started.</div>}
          </div>
        )}
      </Card>
    </div>
  );
}

