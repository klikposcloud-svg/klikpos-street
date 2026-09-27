using System;
using System.Diagnostics;
using System.IO;
using System.Net.Sockets;
using System.Threading;
using System.Windows.Forms;

namespace KlikPOS
{
    static class Program
    {
        private static Process serverProcess = null;

        [STAThread]
        static void Main()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string nodePath = Path.Combine(appDir, "bin", "node.exe");
            if (!File.Exists(nodePath))
            {
                nodePath = Path.Combine(appDir, "node.exe");
            }

            string serverScript = Path.Combine(appDir, "server.js");
            int port = 3002;

            // Verificar si el servidor ya se encuentra en ejecución en el puerto 3002
            bool alreadyRunning = IsPortInUse("127.0.0.1", port);

            if (!alreadyRunning)
            {
                if (File.Exists(nodePath) && File.Exists(serverScript))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = nodePath;
                    psi.Arguments = "server.js";
                    psi.WorkingDirectory = appDir;
                    psi.WindowStyle = ProcessWindowStyle.Hidden;
                    psi.CreateNoWindow = true;
                    psi.UseShellExecute = false;
                    psi.EnvironmentVariables["PORT"] = port.ToString();
                    psi.EnvironmentVariables["NODE_ENV"] = "production";

                    try
                    {
                        serverProcess = Process.Start(psi);
                    }
                    catch (Exception ex)
                    {
                        MessageBox.Show("Error iniciando el motor local de KlikPOS:\n" + ex.Message, "KlikPOS Enterprise", MessageBoxButtons.OK, MessageBoxIcon.Error);
                        return;
                    }

                    // Esperar hasta 6 segundos a que el puerto esté activo
                    for (int i = 0; i < 30; i++)
                    {
                        Thread.Sleep(200);
                        if (IsPortInUse("127.0.0.1", port)) break;
                    }
                }
                else
                {
                    MessageBox.Show("No se encontró el ejecutable del servidor o motor Node integrado.\nRuta buscada: " + nodePath, "KlikPOS Enterprise - Error", MessageBoxButtons.OK, MessageBoxIcon.Error);
                    return;
                }
            }

            // Lanzar la ventana nativa de la aplicación
            LaunchAppWindow("http://localhost:" + port);
        }

        static bool IsPortInUse(string host, int port)
        {
            try
            {
                using (var client = new TcpClient())
                {
                    var result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(250);
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        static void LaunchAppWindow(string url)
        {
            string edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Microsoft\Edge\Application\msedge.exe");
            if (!File.Exists(edgePath))
            {
                edgePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Microsoft\Edge\Application\msedge.exe");
            }

            string chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles), @"Google\Chrome\Application\chrome.exe");
            if (!File.Exists(chromePath))
            {
                chromePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86), @"Google\Chrome\Application\chrome.exe");
            }

            if (File.Exists(edgePath))
            {
                Process.Start(edgePath, "--app=" + url + " --window-size=1366,768");
            }
            else if (File.Exists(chromePath))
            {
                Process.Start(chromePath, "--app=" + url + " --window-size=1366,768");
            }
            else
            {
                Process.Start(url);
            }
        }
    }
}
