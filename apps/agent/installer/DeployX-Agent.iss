; DeployX Agent Inno Setup script
; This script packages the built Agent and its runtime files for a clean Windows install.

#define MyAppName "DeployX Agent"
#define MyAppVersion "0.1.0"
#define MyAppPublisher "DeployX"
#define MyAppURL "https://deployx.example.com"
#define MyAppExeName "node.exe"

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
Compression=lzma
SolidCompression=yes
OutputDir=..\dist\agent\windows
OutputBaseFilename=DeployX-Agent-Setup-{#MyAppVersion}
UninstallDisplayIcon={app}\node.exe
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64
CreateAppDir=yes
AllowNoIcons=no
CloseApplications=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "Create a &desktop shortcut"; GroupDescription: "Additional shortcuts:"; Flags: unchecked
Name: "startup"; Description: "Start DeployX Agent with Windows"; GroupDescription: "Startup:"; Flags: unchecked

[Files]
Source: "..\dist\**"; DestDir: "{app}"; Flags: recursesubdirs createallsubdirs ignoreversion
Source: "..\config.json"; DestDir: "{userappdata}\DeployX"; Flags: onlyifdoesntexist

[Dirs]
Name: "{localappdata}\DeployX\logs"
Name: "{userappdata}\DeployX\config"

[Icons]
Name: "{group}\DeployX Agent"; Filename: "{app}\node.exe"; Parameters: "dist\main.js"; WorkingDir: "{app}"
Name: "{group}\Open Agent UI"; Filename: "https://localhost:4100"
Name: "{commondesktop}\DeployX Agent"; Filename: "{app}\node.exe"; Parameters: "dist\main.js"; WorkingDir: "{app}"; Tasks: desktopicon

[Run]
Filename: "{app}\node.exe"; Parameters: "dist\main.js"; WorkingDir: "{app}"; Description: "Launch DeployX Agent"; Flags: nowait postinstall unchecked

[Registry]
Root: HKCU; Subkey: "Software\DeployX\Agent"; ValueType: string; ValueName: "ConfigDir"; ValueData: "{userappdata}\DeployX"; Flags: uninsdeletekey

[UninstallDelete]
Type: filesandordirs; Name: "{localappdata}\DeployX\logs"

[Code]
function ShouldSkipPage(PageID: Integer): Boolean;
begin
  Result := False;
end;
