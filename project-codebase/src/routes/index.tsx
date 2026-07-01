import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "API Explorer — Users, Projects, Tasks, Notes" },
      {
        name: "description",
        content:
          "Interactive documentation for a Node.js/Express REST API with CRUD endpoints for users, projects, tasks, and notes.",
      },
      { property: "og:title", content: "API Explorer" },
      {
        property: "og:description",
        content: "Interactive docs for a Node.js/Express CRUD API.",
      },
    ],
  }),
  component: Index,
});

type Method = "GET" | "POST" | "PUT" | "DELETE";
type Resource = "users" | "projects" | "tasks" | "notes";

const RESOURCES: {
  key: Resource;
  label: string;
  sampleBody: Record<string, unknown>;
}[] = [
  { key: "users", label: "Users", sampleBody: { name: "Grace Hopper", email: "grace@example.com", role: "member" } },
  { key: "projects", label: "Projects", sampleBody: { name: "COBOL", description: "Compiler work", ownerId: "u_1" } },
  { key: "tasks", label: "Tasks", sampleBody: { title: "Write spec", status: "todo", projectId: "p_1", assigneeId: "u_2" } },
  { key: "notes", label: "Notes", sampleBody: { title: "Standup", body: "Weekly sync notes", authorId: "u_1" } },
];

const METHODS: { method: Method; needsId: boolean; needsBody: boolean; status: string }[] = [
  { method: "GET", needsId: false, needsBody: false, status: "200" },
  { method: "POST", needsId: false, needsBody: true, status: "201" },
  { method: "PUT", needsId: true, needsBody: true, status: "200" },
  { method: "DELETE", needsId: true, needsBody: false, status: "204" },
];

function Index() {
  const [apiBase, setApiBase] = useState("http://localhost:3001");
  const [health, setHealth] = useState<"unknown" | "up" | "down">("unknown");
  const [resource, setResource] = useState<Resource>("users");
  const [method, setMethod] = useState<Method>("GET");
  const [id, setId] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    ok: boolean;
    time: number;
    body: string;
  } | null>(null);

  const current = RESOURCES.find((r) => r.key === resource)!;
  const spec = METHODS.find((m) => m.method === method)!;

  useEffect(() => {
    setBody(spec.needsBody ? JSON.stringify(current.sampleBody, null, 2) : "");
  }, [resource, method]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    setHealth("unknown");
    fetch(`${apiBase}/health`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(() => !cancelled && setHealth("up"))
      .catch(() => !cancelled && setHealth("down"));
    return () => {
      cancelled = true;
    };
  }, [apiBase, response]);

  const url = useMemo(() => {
    const base = `${apiBase}/api/${resource}`;
    return spec.needsId && id ? `${base}/${id}` : base;
  }, [apiBase, resource, id, spec.needsId]);

  async function send() {
    setLoading(true);
    const started = performance.now();
    try {
      const res = await fetch(url, {
        method,
        headers: spec.needsBody ? { "Content-Type": "application/json" } : undefined,
        body: spec.needsBody ? body : undefined,
      });
      const text = await res.text();
      let pretty = text;
      try {
        pretty = JSON.stringify(JSON.parse(text), null, 2);
      } catch {
        /* not JSON */
      }
      setResponse({
        status: res.status,
        ok: res.ok,
        time: Math.round(performance.now() - started),
        body: pretty || "(empty body)",
      });
    } catch (e) {
      setResponse({
        status: 0,
        ok: false,
        time: Math.round(performance.now() - started),
        body: `Network error: ${(e as Error).message}\n\nIs the API running? Try:\n  bun run server`,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">API Explorer</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Node.js · Express · TypeScript · CRUD for users, projects, tasks & notes
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-2 w-2 rounded-full ${
                health === "up"
                  ? "bg-emerald-500"
                  : health === "down"
                    ? "bg-red-500"
                    : "bg-muted-foreground"
              }`}
              aria-label={`API ${health}`}
            />
            <span className="text-xs text-muted-foreground">
              {health === "up" ? "API online" : health === "down" ? "API offline — run `bun run server`" : "checking…"}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[280px_1fr]">
        <aside className="space-y-6">
          <section>
            <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
              API base URL
            </label>
            <input
              value={apiBase}
              onChange={(e) => setApiBase(e.target.value)}
              className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Resource
            </h2>
            <div className="mt-2 grid gap-1">
              {RESOURCES.map((r) => (
                <button
                  key={r.key}
                  onClick={() => setResource(r.key)}
                  className={`rounded-md px-3 py-2 text-left text-sm transition ${
                    resource === r.key
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-accent"
                  }`}
                >
                  /api/{r.key}
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Method
            </h2>
            <div className="mt-2 grid grid-cols-2 gap-1">
              {METHODS.map((m) => (
                <button
                  key={m.method}
                  onClick={() => setMethod(m.method)}
                  className={`rounded-md px-3 py-2 text-xs font-mono transition ${
                    method === m.method
                      ? "bg-foreground text-background"
                      : "border border-border hover:bg-accent"
                  }`}
                >
                  {m.method}
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="space-y-6">
          <div className="rounded-lg border border-border bg-card p-5">
            <div className="flex flex-wrap items-center gap-2 font-mono text-sm">
              <span className="rounded bg-muted px-2 py-1 text-xs font-semibold">{method}</span>
              <code className="break-all text-muted-foreground">{url}</code>
              <span className="ml-auto rounded border border-border px-2 py-0.5 text-xs text-muted-foreground">
                expect {spec.status}
              </span>
            </div>

            {spec.needsId && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-muted-foreground">
                  Resource ID
                </label>
                <input
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder={resource === "users" ? "u_1" : resource === "projects" ? "p_1" : resource === "tasks" ? "t_1" : "n_1"}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            {spec.needsBody && (
              <div className="mt-4">
                <label className="block text-xs font-medium text-muted-foreground">
                  Request body (JSON)
                </label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={8}
                  className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={send}
                disabled={loading}
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send request"}
              </button>
              {response && (
                <span className="text-xs text-muted-foreground">
                  <span
                    className={`font-mono font-semibold ${
                      response.ok ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {response.status || "ERR"}
                  </span>{" "}
                  · {response.time}ms
                </span>
              )}
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Response
            </div>
            <pre className="max-h-[420px] overflow-auto p-5 font-mono text-xs">
              {response?.body ?? "Send a request to see the response."}
            </pre>
          </div>

          <div className="rounded-lg border border-border bg-card p-5 text-sm">
            <h3 className="font-medium">Getting started</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
              <li>
                <code className="rounded bg-muted px-1">cp .env.example .env</code>
              </li>
              <li>
                <code className="rounded bg-muted px-1">bun run server</code> — starts Express on{" "}
                <code>:3001</code>
              </li>
              <li>Use this page to send GET / POST / PUT / DELETE against each resource.</li>
              <li>
                Set <code>DATABASE_URL</code> in <code>.env</code> and swap the store in{" "}
                <code>server/db.ts</code> to connect a real database.
              </li>
            </ol>
          </div>
        </section>
      </main>
    </div>
  );
}
