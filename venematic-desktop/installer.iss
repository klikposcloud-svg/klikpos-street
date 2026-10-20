#ifndef AppName
  #define AppName "Kliko POS Enterprise"
#endif
#ifndef AppEdition
  #define AppEdition "KLIKO_ELITE"
#endif
#ifndef AppVersion
  #define AppVersion "3.0.1"
#endif
#ifndef OutputBaseFilename
  #define OutputBaseFilename "Kliko-POS-Enterprise-Setup-v3.0.1"
#endif

[Setup]
AppName={#AppName}
AppVersion=3.0.25
AppPublisher=Kliko Cloud
AppPublisherURL=https://klikposcloud.com
AppSupportURL=https://klikposcloud.com
AppUpdatesURL=https://klikposcloud.com
VersionInfoVersion=3.0.1.0
VersionInfoCompany=Kliko Cloud
VersionInfoDescription={#AppName} Setup
VersionInfoProductName={#AppName}
VersionInfoProductVersion=3.0.1.0
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
OutputDir=c:\Users\pcpro\OneDrive\Documents\venematic-master\venematic-master\venematic-desktop\dist-installer
OutputBaseFilename=Kliko-POS-Enterprise-Setup-v3.0.25
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
ArchitecturesInstallIn64BitMode=x64compatible
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

