import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../lib/api.js";
import { Badge, Button, Card, Input, Select } from "../components.jsx";
import { getSession } from "../../lib/auth.js";

function statusTone(status) {
  if (status === "DONE") return "emerald";
  if (status === "IN_PROGRESS") return "sky";
  if (status === "BLOCKED") return "rose";
  return "amber";
}

export function ProjectPage() {
  const { projectId } = useParams();
  const qc = useQueryClient();
  const session = getSession();

  const membersQ = useQuery({
    queryKey: ["members", projectId],
    queryFn: async () => (await api.get(`/projects/${projectId}/members`)).data,
  });

  const tasksQ = useQuery({
    queryKey: ["tasks", projectId],
    queryFn: async () => (await api.get("/tasks", { params: { projectId } })).data,
  });

  const myRole = useMemo(() => {
    const me = membersQ.data?.members?.find((m) => m.user.id === session?.user?.id);
    return me?.role || "MEMBER";
  }, [membersQ.data, session?.user?.id]);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignee, setAssignee] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">Project</div>
          <div className="text-lg font-semibold">Tasks & Team</div>
        </div>
        <Badge tone={myRole === "ADMIN" ? "sky" : "slate"}>{myRole}</Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Create task">
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              setError("");
              setCreating(true);
              try {
                await api.post("/tasks", {
                  projectId,
                  title,
                  description: desc || undefined,
                  dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
                  assignedToId: assignee || undefined,
                });
                setTitle("");
                setDesc("");
                setDueDate("");
                setAssignee("");
                await qc.invalidateQueries({ queryKey: ["tasks", projectId] });
                await qc.invalidateQueries({ queryKey: ["dashboard"] });
              } catch (err) {
                setError(err?.response?.data?.error || "Failed to create task");
              } finally {
                setCreating(false);
              }
            }}
          >
            <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Implement login page" />
            <Input label="Description (optional)" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Acceptance criteria…" />
            <Input label="Due date (optional)" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

            <Select label="Assign to (optional)" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
              <option value="">Unassigned</option>
              {(membersQ.data?.members || []).map((m) => (
                <option key={m.user.id} value={m.user.id}>
                  {m.user.name ? `${m.user.name} (${m.user.email})` : m.user.email}
                </option>
              ))}
            </Select>

            {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div>}
            <Button className="w-full" disabled={creating || !title.trim()}>
              {creating ? "Creating…" : "Create task"}
            </Button>
          </form>
        </Card>

        <Card title="Team">
          {membersQ.isLoading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : membersQ.isError ? (
            <div className="text-sm text-rose-200">Failed to load members</div>
          ) : (
            <div className="space-y-2">
              {(membersQ.data?.members || []).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/30 p-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.user.name || m.user.email}</div>
                    <div className="truncate text-xs text-slate-400">{m.user.email}</div>
                  </div>
                  <Badge tone={m.role === "ADMIN" ? "sky" : "slate"}>{m.role}</Badge>
                </div>
              ))}
            </div>
          )}

          {myRole === "ADMIN" && (
            <div className="mt-4 border-t border-slate-800 pt-4">
              <div className="mb-2 text-xs font-semibold text-slate-300">Invite / add member</div>
              <form
                className="space-y-2"
                onSubmit={async (e) => {
                  e.preventDefault();
                  setInviteError("");
                  setInviting(true);
                  try {
                    await api.post(`/projects/${projectId}/members`, { email: inviteEmail, role: inviteRole });
                    setInviteEmail("");
                    setInviteRole("MEMBER");
                    await qc.invalidateQueries({ queryKey: ["members", projectId] });
                  } catch (err) {
                    setInviteError(err?.response?.data?.error || "Failed to add member");
                  } finally {
                    setInviting(false);
                  }
                }}
              >
                <Input label="User email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="member@company.com" />
                <Select label="Role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  <option value="MEMBER">MEMBER</option>
                  <option value="ADMIN">ADMIN</option>
                </Select>
                {inviteError && (
                  <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{inviteError}</div>
                )}
                <Button className="w-full" disabled={inviting || !inviteEmail.trim()}>
                  {inviting ? "Adding…" : "Add member"}
                </Button>
              </form>
            </div>
          )}
        </Card>

        <Card
          title="Tasks"
          right={
            <Button
              kind="ghost"
              onClick={() => {
                qc.invalidateQueries({ queryKey: ["tasks", projectId] });
                qc.invalidateQueries({ queryKey: ["members", projectId] });
              }}
            >
              Refresh
            </Button>
          }
        >
          {tasksQ.isLoading ? (
            <div className="text-sm text-slate-400">Loading…</div>
          ) : tasksQ.isError ? (
            <div className="text-sm text-rose-200">Failed to load tasks</div>
          ) : (
            <div className="space-y-2">
              {(tasksQ.data?.tasks || []).map((t) => {
                const canMemberUpdateStatus = myRole !== "ADMIN" && t.assignedTo?.id === session?.user?.id;
                const canAdminEdit = myRole === "ADMIN";

                return (
                  <div key={t.id} className="rounded-2xl border border-slate-800 bg-slate-950/30 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold">{t.title}</div>
                        {t.description && <div className="mt-1 text-xs text-slate-400">{t.description}</div>}
                        <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-400">
                          <span>
                            Assigned: <span className="text-slate-200">{t.assignedTo?.email || "Unassigned"}</span>
                          </span>
                          {t.dueDate && (
                            <>
                              <span className="opacity-40">•</span>
                              <span>
                                Due: <span className="text-slate-200">{new Date(t.dueDate).toLocaleDateString()}</span>
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge tone={statusTone(t.status)}>{t.status}</Badge>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Select
                        value={t.status}
                        disabled={!canAdminEdit && !canMemberUpdateStatus}
                        onChange={async (e) => {
                          const next = e.target.value;
                          await api.patch(`/tasks/${t.id}`, { status: next });
                          await qc.invalidateQueries({ queryKey: ["tasks", projectId] });
                          await qc.invalidateQueries({ queryKey: ["dashboard"] });
                        }}
                      >
                        <option value="TODO">TODO</option>
                        <option value="IN_PROGRESS">IN_PROGRESS</option>
                        <option value="BLOCKED">BLOCKED</option>
                        <option value="DONE">DONE</option>
                      </Select>

                      {canAdminEdit && (
                        <Button
                          kind="ghost"
                          onClick={async () => {
                            await api.delete(`/tasks/${t.id}`);
                            await qc.invalidateQueries({ queryKey: ["tasks", projectId] });
                            await qc.invalidateQueries({ queryKey: ["dashboard"] });
                          }}
                        >
                          Delete
                        </Button>
                      )}
                    </div>

                    {!canAdminEdit && !canMemberUpdateStatus && (
                      <div className="mt-2 text-xs text-slate-500">
                        Only admins can edit tasks. Members can update status only for tasks assigned to them.
                      </div>
                    )}
                  </div>
                );
              })}
              {!tasksQ.data?.tasks?.length && <div className="text-sm text-slate-400">No tasks yet. Create one on the left.</div>}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

