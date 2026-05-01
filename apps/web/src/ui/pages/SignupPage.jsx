import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api.js";
import { Button, Card, Input } from "../components.jsx";

export function SignupPage({ onAuthed }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <div className="mx-auto max-w-md">
      <Card title="Create your account">
        <form
          className="space-y-3"
          onSubmit={async (e) => {
            e.preventDefault();
            setError("");
            setLoading(true);
            try {
              const { data } = await api.post("/auth/signup", { name: name || undefined, email, password });
              onAuthed(data);
            } catch (err) {
              setError(err?.response?.data?.error || "Signup failed");
            } finally {
              setLoading(false);
            }
          }}
        >
          <Input label="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} placeholder="Vipul" />
          <Input label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
          <Input label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} hint="Min 8 characters" />

          {error && <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-200">{error}</div>}

          <Button className="w-full" disabled={loading}>
            {loading ? "Creating..." : "Sign up"}
          </Button>

          <div className="text-center text-xs text-slate-400">
            Already have an account?{" "}
            <Link className="text-sky-300 hover:underline" to="/login">
              Login
            </Link>
          </div>
        </form>
      </Card>
    </div>
  );
}

