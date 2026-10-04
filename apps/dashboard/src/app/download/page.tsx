import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Cpu,
  Download,
  ExternalLink,
  ShieldCheck,
  Terminal,
  HelpCircle,
  ArrowRight,
} from 'lucide-react';

const DOWNLOAD_URL =
  'https://github.com/Sunny-876/DeployX/releases/download/v0.1.2/DeployX-Agent-Setup-0.1.2.exe';
const RELEASE_NOTES_URL =
  'https://github.com/Sunny-876/DeployX/releases/tag/v0.1.2';
const DOCKER_DESKTOP_URL =
  'https://docs.docker.com/desktop/setup/install/windows-install/';

const requirements = [
  {
    name: 'Windows 10 / 11',
    description: '64-bit architecture (x64) with administrator privileges for installation.',
  },
  {
    name: 'Docker Desktop',
    description: 'Must be installed and running before starting containerized deployments.',
    link: {
      url: DOCKER_DESKTOP_URL,
      label: 'Download Docker Desktop →',
    },
  },
  {
    name: 'Internet Connection',
    description: 'Required to synchronize status with DeployX and establish Cloudflare tunnels.',
  },
];

const installSteps = [
  {
    step: '01',
    title: 'Download DeployX Agent',
    description: 'Get the official DeployX-Agent-Setup-0.1.2.exe installer directly from GitHub Releases.',
  },
  {
    step: '02',
    title: 'Install',
    description: 'Run the setup wizard to install the agent into your local program files.',
  },
  {
    step: '03',
    title: 'Open Agent',
    description: 'Launch the DeployX Agent desktop application from your Start menu or desktop icon.',
  },
  {
    step: '04',
    title: 'Sign in / pair',
    description: 'Generate a 6-digit code in your DeployX Dashboard and enter it into the Agent prompt.',
  },
  {
    step: '05',
    title: 'Deploy your first project',
    description: 'Upload a ZIP archive and watch your project build locally with a live public URL.',
  },
];

const troubleshooting = [
  {
    q: 'Agent shows "Docker Offline" or "Docker Not Ready"',
    a: 'Ensure Docker Desktop is open and the Docker engine status shows "Running". If you just installed Docker Desktop, restart your computer once.',
  },
  {
    q: 'Dashboard shows "Agent Offline" after installation',
    a: 'Verify that the DeployX Agent window is open on your PC and that your machine has an active internet connection. The Agent connects securely to the DeployX control plane.',
  },
  {
    q: 'Pairing code expired',
    a: 'Pairing codes expire after 10 minutes for security. Click "Connect Agent" in your dashboard to generate a fresh 6-digit code.',
  },
  {
    q: 'Port conflict on 4100',
    a: 'The local Agent listens on http://127.0.0.1:4100. Ensure no other local service is binding to this port on your PC.',
  },
];

export default function DownloadPage() {
  return (
    <main className="min-h-screen bg-[#08090a] px-4 py-12 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Back navigation */}
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 transition hover:text-white"
        >
          <ArrowLeft size={13} />
          <span>Back to home</span>
        </Link>

        {/* Hero */}
        <div className="mt-8 border-b border-white/[0.08] pb-8">
          <div className="flex items-center gap-2 font-mono text-xs font-semibold tracking-wider uppercase text-zinc-400">
            <Cpu size={14} className="text-zinc-400" />
            <span>DEPLOYX AGENT FOR WINDOWS</span>
          </div>

          <h1 className="mt-3 text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Run your projects locally.
            <br />
            <span className="text-zinc-400 font-normal">
              Deploy them publicly without giving up control of your runtime.
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-xs sm:text-sm text-zinc-400 leading-relaxed">
            The DeployX Agent connects your local PC and Docker Desktop to the DeployX dashboard. Code builds and runs on your hardware, while public traffic is securely routed via temporary Cloudflare tunnels.
          </p>
        </div>

        {/* Release Card */}
        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6 shadow-xl">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-zinc-300">
                  OFFICIAL RELEASE
                </span>
                <span className="font-mono text-xs text-emerald-400 font-semibold">
                  Version 0.1.2
                </span>
              </div>

              <h2 className="mt-2 font-mono text-base font-semibold text-white">
                DeployX-Agent-Setup-0.1.2.exe
              </h2>
              <p className="mt-1 text-xs text-zinc-400 font-mono">
                Windows x64 Installer • Signed release • SHA-256 verified
              </p>

              <div className="mt-3">
                <a
                  href={RELEASE_NOTES_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition underline"
                >
                  <span>View release notes</span>
                  <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="shrink-0">
              <a
                href={DOWNLOAD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg bg-white px-5 py-2.5 text-xs font-semibold text-black transition hover:bg-zinc-200 shadow-sm cursor-pointer"
              >
                <Download size={14} strokeWidth={2.5} />
                <span>Download for Windows</span>
              </a>
            </div>
          </div>
        </div>

        {/* Why do I need the Agent? */}
        <div className="mt-8 rounded-lg border border-white/[0.08] bg-[#0d0f12] p-6">
          <div className="flex items-start gap-3">
            <ShieldCheck size={18} className="mt-0.5 text-emerald-400 shrink-0" />
            <div>
              <h2 className="text-sm font-semibold text-white">Why do I need the Agent?</h2>
              <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                The Agent runs on your PC and connects your local Docker runtime to DeployX. Your project code stays entirely on your computer—DeployX never takes custody of your code or runs it in proprietary cloud servers. The Agent coordinates Docker container lifecycles, streams live terminal logs back to your dashboard, and initiates secure temporary Cloudflare tunnels.
              </p>
            </div>
          </div>
        </div>

        {/* System Requirements */}
        <div className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
            SYSTEM REQUIREMENTS
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {requirements.map((req) => (
              <div
                key={req.name}
                className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-white">
                    <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    <span>{req.name}</span>
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                    {req.description}
                  </p>
                </div>

                {req.link && (
                  <div className="mt-3 pt-3 border-t border-white/[0.06]">
                    <a
                      href={req.link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-mono text-[11px] text-zinc-200 hover:text-white transition underline"
                    >
                      <span>{req.link.label}</span>
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Installation Steps */}
        <div className="mt-10">
          <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
            INSTALLATION STEPS
          </h2>

          <div className="mt-4 grid gap-3 sm:grid-cols-5">
            {installSteps.map((s) => (
              <div
                key={s.step}
                className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4"
              >
                <span className="font-mono text-xs font-bold text-zinc-500">
                  {s.step}
                </span>
                <h3 className="mt-2 text-xs font-semibold text-white">
                  {s.title}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-zinc-400">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Troubleshooting */}
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <HelpCircle size={15} className="text-zinc-400" />
            <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-zinc-400">
              TROUBLESHOOTING
            </h2>
          </div>

          <div className="space-y-2.5">
            {troubleshooting.map((item) => (
              <div
                key={item.q}
                className="rounded-lg border border-white/[0.08] bg-[#0d0f12] p-4"
              >
                <p className="text-xs font-semibold text-zinc-200">
                  {item.q}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Navigation */}
        <div className="mt-10 pt-6 border-t border-white/[0.08] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-4 py-2 text-xs font-semibold text-black hover:bg-zinc-200 transition"
          >
            <span>Open Dashboard</span>
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/feedback"
            className="inline-flex items-center justify-center rounded-lg border border-white/[0.08] bg-[#0d0f12] px-4 py-2 text-xs font-medium text-zinc-300 hover:border-white/20 hover:text-white transition"
          >
            Report an issue or give feedback
          </Link>
        </div>
      </div>
    </main>
  );
}
