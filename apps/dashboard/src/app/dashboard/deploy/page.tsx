'use client';

import {
  ChangeEvent,
  useEffect,
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
  ChevronRight,
  Cpu,
  Shield,
  FolderOpen,
  Link2,
} from 'lucide-react';
import { API_URL, formatErrorMessage } from '../../../lib/utils';
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

      if (data.deployment?.id) {
        void loadDeployment(data.deployment.id);
      }
    } catch (err: unknown) {
      setError(formatErrorMessage(err));
    } finally {
      setDeploying(false);
    }
  };

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

  const copyUrl = async () => {
    const url = deployment?.url;
    if (!url) return;

    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Breadcrumb & Header (Screenshot 3) */}
      <div>
        <div className="flex items-center gap-2 text-xs text-zinc-500 mb-2">
          <Link href="/dashboard" className="hover:text-white transition">
            Dashboard
          </Link>
          <ChevronRight size={12} />
          <span className="text-zinc-300">Deploy</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Deploy Project
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-400">
          Upload your project ZIP archive. DeployX builds it locally in Docker and creates a secure temporary public URL.
        </p>
      </div>

      {/* Main Upload Card Container (Screenshot 3) */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-6 sm:p-8 space-y-6">
        {/* Dashed Dropzone Area */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`flex min-h-[260px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition p-8 text-center ${
            dragging
              ? 'border-white bg-white/[0.04]'
              : 'border-zinc-700/60 bg-transparent hover:border-zinc-500'
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
              <div className="mb-3.5 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-[#14161f] text-white">
                <FileArchive size={26} />
              </div>
              <h3 className="font-semibold text-base text-white truncate max-w-md">
                {file.name}
              </h3>
              <p className="mt-1 font-mono text-xs text-zinc-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to deploy
              </p>
              <label
                htmlFor="project-upload"
                className="mt-4 cursor-pointer rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200"
              >
                Change ZIP File
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.06] text-white">
                <Upload size={20} />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Drop your project ZIP here
              </h3>
              <p className="mt-1.5 text-xs text-zinc-400 max-w-md">
                Supports Next.js, React, Vite, Node.js, static HTML/CSS, or Dockerfile projects
              </p>
              <label
                htmlFor="project-upload"
                className="mt-5 inline-flex items-center gap-2 cursor-pointer rounded-xl bg-white px-5 py-2 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm"
              >
                <FolderOpen size={14} />
                <span>Browse Files</span>
              </label>
            </div>
          )}
        </div>

        {/* 3 Feature Highlights (Screenshot 3) */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 pt-2">
          {/* Feature 1 */}
          <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-[#12141a] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#181a24] text-zinc-300">
              <Cpu size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Runs on your PC</p>
              <p className="text-[11px] text-zinc-400 truncate">Built and hosted locally using Docker</p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-[#12141a] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#181a24] text-zinc-300">
              <Link2 size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">Temporary Public URL</p>
              <p className="text-[11px] text-zinc-400 truncate">Get a secure Cloudflare Tunnel link</p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-[#12141a] p-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#181a24] text-zinc-300">
              <Shield size={16} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white">No Domain Needed</p>
              <p className="text-[11px] text-zinc-400 truncate">Share your project instantly</p>
            </div>
          </div>
        </div>

        {/* Deploy Action Button (Screenshot 3) */}
        <button
          onClick={() => void deploy()}
          disabled={!file || deploying}
          className={`flex w-full items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition shadow-sm ${
            !file || deploying
              ? 'bg-white/[0.08] text-zinc-500 cursor-not-allowed'
              : 'bg-white text-black hover:bg-zinc-200 cursor-pointer'
          }`}
        >
          {deploying ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Uploading & Building in Docker...</span>
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
          <div className="flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-300">
            <AlertCircle size={15} className="mt-0.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Agent Required Prompt */}
        {agentRequired && (
          <div className="rounded-2xl border border-amber-500/20 bg-[#12141a] p-5 text-center">
            <p className="text-xs font-semibold text-amber-300">
              Your DeployX Agent is offline.
            </p>
            <p className="mt-1 text-xs text-zinc-400">
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
                  className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-black hover:bg-zinc-200 transition"
                >
                  Generate Pairing Code
                </button>
                <Link
                  href="/download"
                  className="rounded-xl border border-white/[0.08] px-3.5 py-1.5 text-xs text-zinc-300 hover:text-white transition"
                >
                  Download Agent
                </Link>
              </div>
            ) : (
              <div className="mt-3">
                <p className="font-mono text-2xl font-bold tracking-[0.25em] text-white">{pairing.code}</p>
                <p className="mt-1 text-xs text-zinc-500">Enter this code into your DeployX Agent window.</p>
                <button onClick={() => setAgentRequired(false)} className="mt-2 text-xs text-zinc-400 underline">
                  Dismiss
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Deployment Terminal & Live URL Area */}
      {deployment && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#0d0f14] p-6 space-y-5 shadow-2xl">
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
                className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-xs text-zinc-300 hover:text-white transition"
              >
                <span>View Details</span>
                <ChevronRight size={13} />
              </Link>
            </div>
          </div>

          {/* Pipeline milestones */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {[
              { label: 'Uploaded', done: isUploaded },
              { label: 'Built', done: isBuilt },
              { label: 'Running', done: isRunning },
              { label: 'Public', done: isPublic },
            ].map((step) => (
              <div
                key={step.label}
                className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-[#08090a] px-3.5 py-2.5"
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
          <DeploymentTerminal
            logs={logs}
            status={deployment.status}
            projectName={deployment.project?.name}
            deploymentId={deployment.id}
          />

          {/* Public URL Live Banner */}
          {isLive && publicUrl && (
            <div className="rounded-2xl border border-emerald-500/25 bg-[#0e1713] p-5">
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
                    className="mt-1 block font-mono text-sm sm:text-base font-semibold text-white hover:underline break-all"
                  >
                    {publicUrl}
                  </a>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => void copyUrl()}
                    className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.05] px-3.5 py-2 text-xs text-zinc-300 hover:text-white transition"
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
                    className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition shadow-sm"
                  >
                    <span>Open Project</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Controls: Pause / Resume / Delete */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.08] pt-4">
            {isLive && (
              <button
                onClick={() => void pauseDeployment()}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-white transition disabled:opacity-40"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <Pause size={13} />}
                <span>Pause</span>
              </button>
            )}

            {statusPaused && (
              <button
                onClick={() => void resumeDeployment()}
                disabled={actionLoading}
                className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3.5 py-2 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition disabled:opacity-40"
              >
                {actionLoading ? <Loader2 size={13} className="animate-spin text-emerald-400" /> : <Play size={13} />}
                <span>Resume</span>
              </button>
            )}

            <button
              onClick={() => setDeleteOpen(true)}
              disabled={actionLoading || deploying}
              className="flex items-center gap-1.5 rounded-xl border border-rose-500/20 bg-rose-500/5 px-3.5 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition disabled:opacity-40 ml-auto"
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
    </div>
  );
}