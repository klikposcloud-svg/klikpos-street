using System;
using System.IO;
using System.Text;
using System.Security.Cryptography;
using System.Windows.Forms;
using System.Drawing;
using System.Text.RegularExpressions;
using System.Collections.Generic;

namespace VenematicKeygen
{
    public class PlanItem
    {
        public string Code { get; set; }
        public string Prefix { get; set; }
        public string Name { get; set; }
        public string Price { get; set; }
        public int? Days { get; set; }
        public bool IsFlash15m { get; set; }

        public override string ToString()
        {
            return Name + " (" + Price + ")";
        }
    }

    public class MainForm : Form
    {
        private const string MASTER_SIGNING_SALT = "VENEMATIC_SEC_SALT_2026_AIVYNTRAX_PRO_POS_V2";

        private TextBox txtHwid;
        private TextBox txtRif;
        private TextBox txtComercio;
        private ComboBox cmbPlan;
        private DateTimePicker dtpExpires;
        private CheckBox chkCustomExpiry;
        private TextBox txtResultKey;
        private Label lblStatus;
        private List<PlanItem> plans;

        public MainForm()
        {
            InitializeComponent();
        }

        private void InitializeComponent()
        {
            this.Text = "Venematic POS - Generador Oficial de Licencias";
            this.Size = new Size(680, 720);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.FormBorderStyle = FormBorderStyle.FixedSingle;
            this.MaximizeBox = false;
            this.BackColor = Color.FromArgb(15, 23, 42); // #0f172a
            this.ForeColor = Color.FromArgb(248, 250, 252); // #f8fafc
            this.Font = new Font("Segoe UI", 9.5f, FontStyle.Regular);

            // Panel Header
            Panel pnlHeader = new Panel
            {
                Dock = DockStyle.Top,
                Height = 85,
                BackColor = Color.FromArgb(10, 15, 30)
            };
            this.Controls.Add(pnlHeader);

            Label lblTitle = new Label
            {
                Text = "⚡ VENEMATIC POS KEYGEN",
                Font = new Font("Segoe UI", 14f, FontStyle.Bold),
                ForeColor = Color.FromArgb(16, 185, 129), // #10b981
                Location = new Point(20, 16),
                AutoSize = true
            };
            pnlHeader.Controls.Add(lblTitle);

            Label lblSubtitle = new Label
            {
                Text = "Generador maestro de claves de activación criptográficas (Edición Portable Windows)",
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184), // #94a3b8
                Location = new Point(22, 48),
                AutoSize = true
            };
            pnlHeader.Controls.Add(lblSubtitle);

            // Container Panel
            Panel pnlContent = new Panel
            {
                Location = new Point(20, 95),
                Size = new Size(625, 570)
            };
            this.Controls.Add(pnlContent);

            int curY = 10;

            // HWID
            Label lblHwid = new Label
            {
                Text = "1. HWID del Terminal / Teléfono (Hardware ID):",
                Location = new Point(0, curY),
                AutoSize = true,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(226, 232, 240)
            };
            pnlContent.Controls.Add(lblHwid);
            curY += 24;

            txtHwid = new TextBox
            {
                Location = new Point(0, curY),
                Size = new Size(625, 28),
                Font = new Font("Consolas", 10.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.FromArgb(56, 189, 248),
                BorderStyle = BorderStyle.FixedSingle
            };
            pnlContent.Controls.Add(txtHwid);
            curY += 38;

            // RIF / Cédula y Comercio
            Label lblRif = new Label
            {
                Text = "2. RIF o Cédula del Comercio:",
                Location = new Point(0, curY),
                AutoSize = true,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(226, 232, 240)
            };
            pnlContent.Controls.Add(lblRif);

            Label lblComercio = new Label
            {
                Text = "Nombre del Negocio (Opcional, para el mensaje WhatsApp):",
                Location = new Point(320, curY),
                AutoSize = true,
                Font = new Font("Segoe UI", 8.5f, FontStyle.Regular),
                ForeColor = Color.FromArgb(148, 163, 184)
            };
            pnlContent.Controls.Add(lblComercio);
            curY += 24;

            txtRif = new TextBox
            {
                Location = new Point(0, curY),
                Size = new Size(300, 28),
                Font = new Font("Consolas", 10.5f, FontStyle.Bold),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.FromArgb(248, 250, 252),
                BorderStyle = BorderStyle.FixedSingle
            };
            pnlContent.Controls.Add(txtRif);

            txtComercio = new TextBox
            {
                Location = new Point(320, curY),
                Size = new Size(305, 28),
                Font = new Font("Segoe UI", 9.5f),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.FromArgb(248, 250, 252),
                BorderStyle = BorderStyle.FixedSingle
            };
            pnlContent.Controls.Add(txtComercio);
            curY += 38;

            // Plan Selector
            Label lblPlan = new Label
            {
                Text = "3. Plan y Modalidad Comercial:",
                Location = new Point(0, curY),
                AutoSize = true,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(226, 232, 240)
            };
            pnlContent.Controls.Add(lblPlan);
            curY += 24;

            cmbPlan = new ComboBox
            {
                Location = new Point(0, curY),
                Size = new Size(625, 28),
                DropDownStyle = ComboBoxStyle.DropDownList,
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.FromArgb(248, 250, 252),
                Font = new Font("Segoe UI", 9.5f, FontStyle.Bold)
            };
            pnlContent.Controls.Add(cmbPlan);
            curY += 38;

            // Expiry Override Option
            chkCustomExpiry = new CheckBox
            {
                Text = "Personalizar fecha de vencimiento manual:",
                Location = new Point(0, curY),
                AutoSize = true,
                ForeColor = Color.FromArgb(148, 163, 184)
            };
            chkCustomExpiry.CheckedChanged += (s, e) => { dtpExpires.Enabled = chkCustomExpiry.Checked; };
            pnlContent.Controls.Add(chkCustomExpiry);

            dtpExpires = new DateTimePicker
            {
                Location = new Point(320, curY - 2),
                Size = new Size(305, 26),
                Format = DateTimePickerFormat.Short,
                Enabled = false,
                Value = DateTime.Now.AddDays(30)
            };
            pnlContent.Controls.Add(dtpExpires);
            curY += 36;

            // Generate Button
            Button btnGenerate = new Button
            {
                Text = "⚡ GENERAR CLAVE DE ACTIVACIÓN",
                Location = new Point(0, curY),
                Size = new Size(625, 46),
                BackColor = Color.FromArgb(16, 185, 129), // #10b981
                ForeColor = Color.FromArgb(15, 23, 42),
                Font = new Font("Segoe UI", 11f, FontStyle.Bold),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand
            };
            btnGenerate.FlatAppearance.BorderSize = 0;
            btnGenerate.Click += BtnGenerate_Click;
            pnlContent.Controls.Add(btnGenerate);
            curY += 56;

            // Result Label & Box
            Label lblResult = new Label
            {
                Text = "Clave de Producto Criptográfica (Copiar y Enviar al Cliente):",
                Location = new Point(0, curY),
                AutoSize = true,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold),
                ForeColor = Color.FromArgb(56, 189, 248)
            };
            pnlContent.Controls.Add(lblResult);
            curY += 24;

            txtResultKey = new TextBox
            {
                Location = new Point(0, curY),
                Size = new Size(625, 34),
                ReadOnly = true,
                Font = new Font("Consolas", 13f, FontStyle.Bold),
                BackColor = Color.FromArgb(2, 6, 23),
                ForeColor = Color.FromArgb(52, 211, 153),
                BorderStyle = BorderStyle.FixedSingle,
                TextAlign = HorizontalAlignment.Center
            };
            pnlContent.Controls.Add(txtResultKey);
            curY += 46;

            // Action Buttons (Copy Key, Copy WhatsApp, Save to File)
            Button btnCopyKey = new Button
            {
                Text = "📋 Copiar Clave",
                Location = new Point(0, curY),
                Size = new Size(195, 36),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.FromArgb(248, 250, 252),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            btnCopyKey.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
            btnCopyKey.Click += BtnCopyKey_Click;
            pnlContent.Controls.Add(btnCopyKey);

            Button btnCopyWhatsApp = new Button
            {
                Text = "💬 Copiar Mensaje WhatsApp",
                Location = new Point(205, curY),
                Size = new Size(225, 36),
                BackColor = Color.FromArgb(37, 99, 235), // Blue
                ForeColor = Color.White,
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            btnCopyWhatsApp.FlatAppearance.BorderSize = 0;
            btnCopyWhatsApp.Click += BtnCopyWhatsApp_Click;
            pnlContent.Controls.Add(btnCopyWhatsApp);

            Button btnSaveLedger = new Button
            {
                Text = "💾 Guardar en Registro (.txt)",
                Location = new Point(440, curY),
                Size = new Size(185, 36),
                BackColor = Color.FromArgb(30, 41, 59),
                ForeColor = Color.FromArgb(248, 250, 252),
                FlatStyle = FlatStyle.Flat,
                Cursor = Cursors.Hand,
                Font = new Font("Segoe UI", 9f, FontStyle.Bold)
            };
            btnSaveLedger.FlatAppearance.BorderColor = Color.FromArgb(71, 85, 105);
            btnSaveLedger.Click += BtnSaveLedger_Click;
            pnlContent.Controls.Add(btnSaveLedger);
            curY += 44;

            // Status message
            lblStatus = new Label
            {
                Text = "Listo para emitir licencias oficiales Venematic.",
                Location = new Point(0, curY),
                Size = new Size(625, 24),
                ForeColor = Color.FromArgb(148, 163, 184),
                TextAlign = ContentAlignment.MiddleCenter
            };
            pnlContent.Controls.Add(lblStatus);

            // Populate Plans
            plans = new List<PlanItem>
            {
                new PlanItem { Code = "starter_full",  Prefix = "STR", Name = "⭐ Plan 1: KlikPOS Street Contado (Permanente)", Price = "$15.00", Days = null },
                new PlanItem { Code = "starter_trial", Prefix = "STT", Name = "💳 Plan 2: Financiado Street ($20) - Cuota 1 ($10/15d)", Price = "$10.00", Days = 15 },
                new PlanItem { Code = "pro_full",      Prefix = "PRO", Name = "👑 Plan 3: Completo Vitalicio Pro (+Cloud)", Price = "$50.00", Days = null },
                new PlanItem { Code = "starter_trial", Prefix = "STT", Name = "Starter - 1ra Cuota (30 días de acceso)", Price = "$25.00", Days = 30 },
                new PlanItem { Code = "starter_full",  Prefix = "STR", Name = "Starter - Licencia Completa Permanente", Price = "$50.00", Days = null },
                new PlanItem { Code = "pro_trial",     Prefix = "PTT", Name = "Pro Master - 1ra Cuota (30 días de acceso)", Price = "$37.50", Days = 30 },
                new PlanItem { Code = "pro_full",      Prefix = "PRO", Name = "Pro Master - Licencia Completa Permanente", Price = "$75.00", Days = null },
                new PlanItem { Code = "demo",          Prefix = "DMO", Name = "Demo / Evaluación de Cortesía (15 días)", Price = "GRATIS", Days = 15 },
                new PlanItem { Code = "trial_15m",     Prefix = "T15", Name = "Prueba Flash In Situ (15 minutos)", Price = "PRUEBA", Days = null, IsFlash15m = true },
                new PlanItem { Code = "anual",         Prefix = "ANL", Name = "Plan Anual de Renovación (365 días)", Price = "Anual", Days = 365 },
                new PlanItem { Code = "vitalicia",     Prefix = "VIT", Name = "Licencia Vitalicia Especial", Price = "Especial", Days = null }
            };

            foreach (var p in plans)
            {
                cmbPlan.Items.Add(p);
            }
            cmbPlan.SelectedIndex = 0;
        }

        private void BtnGenerate_Click(object sender, EventArgs e)
        {
            string hwid = txtHwid.Text.Trim();
            string rif = txtRif.Text.Trim();

            if (string.IsNullOrEmpty(hwid))
            {
                MessageBox.Show("Por favor ingresa el HWID del equipo o teléfono del cliente.", "HWID Requerido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtHwid.Focus();
                return;
            }

            if (string.IsNullOrEmpty(rif))
            {
                MessageBox.Show("Por favor ingresa el RIF o Cédula del comercio o cliente.", "RIF Requerido", MessageBoxButtons.OK, MessageBoxIcon.Warning);
                txtRif.Focus();
                return;
            }

            PlanItem selectedPlan = cmbPlan.SelectedItem as PlanItem;
            if (selectedPlan == null) return;

            string key = GenerateLicenseKey(hwid, rif, selectedPlan, chkCustomExpiry.Checked ? dtpExpires.Value.ToString("yyyy-MM-dd") : null);
            txtResultKey.Text = key;

            lblStatus.Text = "✓ Licencia generada exitosamente para " + (string.IsNullOrEmpty(txtComercio.Text) ? rif.ToUpper() : txtComercio.Text.Trim());
            lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
        }

        private void BtnCopyKey_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(txtResultKey.Text))
            {
                MessageBox.Show("Primero genera una clave de licencia.", "Atención", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }
            Clipboard.SetText(txtResultKey.Text);
            lblStatus.Text = "✓ Clave copiada al portapapeles.";
            lblStatus.ForeColor = Color.FromArgb(56, 189, 248);
        }

        private void BtnCopyWhatsApp_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(txtResultKey.Text))
            {
                MessageBox.Show("Primero genera una clave de licencia.", "Atención", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            PlanItem plan = cmbPlan.SelectedItem as PlanItem;
            string comercio = string.IsNullOrEmpty(txtComercio.Text) ? "Estimado Cliente" : txtComercio.Text.Trim();
            string vencimientoStr = plan.Days == null ? "PERMANENTE (Sin Vencimiento)" : (plan.IsFlash15m ? "15 Minutos" : (chkCustomExpiry.Checked ? dtpExpires.Value.ToString("dd/MM/yyyy") : plan.Days + " días"));

            StringBuilder sb = new StringBuilder();
            sb.AppendLine("✨ *ACTIVACIÓN OFICIAL VENEMATIC POS* ✨");
            sb.AppendLine("-----------------------------------------");
            sb.AppendLine("Hola, *" + comercio + "*! Aquí tienes tu clave de activación oficial para tu sistema:");
            sb.AppendLine("");
            sb.AppendLine("📌 *Comercio / RIF:* " + txtRif.Text.Trim().ToUpper());
            sb.AppendLine("💻 *HWID Terminal:* " + txtHwid.Text.Trim().ToUpper());
            sb.AppendLine("📦 *Plan Asignado:* " + plan.Name);
            sb.AppendLine("⏳ *Vigencia:* " + vencimientoStr);
            sb.AppendLine("");
            sb.AppendLine("🔑 *TU CLAVE DE ACTIVACIÓN:*");
            sb.AppendLine("`" + txtResultKey.Text.Trim() + "`");
            sb.AppendLine("");
            sb.AppendLine("📋 *Pasos para activar:*");
            sb.AppendLine("1. Abre Venematic POS en tu equipo o teléfono.");
            sb.AppendLine("2. En la pantalla de Licencia / Configuración, pega esta clave.");
            sb.AppendLine("3. Presiona 'Activar Licencia'. El sistema quedará habilitado de inmediato.");
            sb.AppendLine("-----------------------------------------");
            sb.AppendLine("¡Gracias por confiar en Venematic POS!");

            Clipboard.SetText(sb.ToString());
            lblStatus.Text = "✓ Mensaje de WhatsApp copiado al portapapeles.";
            lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
            MessageBox.Show("Mensaje de WhatsApp copiado con éxito. ¡Listo para pegar en el chat!", "Copiado", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void BtnSaveLedger_Click(object sender, EventArgs e)
        {
            if (string.IsNullOrEmpty(txtResultKey.Text))
            {
                MessageBox.Show("Primero genera una clave de licencia.", "Atención", MessageBoxButtons.OK, MessageBoxIcon.Information);
                return;
            }

            try
            {
                string filePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "LICENCIAS_EMITIDAS_REGISTRO.txt");
                PlanItem plan = cmbPlan.SelectedItem as PlanItem;
                string line = string.Format("[{0:yyyy-MM-dd HH:mm:ss}] | RIF: {1} | HWID: {2} | PLAN: {3} ({4}) | KEY: {5} | NEGOCIO: {6}",
                    DateTime.Now,
                    txtRif.Text.Trim().ToUpper(),
                    txtHwid.Text.Trim().ToUpper(),
                    plan.Code,
                    plan.Price,
                    txtResultKey.Text.Trim(),
                    txtComercio.Text.Trim()
                );

                File.AppendAllText(filePath, line + Environment.NewLine, Encoding.UTF8);
                lblStatus.Text = "✓ Guardado en LICENCIAS_EMITIDAS_REGISTRO.txt";
                lblStatus.ForeColor = Color.FromArgb(52, 211, 153);
                MessageBox.Show("Registro añadido con éxito a:\n" + filePath, "Guardado", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
            catch (Exception ex)
            {
                MessageBox.Show("Error guardando registro: " + ex.Message, "Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public static string ComputeSignature(string hwid, string rif, string plan, string expiresAt)
        {
            string cleanHwid = Regex.Replace(hwid.Trim().ToUpper(), "[^A-Z0-9]", "");
            string cleanRif = Regex.Replace(rif.Trim().ToUpper(), "[^A-Z0-9]", "");
            string payloadStr = string.Format("{0}#{1}#{2}#{3}#{4}", cleanHwid, cleanRif, plan, expiresAt, MASTER_SIGNING_SALT);

            using (SHA256 sha = SHA256.Create())
            {
                byte[] hashBytes = sha.ComputeHash(Encoding.UTF8.GetBytes(payloadStr));
                StringBuilder sb = new StringBuilder();
                foreach (byte b in hashBytes)
                {
                    sb.Append(b.ToString("X2"));
                }
                string fullHash = sb.ToString();
                return string.Format("{0}-{1}-{2}-{3}", 
                    fullHash.Substring(0, 4), 
                    fullHash.Substring(4, 4), 
                    fullHash.Substring(8, 4), 
                    fullHash.Substring(12, 4)
                );
            }
        }

        public static string GenerateLicenseKey(string hwid, string rif, PlanItem plan, string customExpiresDateStr = null)
        {
            string expires;
            string expCode;

            if (plan.Days == null && !plan.IsFlash15m)
            {
                expires = "NEVER";
                expCode = "PERP";
            }
            else if (plan.IsFlash15m)
            {
                expires = "15MIN";
                expCode = "15MN";
            }
            else
            {
                expires = customExpiresDateStr ?? DateTime.Now.AddDays(plan.Days.Value).ToString("yyyy-MM-dd");
                expCode = expires.Replace("-", "").Substring(2, 4);
            }

            string sig = ComputeSignature(hwid, rif, plan.Code, expires);
            return string.Format("VNK-{0}-{1}-{2}", plan.Prefix, expCode, sig);
        }

        [STAThread]
        static void Main()
        {
            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            Application.Run(new MainForm());
        }
    }
}
