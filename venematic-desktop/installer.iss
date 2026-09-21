[Setup]
AppName=Venematic POS
AppVersion=2.0.0
AppPublisher=Venematic
AppPublisherURL=https://venematic.com
DefaultDirName={autopf}\Venematic POS
DefaultGroupName=Venematic POS
OutputDir=c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\dist-installer
OutputBaseFilename=Venematic-POS-Setup-v2.0.0
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64
PrivilegesRequired=lowest
PrivilegesRequiredOverridesAllowed=dialog
SetupIconFile=c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\launcher\app.ico
UninstallDisplayIcon={app}\app.ico

[Languages]
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"

[Files]
; Archivos autónomos de la aplicación con runtime portable Node.js integrado
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\build-staging\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\Venematic POS"; Filename: "{app}\VenematicPOS.exe"; IconFilename: "{app}\app.ico"
Name: "{group}\Detener Venematic POS"; Filename: "{app}\detener-venematic.bat"; IconFilename: "{app}\app.ico"
Name: "{group}\Desinstalar Venematic POS"; Filename: "{uninstallexe}"
Name: "{autodesktop}\Venematic POS"; Filename: "{app}\VenematicPOS.exe"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\VenematicPOS.exe"; Description: "Ejecutar Venematic POS ahora"; Flags: nowait postinstall skipifsilent
