const fs = require('fs');
const path = require('path');

const settingsPath = path.join(__dirname, '..', 'src', 'app', 'dashboard', 'settings', 'page.tsx');
let content = fs.readFileSync(settingsPath, 'utf8');

// 1. Ensure 'visual_packs' is in SettingsTabId
if (!content.includes("'visual_packs'")) {
  content = content.replace(
    "export type SettingsTabId = 'branding' | 'pos_quick' | 'legal' | 'business' | 'printer' | 'scale' | 'cashiers' | 'cloud_backup' | 'payments' | 'updates' | 'menu_sync';",
    "export type SettingsTabId = 'branding' | 'pos_quick' | 'legal' | 'business' | 'printer' | 'scale' | 'cashiers' | 'cloud_backup' | 'payments' | 'updates' | 'menu_sync' | 'visual_packs';"
  );
}

// 2. Ensure tab button is in SETTINGS_TABS
if (!content.includes("id: 'visual_packs'")) {
  content = content.replace(
    "{ id: 'menu_sync', label: 'Menú Interactivo & Tablets', icon: Utensils },",
    "{ id: 'menu_sync', label: 'Menú Interactivo & Tablets', icon: Utensils },\r\n    { id: 'visual_packs', label: 'Paquetes Visuales & Catálogos', icon: Package },"
  );
  if (!content.includes("id: 'visual_packs'")) {
    content = content.replace(
      "{ id: 'menu_sync', label: 'Menú Interactivo & Tablets', icon: Utensils },",
      "{ id: 'menu_sync', label: 'Menú Interactivo & Tablets', icon: Utensils },\n    { id: 'visual_packs', label: 'Paquetes Visuales & Catálogos', icon: Package },"
    );
  }
}

// 3. Add Tab Content for visual_packs before closing div
const visualPacksTabContent = `
      {/* PESTAÑA: PAQUETES VISUALES & CATÁLOGOS */}
      {activeTab === 'visual_packs' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-300 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-600 text-white flex items-center justify-center font-black shadow-md">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Librería Cloud de Paquetes Visuales & Catálogos
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Administra y descarga catálogos con fotografías HD de productos por rubro para tu negocio.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href="/admin/visual-packs"
                  className="px-4 py-2 rounded-xl bg-sky-700 hover:bg-sky-800 text-white text-xs font-black flex items-center gap-2 shadow-xs transition-all"
                >
                  <Upload className="w-4 h-4" />
                  <span>Publicador Cloud (Admin Panel)</span>
                </Link>
                <Link
                  href="/tablet-pos"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black flex items-center gap-2 shadow-xs transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span>Ver en KlikPOS Street</span>
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>🏪</span> Rubros Disponibles
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Catálogos listos para Bodegón & Licores, Comida Rápida, Supermercado & Víveres, Farmacia y Panadería.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>🔐</span> Paquetes Privados
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Genera códigos de acceso exclusivos para clientes que adquieran paquetes de branding o paquetes personalizados.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 space-y-2">
                <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span>⚡</span> Offline-Ready
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Una vez descargado el paquete, los productos e imágenes quedan almacenados localmente sin requerir internet.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes("activeTab === 'visual_packs'")) {
  const lastIndex = content.lastIndexOf('    </div>\n  );');
  const lastIndexCrlf = content.lastIndexOf('    </div>\r\n  );');
  const targetIndex = lastIndexCrlf !== -1 ? lastIndexCrlf : lastIndex;

  if (targetIndex !== -1) {
    content = content.slice(0, targetIndex) + visualPacksTabContent + '\n' + content.slice(targetIndex);
    console.log('Tab content injected successfully!');
  }
}

fs.writeFileSync(settingsPath, content, 'utf8');
console.log('Settings file patched successfully!');
