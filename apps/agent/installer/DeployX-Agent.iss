; DeployX Agent Inno Setup script
; Packages the standalone Agent, bundled Node.js runtime, and dependencies for Windows.

#define MyAppName "DeployX Agent"
#define MyAppVersion "0.1.2"
#define MyAppPublisher "DeployX"
#define MyAppURL "https://deploy-x-virid.vercel.app"
#define MyAppExeName "DeployX-Agent.bat"

[Setup]
AppId={{A83D2B93-D38A-54D3-AF55-8C0D348E6F17}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\DeployX Agent
DefaultGroupName={#MyAppName}
Compression=lzma2/max
SolidCompression=yes
OutputDir=..\..\..\releases
OutputBaseFilename=DeployX-Agent-Setup-{#MyAppVersion}
UninstallDisplayIcon={app}\node.exe
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64compatible
CreateAppDir=yes
AllowNoIcons=no
CloseApplications=force

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked
Name: "startup"; Description: "Start DeployX Agent with Windows"; GroupDescription: "Startup:"; Flags: unchecked

[Files]
; Standalone Node.js runtime executable
Source: "..\package-staging\node.exe"; DestDir: "{app}"; Flags: ignoreversion
; Application entry and configuration
Source: "..\package-staging\config.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "..\package-staging\DeployX-Agent.bat"; DestDir: "{app}"; Flags: ignoreversion
; Compiled application bundle
Source: "..\package-staging\dist\*"; DestDir: "{app}\dist"; Flags: recursesubdirs createallsubdirs ignoreversion
; Isolated production runtime dependencies
Source: "..\package-staging\node_modules\*"; DestDir: "{app}\node_modules"; Flags: recursesubdirs createallsubdirs ignoreversion
; Optional Cloudflare tunnel binary if present
Source: "..\package-staging\cloudflared.exe"; DestDir: "{app}"; Flags: ignoreversion skipifsourcedoesntexist
; Default user configuration (preserves existing configuration on update)
Source: "..\package-staging\config.json"; DestDir: "{userappdata}\DeployX"; Flags: onlyifdoesntexist

[Dirs]
Name: "{localappdata}\DeployX\logs"
Name: "{userappdata}\DeployX"

[Icons]
; Start Menu shortcuts (per-user in lowest privileges mode)
Name: "{group}\DeployX Agent"; Filename: "{app}\DeployX-Agent.bat"; WorkingDir: "{app}"; IconFilename: "{app}\node.exe"
Name: "{group}\Open Agent UI"; Filename: "http://localhost:4100"
Name: "{group}\Uninstall DeployX Agent"; Filename: "{uninstallexe}"
; Desktop shortcut (uses {autodesktop} which resolves to {userdesktop} in lowest privileges mode, avoiding 0x80070005)
Name: "{autodesktop}\DeployX Agent"; Filename: "{app}\DeployX-Agent.bat"; WorkingDir: "{app}"; Tasks: desktopicon; IconFilename: "{app}\node.exe"

[Run]
Filename: "{app}\DeployX-Agent.bat"; Description: "Launch DeployX Agent"; Flags: nowait postinstall shellexec


[Registry]
Root: HKCU; Subkey: "Software\DeployX\Agent"; ValueType: string; ValueName: "ConfigDir"; ValueData: "{userappdata}\DeployX"; Flags: uninsdeletekey

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\DeployX\logs"

[Code]
function PrepareToInstall(var NeedsRestart: Boolean): String;
var
  ResultCode: Integer;
begin
  // Terminate any running DeployX Agent processes so node.exe / cloudflared.exe are not locked
  Exec('powershell.exe', '-NoProfile -ExecutionPolicy Bypass -Command "Get-Process | Where-Object { $_.Path -like ''*DeployX Agent*'' } | Stop-Process -Force -ErrorAction SilentlyContinue"', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Exec('cmd.exe', '/c taskkill /f /fi "WINDOWTITLE eq *DeployX Agent*" >nul 2>&1', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
  Sleep(500);
  Result := '';
end;
