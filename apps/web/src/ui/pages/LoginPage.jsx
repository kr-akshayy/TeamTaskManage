import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import { Button, Card, Input } from "../components.jsx";

export function LoginPage({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-md">
      <Card title="Welcome back">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const { data } = await api.post("/auth/login", { email, password });
              onAuthed(data);
            } catch (err) {
              setError(err?.response?.data?.error || "Login failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div>}

          <Button className="w-full" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>

          <div className="text-center text-xs text-slate-400">
            No account?{" "}
            <Link className="text-sky-300 hover:underline" to="/signup">
              Sign up
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

