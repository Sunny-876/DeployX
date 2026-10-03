param(
    [Parameter(Mandatory = $true)]
    [string]$Version
)

$ErrorActionPreference = 'Stop'

if ($Version -notmatch '^\d+\.\d+\.\d+$') {
    throw "Version must be in X.Y.Z format (for example: 0.1.0)."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$agentDir = Join-Path $repoRoot 'apps/agent'
$installerProject = Join-Path $agentDir 'installer/DeployX-Agent.iss'
$releaseDir = Join-Path $repoRoot 'releases'
$buildDir = Join-Path $agentDir 'dist/agent/windows'
$installerName = "DeployX-Agent-Setup-$Version.exe"
$installerPath = Join-Path $buildDir $installerName
$checksumPath = Join-Path $releaseDir 'checksums.txt'

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    throw 'Node.js is required to build the Agent release.'
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    throw 'pnpm is required to build the Agent release.'
}

$innoCompiler = Get-Command iscc -ErrorAction SilentlyContinue
if (-not $innoCompiler) {
    $innoCandidate = Get-ChildItem -Path "$env:LOCALAPPDATA\Programs\Inno Setup 6" -Filter 'ISCC.exe' -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($innoCandidate) {
        $env:PATH = "$($innoCandidate.DirectoryName);$env:PATH"
        $innoCompiler = $innoCandidate.FullName
    }
}
if (-not $innoCompiler) {
    throw 'Inno Setup (iscc) is required to build the Windows installer.'
}

if (-not (Test-Path $agentDir)) {
    throw "Agent directory not found: $agentDir"
}

if (-not (Test-Path $installerProject)) {
    throw "Inno Setup project not found: $installerProject"
}

New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
New-Item -ItemType Directory -Force -Path $buildDir | Out-Null

Push-Location $repoRoot
try {
    Write-Host "[1/5] Installing workspace dependencies"
    & pnpm approve-builds --all
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm approve-builds failed before installation could proceed."
    }

    try {
        & pnpm install --frozen-lockfile
    }
    catch {
        throw "pnpm install failed after build approval."
    }
    if ($LASTEXITCODE -ne 0) {
        throw "pnpm install failed after build approval."
    }

    Write-Host "[2/5] Building Agent"
    & pnpm --filter agent run build

    if (-not (Test-Path (Join-Path $agentDir 'dist'))) {
        throw 'Agent build output not found in apps/agent/dist.'
    }

    if (Test-Path (Join-Path $agentDir 'scripts/build-windows-package.mjs')) {
        Write-Host "[3/5] Preparing Windows bundle"
        & node (Join-Path $agentDir 'scripts/build-windows-package.mjs')
    }

    Write-Host "[4/5] Compiling Windows installer"
    & $innoCompiler "/DMyAppVersion=$Version" $installerProject

    $candidate = Get-ChildItem -Path $buildDir -File -Filter "DeployX-Agent-Setup*.exe" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTimeUtc -Descending |
        Select-Object -First 1

    if (-not $candidate) {
        throw "Installer artifact was not created in $buildDir."
    }

    $artifactPath = Join-Path $releaseDir $candidate.Name
    Copy-Item -Path $candidate.FullName -Destination $artifactPath -Force

    $checksum = (Get-FileHash -Path $artifactPath -Algorithm SHA256).Hash
    $checksumLine = "SHA256: $checksum  $($candidate.Name)"
    Set-Content -Path $checksumPath -Value $checksumLine -NoNewline

    Write-Host "[5/5] Release output ready"
    Write-Host "Artifact: $artifactPath"
    Write-Host "Checksum: $checksumPath"
    Write-Host "SHA256: $checksum"
    Write-Host "Installer version: $Version"
}
finally {
    Pop-Location
}
