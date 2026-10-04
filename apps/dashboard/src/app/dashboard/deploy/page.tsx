'use client';

import {
  ChangeEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
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
  Trash2,
  Globe,
  Radio,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { API_URL, formatErrorMessage, truncateId } from '../../../lib/utils';
import { StatusBadge } from '../../../components/StatusBadge';
import { DeploymentTerminal } from '../../../components/DeploymentTerminal';
import { ConfirmModal } from '../../../components/ConfirmModal';

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
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /*
   * Health Check on Mount
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
        // Cold-starting API check
      }
    };

    void checkApiHealth();
    return () => {
      mounted = false;
    };
  }, []);

  /*
   * File selection
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
      setError('Please select a valid .ZIP project archive.');
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
   * Load deployment updates
   */
  const loadDeployment = async (deploymentId: string): Promise<DeploymentDetails | null> => {
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
          setError('DeployX Agent is offline. Launch DeployX Agent on your PC.');
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
        setError('Deployment failed. Review the terminal output below for error details.');
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
   * Live polling (1-1.5s interval while building)
   */
  useEffect(() => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    const currentStatus = deployment.status;
    const isAlreadyLive = (currentStatus === 'READY' || currentStatus === 'RUNNING') && !!deployment.url;
    const shouldPoll =
      !isAlreadyLive &&
      (currentStatus === 'BUILDING' ||
        currentStatus === 'QUEUED' ||
        currentStatus === 'STARTING' ||
        currentStatus === 'RUNNING' ||
        currentStatus === 'CREATING_TUNNEL' ||
        currentStatus === 'RESUMING');

    if (!shouldPoll) return;

    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      const updated = await loadDeployment(deploymentId);
      if (
        updated &&
        (updated.status === 'READY' ||
          (updated.status === 'RUNNING' && updated.url) ||
          updated.status === 'PAUSED' ||
          updated.status === 'FAILED')
      ) {
        active = false;
      }
    }, 1200);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [deployment?.id, deployment?.status]);

  /*
   * Deploy via API
   */
  const deploy = async () => {
    if (!file) {
      setError('Please choose a .ZIP archive first.');
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        const errMsg = errorData?.message || 'Failed to upload project.';

        if (
          errMsg.includes('DeployX Agent is offline') ||
          errMsg.includes('No online agents found') ||
          errMsg.includes('Agent offline')
        ) {
          setAgentRequired(true);
          throw new Error('Your DeployX Agent is offline. Open DeployX Agent on your PC.');
        }

        throw new Error(errMsg);
      }

      const data = await response.json();

      setDeployment({
        id: data.deployment?.id || data.id,
        agentDeploymentId: data.deployment?.id || data.id,
        status: data.deployment?.status || data.status || 'QUEUED',
        url: data.deployment?.url || data.url || null,
        localUrl: data.deployment?.localUrl || null,
        port: data.deployment?.port || null,
        logs: data.deployment?.logs || [],
        project: data.project || {
          id: data.deployment?.projectId,
          name: data.deployment?.projectName || file.name.replace(/\.zip$/i, ''),
          slug: '',
        },
      });

      if (data.deployment?.logs?.length) {
        setLogs(data.deployment.logs);
      }

      // Initial status load
      if (data.deployment?.id) {
        void loadDeployment(data.deployment.id);
      }
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setDeploying(false);
    }
  };

  /*
   * Pause deployment
   */
  const pauseDeployment = async () => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/deployments/${deploymentId}/pause`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to pause deployment.');
      }

      void loadDeployment(deploymentId);
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * Resume deployment
   */
  const resumeDeployment = async () => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/deployments/${deploymentId}/resume`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to resume deployment.');
      }

      void loadDeployment(deploymentId);
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  /*
   * Copy URL
   */
  const copyUrl = async () => {
    const url = deployment?.url;
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /*
   * Delete deployment
   */
  const handleDelete = async () => {
    const deploymentId = deployment?.id;
    if (!deploymentId) return;

    setDeleting(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/deployments/${deploymentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.message || 'Failed to delete deployment.');
      }

      setDeployment(null);
      setLogs([]);
      setFile(null);
      setDeleteOpen(false);
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  const currentStatus = deployment?.status || 'QUEUED';
  const publicUrl = deployment?.url || '';
  const isLive = (currentStatus === 'READY' || currentStatus === 'RUNNING') && !!publicUrl;
  const statusPaused = currentStatus === 'PAUSED';
  const statusFailed = currentStatus === 'FAILED';

  // Pipeline check marks
  const isUploaded = !!deployment;
  const isBuilt =
    isLive ||
    statusPaused ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    logs.some((l) =>
      l.includes('Build completed') ||
      l.includes('Compiled successfully') ||
      l.includes('Build finished') ||
      l.includes('Project ready') ||
      l.includes('Application started'),
    );
  const isRunning =
    isLive ||
    statusPaused ||
    currentStatus === 'RUNNING' ||
    currentStatus === 'CREATING_TUNNEL' ||
    logs.some((l) =>
      l.includes('Application healthy') ||
      l.includes('Application started') ||
      l.includes('Container running') ||
      l.includes('Ready in'),
    );
  const isPublic = isLive;

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <span className="text-zinc-300">Deploy</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Deploy Project
        </h1>
        <p className="mt-1 text-xs text-zinc-400">
          Upload your project ZIP archive. DeployX builds it locally in Docker and creates a secure temporary public URL.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed transition p-6 ${
            dragging
              ? 'border-white bg-white/[0.05]'
              : 'border-white/[0.12] bg-[#08090a]/50 hover:border-white/25 hover:bg-[#08090a]'
          }`}
        >
          <input
            id="project-upload"
            type="file"
            accept=".zip"
            className="hidden"
            onChange={handleFileChange}
          />

          {file ? (
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111317] text-white">
                <FileArchive size={22} />
              </div>
              <h3 className="font-mono text-sm font-semibold text-white truncate max-w-sm">
                {file.name}
              </h3>
              <p className="mt-1 font-mono text-[11px] text-zinc-500">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <label
                htmlFor="project-upload"
                className="mt-3 cursor-pointer font-mono text-xs text-zinc-400 hover:text-white transition underline"
              >
                Choose a different ZIP
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg border border-white/[0.08] bg-[#111317] text-zinc-400">
                <Upload size={18} />
              </div>
              <h3 className="text-sm font-semibold text-white">
                Drag and drop your project ZIP here
              </h3>
              <p className="mt-1 text-xs text-zinc-500">
                Supports Next.js, React, Vite, Node.js, static HTML/CSS, or Dockerfile projects
              </p>
              <label
                htmlFor="project-upload"
                className="mt-4 cursor-pointer rounded-lg border border-white/[0.08] bg-[#111317] px-4 py-1.5 text-xs font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.06]"
              >
                Browse Files
              </label>
            </div>
          )}
        </div>

        {/* Deploy Action Button */}
        <button
          onClick={() => void deploy()}
          disabled={!file || deploying}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40 shadow-sm"
        >
          {deploying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Uploading & Building...</span>
            </>
          ) : (
            <>
              <Rocket size={14} />
              <span>Deploy Project</span>
            </>
          )}
        </button>

        {/* Error message */}
        {error && (
          <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Agent Required Prompt */}
        {agentRequired && (
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-[#08090a] p-4 text-center">
            <p className="text-xs font-semibold text-amber-200">
              Your DeployX Agent is offline.
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Launch DeployX Agent on your PC, then pair it using the 6-digit code.
            </p>
            {!pairing ? (
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  onClick={async () => {
                    const res = await fetch(`${API_URL}/agents/pair`, { method: 'POST', credentials: 'include' });
                    const data = await res.json().catch(() => null);
                    if (res.ok && data?.code) setPairing({ code: data.code, expiresAt: data.expiresAt });
                  }}
                  className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                >
                  Generate Pairing Code
                </button>
                <Link
                  href="/download"
                  className="rounded-lg border border-white/[0.08] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition"
                >
                  Download Agent
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="font-mono text-xl font-bold tracking-[0.25em] text-white">{pairing.code}</p>
                <p className="mt-1 text-[11px] text-zinc-500">Enter this code into your DeployX Agent window.</p>
                <button onClick={() => setAgentRequired(false)} className="mt-2 text-[11px] text-zinc-400 underline">
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Deployment Details Section */}
      {deployment && (
        <div className="mt-6 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-5 shadow-lg">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-white/[0.08] pb-4">
            <div>
              <p className="font-mono text-[11px] text-zinc-500 uppercase tracking-wider">
                ACTIVE DEPLOYMENT
              </p>
              <h2 className="mt-1 text-lg font-bold text-white">
                {deployment.project?.name || file?.name.replace(/\.zip$/i, '') || 'Project'}
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge status={deployment.status} />
              <Link
                href={`/dashboard/deployments/${deployment.id}`}
                className="flex items-center gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] px-2.5 py-1 text-xs text-zinc-400 hover:text-white transition"
              >
                <span>View Details</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Pipeline milestones */}
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Uploaded', done: isUploaded },
              { label: 'Built', done: isBuilt },
              { label: 'Running', done: isRunning },
              { label: 'Public', done: isPublic },
            ].map((step) => (
              <div
                key={step.label}
                className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-[#08090a] px-3 py-2"
              >
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
                    step.done
                      ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                      : 'border border-white/[0.06] bg-white/[0.02] text-zinc-600'
                  }`}
                >
                  {step.done ? <Check size={11} strokeWidth={2.5} /> : <div className="h-1 w-1 rounded-full bg-zinc-600" />}
                </div>
                <span className={`text-xs ${step.done ? 'text-zinc-200' : 'text-zinc-500'}`}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>

          {/* Terminal viewport */}
          <div className="mt-4">
            <DeploymentTerminal
              logs={logs}
              status={deployment.status}
              projectName={deployment.project?.name}
              deploymentId={deployment.id}
            />
          </div>

          {/* Public URL Live Banner */}
          {isLive && publicUrl && (
            <div className="mt-4 rounded-lg border border-emerald-500/25 bg-[#08090a] p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                    <Globe size={13} />
                    <span>YOUR PUBLIC URL</span>
                  </div>
                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 block font-mono text-sm font-semibold text-white hover:underline break-all"
                  >
                    {publicUrl}
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void copyUrl()}
                    className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy URL</span>
                      </>
                    )}
                  </button>

                  <a
                    href={publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                  >
                    <span>Open Project</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Controls: Pause / Resume / Delete */}
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
            {isLive && (
              <button
                onClick={() => void pauseDeployment()}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white transition disabled:opacity-40"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Pause size={13} />}
                <span>Pause</span>
              </button>
            )}

            {statusPaused && (
              <button
                onClick={() => void resumeDeployment()}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-40"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin text-emerald-400" /> : <Play size={13} />}
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={() => setDeleteOpen(true)}
              disabled={actionLoading || deploying}
              className="flex items-center gap-1.5 rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-1.5 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-40 ml-auto"
            >
              <Trash2 size={13} />
              <span>Delete Deployment</span>
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={deleteOpen}
        title="Delete Deployment"
        description="Permanently delete this deployment? The local Docker container and public tunnel will be stopped immediately."
        confirmText="Delete Deployment"
        cancelText="Cancel"
        isDestructive={true}
        isLoading={deleting}
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </main>
  );
}