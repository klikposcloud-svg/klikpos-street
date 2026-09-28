#ifndef AppName
  #define AppName "KlikPOS Enterprise"
#endif
#ifndef AppEdition
  #define AppEdition "KLIKPOS_ELITE"
#endif
#ifndef AppVersion
  #define AppVersion "3.0.0"
#endif
#ifndef OutputBaseFilename
  #define OutputBaseFilename "KlikPOS-Enterprise-Setup-v3.0.0"
#endif

[Setup]
AppName={#AppName}
AppVersion=3.0.0
AppPublisher=KlikPOS Cloud
AppPublisherURL=https://klikposcloud.com
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
OutputDir=c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\dist-installer
OutputBaseFilename=KlikPOS-Enterprise-Setup-v3.0.0
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
Source: "c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\build-staging\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\KlikPOS.exe"; IconFilename: "{app}\app.ico"
Name: "{group}\Detener {#AppName}"; Filename: "{app}\detener-klikpos.bat"; IconFilename: "{app}\app.ico"
Name: "{group}\Desinstalar {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\KlikPOS.exe"; IconFilename: "{app}\app.ico"; Tasks: desktopicon

[Run]
Filename: "{app}\KlikPOS.exe"; Description: "Ejecutar {#AppName} ahora"; Flags: nowait postinstall skipifsilent

