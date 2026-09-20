[Setup]
AppName=Venematic POS Desktop
AppVersion=2.0.0
DefaultDirName={autopf}\Venematic POS
DefaultGroupName=Venematic POS
OutputDir=c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\dist-installer
OutputBaseFilename=Venematic-POS-Setup-v2.0.0
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\venematic-launcher.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\package.json"; DestDir: "{app}"; Flags: ignoreversion
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\next.config.js"; DestDir: "{app}"; Flags: ignoreversion
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\.next\*"; DestDir: "{app}\.next"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\public\*"; DestDir: "{app}\public"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\src-tauri\icons\icon.ico"; DestDir: "{app}"; DestName: "app.ico"; Flags: ignoreversion

[Icons]
Name: "{group}\Venematic POS"; Filename: "{app}\venematic-launcher.bat"; IconFilename: "{app}\app.ico"
Name: "{group}\Desinstalar Venematic POS"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Venematic POS"; Filename: "{app}\venematic-launcher.bat"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\venematic-launcher.bat"; Description: "Ejecutar Venematic POS ahora"; Flags: nowait postinstall skipifsilent
