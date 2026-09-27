[Setup]
AppName=KlikPOS Enterprise
AppVersion=2.4.1
AppPublisher=KlikPOS Cloud
AppPublisherURL=https://klikposcloud.com
DefaultDirName={autopf}\KlikPOS Enterprise
DefaultGroupName=KlikPOS Enterprise
OutputDir=c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\dist-installer
OutputBaseFilename=KlikPOS-Enterprise-Setup-v2.4.1
Compression=lzma2/max
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
Name: "{group}\KlikPOS Enterprise"; Filename: "{app}\KlikPOS.exe"; IconFilename: "{app}\app.ico"
Name: "{group}\Detener KlikPOS Enterprise"; Filename: "{app}\detener-klikpos.bat"; IconFilename: "{app}\app.ico"
Name: "{group}\Desinstalar KlikPOS Enterprise"; Filename: "{uninstallexe}"
Name: "{autodesktop}\KlikPOS Enterprise"; Filename: "{app}\KlikPOS.exe"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\KlikPOS.exe"; Description: "Ejecutar KlikPOS Enterprise ahora"; Flags: nowait postinstall skipifsilent
