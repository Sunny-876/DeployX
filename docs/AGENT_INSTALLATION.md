# DeployX Agent Installation Guide

## System requirements

- Windows 10 or Windows 11
- Docker Desktop installed and running
- Outbound HTTPS access to the DeployX API
- Optional: Cloudflare `cloudflared` bundled or installed in PATH for tunnel creation

## Installation

1. Download the `DeployX-Agent-Setup.exe` installer from the DeployX dashboard or the release package.
2. Run the installer as a normal user.
3. Accept the default install directory or choose another standard Windows location.
4. Choose whether to create a Desktop shortcut and enable startup with Windows.
5. Finish the installation.

The application installs under the standard Windows Program Files location, while user configuration is kept in the per-user AppData directory.

## First launch

When the Agent starts, it opens a local UI at http://localhost:4100.

The first-run experience checks:

- Windows environment
- Docker availability
- Agent configuration
- DeployX API connectivity
- pairing state

If Docker is not available, the UI shows a clear user-facing message and directs the user to install Docker Desktop.

## Pairing

1. Open the DeployX dashboard.
2. Click "Connect Your PC".
3. Copy the six-digit pairing code.
4. Open the local Agent UI.
5. Enter the code and connect.

The Agent stores its identity in the user profile directory so upgrades do not wipe the pairing state.

## Startup behavior

The Agent can optionally start automatically with Windows during installation or at first run.

This setting can be disabled later from the Windows startup configuration or by removing the startup shortcut.

## Logs

Logs are stored in the per-user AppData directory, for example:

- `%LOCALAPPDATA%\DeployX\logs`

The Agent logs startup, Docker checks, API calls, pairing, deployments, tunnel lifecycle, and operational errors without persisting passwords or tokens.

## Uninstall

Use the standard Windows Programs and Features uninstall flow.

The uninstaller removes the program files and shortcuts. It asks whether to keep or remove the DeployX Agent configuration data so a user can preserve pairing or deployment metadata if needed.

## Known limitations

- This first packaged release is designed around the Windows desktop experience and the existing NestJS Agent daemon.
- A tray icon is intentionally not forced into the first build; the local Agent process remains stable and can be restarted manually.
- A production cloudflared bundle is not yet auto-downloaded in this repository-only build. The existing runtime still expects a valid `cloudflared` install or an equivalent bundled distribution in the final Windows package.

## Troubleshooting

- Docker not found: install Docker Desktop and make sure it is running.
- API unreachable: verify the `DEPLOYX_API_URL` value in `config.json` or the environment.
- Pairing fails: confirm the six-digit code is current and the installed Agent is pointing at the correct API.
- Startup issues: check the log files in `%LOCALAPPDATA%\DeployX\logs`.

## Firewall and network

The Agent uses outbound HTTPS to the DeployX API and should not need inbound port forwarding. Local access to http://localhost:4100 is intended for the machine owner only.
