'use client';

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Upload,
  Rocket,
  Check,
  Loader2,
  Copy,
  ExternalLink,
  FileArchive,
  AlertCircle,
  Pause,
  Play,
  Terminal,
} from 'lucide-react';
import { API_URL } from '../../../lib/utils';

type DeploymentDetails = {
  id: string;
  agentDeploymentId?: string;
  status:
    | 'QUEUED'
    | 'BUILDING'
    | 'STARTING'
    | 'RUNNING'
    | 'CREATING_TUNNEL'
    | 'READY'
    | 'PAUSED'
    | 'FAILED'
    | 'RESUMING';
  url: string | null;
  localUrl?: string | null;
  port?: number | null;
  logs: string[];
  project?: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt?: string;
  updatedAt?: string;
};

function formatErrorMessage(err: unknown): string {
  if (!err) return 'An unexpected error occurred.';
  if (typeof err === 'string') return err;

  const msg =
    (err as { message?: string })?.message || String(err);

  const lower = msg.toLowerCase();
  if (
    (err as { name?: string })?.name === 'TypeError' ||
    lower.includes('failed to fetch') ||
    lower.includes('fetch failed') ||
    lower.includes('networkerror') ||
    lower.includes('econnrefused 127.0.0.1:4000') ||
    lower.includes('econnrefused localhost:4000')
  ) {
    return `Cannot connect to DeployX API at ${API_URL}.`;
  }

  if (
    msg.includes('DeployX Agent is offline') ||
    lower.includes('agent is offline') ||
    lower.includes('econnrefused 127.0.0.1:4100') ||
    lower.includes('econnrefused localhost:4100')
  ) {
    return 'DeployX Agent is offline. Start the DeployX Agent on this PC.';
  }

  if (lower.includes('500') || lower.includes('internal server error')) {
    return 'DeployX API returned an error.';
  }

  return msg || 'An error occurred during deployment.';
}

export default function DeployPage() {
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deploying, setDeploying] = useState(false);
  const [deployment, setDeployment] = useState<DeploymentDetails | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [agentRequired, setAgentRequired] = useState(false);
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string } | null>(null);

  const logEndRef = useRef<HTMLDivElement | null>(null);

  /*
   * -----------------------------------------
   * HEALTH CHECK ON MOUNT
   * -----------------------------------------
   */

  useEffect(() => {
    let mounted = true;
    const checkApiHealth = async () => {
      try {
        const response = await fetch(`${API_URL}/health`, {
          cache: 'no-store',
          credentials: 'include',
        });
        if (response.ok && mounted) {
          setError((prev) => (prev?.includes('Cannot connect to DeployX API') ? null : prev));
        }
      } catch {
        // Do not block initial render with an error before the user even uploads a project.
        // Cold-starting APIs will be reached when the user triggers the deployment.
      }
    };

    void checkApiHealth();
    return () => {
      mounted = false;
    };
  }, []);

  /*
   * -----------------------------------------
   * FILE SELECTION
   * -----------------------------------------
   */

  const selectFile = (selectedFile: File | null) => {
    setError(null);
    setDeployment(null);
    setLogs([]);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
      setError('Please select a ZIP file.');
      setFile(null);
      return;
    }

    setFile(selectedFile);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0] || null);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0] || null);
  };

  /*
   * -----------------------------------------
   * FETCH DEPLOYMENT STATUS / LOGS VIA API
   * -----------------------------------------
   */

  const loadDeployment = async (
    deploymentId: string,
  ): Promise<DeploymentDetails | null> => {
    try {
      const response = await fetch(`${API_URL}/deployments/${deploymentId}`, {
        cache: 'no-store',
        credentials: 'include',
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => null);
        if (
          errData?.message?.includes('Agent is offline') ||
          errData?.message?.includes('DeployX Agent')
        ) {
          setError(
            'DeployX Agent is offline. Start the DeployX Agent on this PC.',
          );
        }
        return null;
      }

      const data: DeploymentDetails = await response.json();
      setDeployment((prev) => ({
        ...prev,
        ...data,
      }));

      if (Array.isArray(data.logs) && data.logs.length > 0) {
        setLogs(data.logs);
      }

      if (data.status === 'FAILED') {
        setError('Deployment failed. Check the deployment terminal.');
      }

      return data;
    } catch (err: unknown) {
      const formatted = formatErrorMessage(err);
      if (formatted.includes('Cannot connect to DeployX API')) {
        setError(formatted);
      }
      return null;
    }
  };

  /*
   * -----------------------------------------
   * LIVE POLLING (1 SECOND INTERVAL)
   * -----------------------------------------
   */

  useEffect(() => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    const currentStatus = deployment.status;
    const shouldPoll =
      currentStatus === 'BUILDING' ||
      currentStatus === 'QUEUED' ||
      currentStatus === 'STARTING' ||
      currentStatus === 'RUNNING' ||
      currentStatus === 'CREATING_TUNNEL' ||
      currentStatus === 'RESUMING';

    if (!shouldPoll) return;

    let active = true;

    const poll = async () => {
      if (!active) return;
      const updated = await loadDeployment(deploymentId);
      if (
        updated &&
        (updated.status === 'READY' ||
          updated.status === 'PAUSED' ||
          updated.status === 'FAILED')
      ) {
        active = false;
      }
    };

    const interval = setInterval(poll, 1000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [deployment?.id, deployment?.status]);

  /*
   * -----------------------------------------
   * AUTO SCROLL TERMINAL
   * -----------------------------------------
   */

  useEffect(() => {
    logEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
  }, [logs]);

  /*
   * -----------------------------------------
   * DEPLOY VIA API (NON-BLOCKING)
   * -----------------------------------------
   */

  const deploy = async () => {
    if (!file) {
      setError('Choose a ZIP project first.');
      return;
    }

    setDeploying(true);
    setError(null);
    setDeployment(null);
    setLogs([]);
    setCopied(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${API_URL}/uploads/zip`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg =
          data?.message ||
          (Array.isArray(data?.message)
            ? data.message.join(', ')
            : 'Deployment failed.');
        if (errorMsg.includes('Connect your DeployX Agent')) {
          setAgentRequired(true);
          setError(null);
        }
        throw new Error(errorMsg);
      }

      // Initial deployment payload immediately returned from upload service
      const initialDeployment: DeploymentDetails = {
        id: data.deployment.id,
        agentDeploymentId: data.deployment.id,
        status: 'BUILDING',
        url: null,
        localUrl: null,
        port: null,
        logs: [
          'DeployX deployment started',
          'Project uploaded',
          'Sending project to DeployX Agent...',
        ],
        project: data.project,
      };

      setDeployment(initialDeployment);
      setLogs(initialDeployment.logs);

      // Immediately poll for current state from Agent via API
      if (initialDeployment.id) {
        void loadDeployment(initialDeployment.id);
      }
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setDeploying(false);
    }
  };

  /*
   * -----------------------------------------
   * PAUSE DEPLOYMENT VIA API
   * -----------------------------------------
   */

  const pauseDeployment = async () => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_URL}/deployments/${deploymentId}/pause`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to pause deployment.');
      }

      setDeployment((prev) =>
        prev
          ? {
              ...prev,
              ...data,
              status: 'PAUSED',
              url: null,
            }
          : null,
      );

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * -----------------------------------------
   * RESUME DEPLOYMENT VIA API
   * -----------------------------------------
   */

  const resumeDeployment = async () => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    setActionLoading(true);
    setError(null);
    setDeployment((prev) =>
      prev
        ? {
            ...prev,
            status: 'RESUMING',
          }
        : null,
    );

    try {
      const response = await fetch(
        `${API_URL}/deployments/${deploymentId}/resume`,
        {
          method: 'POST',
          credentials: 'include',
        },
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Failed to resume deployment.');
      }

      setDeployment((prev) =>
        prev
          ? {
              ...prev,
              ...data,
              status: data.status || 'READY',
              url: data.url || data.publicUrl || null,
            }
          : null,
      );

      if (data.logs && Array.isArray(data.logs)) {
        setLogs(data.logs);
      }
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
      void loadDeployment(deploymentId);
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * -----------------------------------------
   * COPY URL
   * -----------------------------------------
   */

  const copyUrl = async () => {
    const url = deployment?.url;
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);

    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  /*
   * -----------------------------------------
   * STATUS & DERIVED STATE
   * -----------------------------------------
   */

  const currentStatus = deployment?.status || 'QUEUED';
  const publicUrl = deployment?.url || '';

  const statusReady = currentStatus === 'READY';
  const statusPaused = currentStatus === 'PAUSED';
  const statusFailed = currentStatus === 'FAILED';
  const statusBuilding =
    currentStatus === 'BUILDING' ||
    currentStatus === 'QUEUED' ||
    currentStatus === 'STARTING' ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL';
  const statusResuming = currentStatus === 'RESUMING';

  // Pipeline check marks calculated from real lifecycle
  const isUploaded = !!deployment;
  const isBuilt =
    statusReady ||
    statusPaused ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    logs.some(
      (l) =>
        l.includes('Build completed') ||
        l.includes('Compiled successfully') ||
        l.includes('Build finished') ||
        l.includes('Project ready'),
    );
  const isRunning =
    statusReady ||
    statusPaused ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    logs.some(
      (l) =>
        l.includes('Application healthy') ||
        l.includes('Application started') ||
        l.includes('Container running') ||
        l.includes('Ready in'),
    );
  const isPublic = statusReady && !!publicUrl;

  /*
   * -----------------------------------------
   * UI
   * -----------------------------------------
   */

  return (
    <main className="min-h-screen bg-[#0b0b0d] text-white">
      <div className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-black">
              <Rocket size={18} strokeWidth={2.5} />
            </div>

            <span className="text-sm font-semibold tracking-wide text-zinc-300">
              DeployX
            </span>
          </div>

          <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">
            Deploy your project.
          </h1>

          <p className="mt-3 max-w-xl text-base leading-7 text-zinc-400">
            Upload your student project and DeployX will build it, run it in
            Docker, and create a temporary Cloudflare public URL.
          </p>
        </div>

        {/* Upload Card */}
        <div className="rounded-3xl border border-white/10 bg-[#111114] p-5 shadow-2xl md:p-7">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={[
              'flex min-h-[280px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed transition',
              dragging
                ? 'border-white bg-white/[0.06]'
                : 'border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]',
            ].join(' ')}
          >
            <input
              id="project-upload"
              type="file"
              accept=".zip"
              className="hidden"
              onChange={handleFileChange}
            />

            {file ? (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <FileArchive size={27} />
                </div>

                <h2 className="text-lg font-medium">{file.name}</h2>

                <p className="mt-2 text-sm text-zinc-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>

                <label
                  htmlFor="project-upload"
                  className="mt-5 cursor-pointer rounded-xl border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:bg-white/5"
                >
                  Choose another ZIP
                </label>
              </>
            ) : (
              <>
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
                  <Upload size={26} />
                </div>

                <h2 className="text-lg font-medium">Drop your ZIP here</h2>

                <p className="mt-2 text-sm text-zinc-500">
                  or select a project from your computer
                </p>

                <label
                  htmlFor="project-upload"
                  className="mt-5 cursor-pointer rounded-xl bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:bg-zinc-200"
                >
                  Choose ZIP
                </label>
              </>
            )}
          </div>

          {/* Deploy Button */}
          <button
            onClick={deploy}
            disabled={!file || deploying}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {deploying ? (
              <>
                <Loader2 size={17} className="animate-spin" />
                Uploading & Starting...
              </>
            ) : (
              <>
                <Rocket size={17} />
                Deploy Project
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300">
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {agentRequired && (
            <div className="mt-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-center">
              <p className="text-sm font-semibold text-amber-200">Connect your DeployX Agent before deploying.</p>
              <p className="mt-1 text-xs text-zinc-400">Start the Agent on your PC, then pair it with the code below.</p>
              {!pairing ? (
                <button
                  onClick={async () => {
                    const res = await fetch(`${API_URL}/agents/pair`, { method: 'POST', credentials: 'include' });
                    const data = await res.json().catch(() => null);
                    if (res.ok && data?.code) setPairing({ code: data.code, expiresAt: data.expiresAt });
                  }}
                  className="mt-3 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
                >
                  Connect Agent
                </button>
              ) : (
                <div className="mt-3">
                  <p className="font-mono text-2xl font-bold tracking-[0.3em] text-white">{pairing.code}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">POST it to http://localhost:4100/agent/pair</p>
                  <button onClick={() => setAgentRequired(false)} className="mt-2 text-xs text-zinc-400 underline">Dismiss</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Deployment Section */}
        {deployment && (
          <div className="mt-8 rounded-3xl border border-white/10 bg-[#111114] p-6 md:p-7">
            {/* Header */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-zinc-500">Deployment</p>
                <h2 className="mt-1 text-xl font-medium">
                  {deployment.project?.name || 'Student Project'}
                </h2>
              </div>

              <div
                className={[
                  'flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium',
                  statusReady
                    ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                    : statusPaused
                    ? 'border-yellow-500/20 bg-yellow-500/10 text-yellow-400'
                    : statusFailed
                    ? 'border-red-500/20 bg-red-500/10 text-red-400'
                    : 'border-blue-500/20 bg-blue-500/10 text-blue-400',
                ].join(' ')}
              >
                {statusBuilding || statusResuming ? (
                  <Loader2 size={12} className="animate-spin text-blue-400" />
                ) : (
                  <span
                    className={[
                      'h-1.5 w-1.5 rounded-full',
                      statusReady
                        ? 'bg-emerald-400'
                        : statusPaused
                        ? 'bg-yellow-400'
                        : statusFailed
                        ? 'bg-red-400'
                        : 'bg-blue-400',
                    ].join(' ')}
                  />
                )}

                {currentStatus}
              </div>
            </div>

            {/* Pipeline Steps (Part 14) */}
            <div className="mt-7 grid gap-3 md:grid-cols-4">
              {[
                { label: 'Uploaded', done: isUploaded },
                { label: 'Built', done: isBuilt },
                { label: 'Running', done: isRunning },
                { label: 'Public', done: isPublic },
              ].map((step) => (
                <div
                  key={step.label}
                  className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-4"
                >
                  <div
                    className={[
                      'flex h-7 w-7 items-center justify-center rounded-full transition-colors',
                      step.done
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-white/5 text-zinc-600',
                    ].join(' ')}
                  >
                    {step.done ? (
                      <Check size={15} />
                    ) : (
                      <div className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
                    )}
                  </div>

                  <span
                    className={[
                      'text-sm font-medium',
                      step.done ? 'text-zinc-200' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Terminal Logs (Part 13) */}
            <div className="mt-7 overflow-hidden rounded-2xl border border-white/10 bg-[#09090b]">
              <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
                <Terminal size={15} className="text-zinc-500" />
                <span className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Deployment logs
                </span>

                {(statusBuilding || statusResuming || deploying) && (
                  <Loader2
                    size={14}
                    className="ml-auto animate-spin text-zinc-500"
                  />
                )}
              </div>

              <div className="h-64 overflow-y-auto px-4 py-4 font-mono text-xs leading-6 text-zinc-400">
                {logs.length === 0 ? (
                  <div className="text-zinc-600">
                    Waiting for deployment logs...
                  </div>
                ) : (
                  logs.map((log, index) => (
                    <div
                      key={`${index}-${log}`}
                      className="whitespace-pre-wrap"
                    >
                      <span className="mr-2 text-zinc-700">$</span>
                      {log}
                    </div>
                  ))
                )}
                <div ref={logEndRef} />
              </div>
            </div>

            {/* Public URL Box (Part 15) */}
            {statusReady && publicUrl && (
              <div className="mt-7 rounded-2xl border border-white/10 bg-black/20 p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Public URL
                </p>

                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1 truncate rounded-xl bg-white/[0.04] px-4 py-3 font-mono text-sm text-zinc-300">
                    {publicUrl}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={copyUrl}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                    >
                      {copied ? (
                        <>
                          <Check size={16} />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy size={16} />
                          Copy
                        </>
                      )}
                    </button>

                    <a
                      href={publicUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5"
                    >
                      <ExternalLink size={16} />
                      Open
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Paused URL Box */}
            {statusPaused && (
              <div className="mt-7 rounded-2xl border border-yellow-500/10 bg-yellow-500/[0.03] p-5">
                <p className="text-xs font-medium uppercase tracking-wider text-yellow-500/70">
                  Public URL
                </p>
                <p className="mt-2 font-mono text-sm text-zinc-500">
                  — (Project paused — no public URL)
                </p>
              </div>
            )}

            {/* Controls (Pause / Resume) (Part 16) */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {statusReady && (
                <button
                  onClick={pauseDeployment}
                  disabled={actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:bg-white/5 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Pause size={16} />
                  )}
                  Pause
                </button>
              )}

              {statusPaused && (
                <button
                  onClick={resumeDeployment}
                  disabled={actionLoading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:opacity-40"
                >
                  {actionLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} />
                  )}
                  Resume
                </button>
              )}

              {statusResuming && (
                <button
                  disabled
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 px-4 py-3 text-sm font-medium text-zinc-300 opacity-60"
                >
                  <Loader2 size={16} className="animate-spin" />
                  Resuming...
                </button>
              )}
            </div>

            {/* Technical Information */}
            <div className="mt-5 flex flex-wrap gap-5 text-xs text-zinc-500">
              {deployment.port && <span>Port: {deployment.port}</span>}
              {deployment.localUrl && <span>Local: {deployment.localUrl}</span>}
              <span>Status: {currentStatus}</span>
              {deployment.id && (
                <span className="font-mono">ID: {deployment.id}</span>
              )}
              {deployment.agentDeploymentId &&
                deployment.agentDeploymentId !== deployment.id && (
                  <span className="font-mono">
                    Agent ID: {deployment.agentDeploymentId}
                  </span>
                )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}