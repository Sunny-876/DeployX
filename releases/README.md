# Releases

This directory is used for generated release artifacts.

Do not commit large binaries to the repository unless the project explicitly chooses to do so.

The expected release process creates:

- DeployX-Agent-Setup-X.Y.Z.exe
- checksums.txt

The checksum file is generated with SHA-256:

```text
SHA256:
<hash> DeployX-Agent-Setup-0.1.0.exe
```

Use the release script for local generation:

```powershell
pwsh -File .\scripts\release-agent.ps1 -Version 0.1.0
```
