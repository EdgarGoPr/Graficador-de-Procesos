using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Windows.Forms;

[assembly: AssemblyTitle("ProcesStudio Portable")]
[assembly: AssemblyDescription("BPMN 2.0 (ISO 19510) & ISO 9001:2015 Process Studio")]
[assembly: AssemblyConfiguration("")]
[assembly: AssemblyCompany("ProcesStudio")]
[assembly: AssemblyProduct("ProcesStudio Portable")]
[assembly: AssemblyCopyright("Copyright © 2026")]
[assembly: AssemblyTrademark("")]
[assembly: ComVisible(false)]
[assembly: Guid("b2c58971-4682-4fa1-8288-51829e7104b2")]
[assembly: AssemblyVersion("1.0.0.0")]
[assembly: AssemblyFileVersion("1.0.0.0")]

namespace ProcesStudio
{
    static class Program
    {
        [STAThread]
        static void Main(string[] args)
        {
            try
            {
                string baseDir = AppDomain.CurrentDomain.BaseDirectory;
                
                // Check if Proyectos folder exists, create if not
                string projectsDir = Path.Combine(baseDir, "Proyectos");
                if (!Directory.Exists(projectsDir))
                {
                    try { Directory.CreateDirectory(projectsDir); } catch { }
                }

                // Candidate paths for Electron executable
                string[] possibleElectronPaths = new string[]
                {
                    Path.Combine(baseDir, "App", "electron", "electron.exe"),
                    Path.Combine(baseDir, "App", "electron.exe"),
                    Path.Combine(baseDir, "electron", "electron.exe"),
                    Path.Combine(baseDir, "node_modules", "electron", "dist", "electron.exe"),
                    Path.Combine(baseDir, "..", "node_modules", "electron", "dist", "electron.exe")
                };

                // Candidate paths for Electron main entrypoint
                string[] possibleMainScripts = new string[]
                {
                    Path.Combine(baseDir, "App", "main.cjs"),
                    Path.Combine(baseDir, "electron", "main.cjs"),
                    Path.Combine(baseDir, "main.cjs"),
                    Path.Combine(baseDir, "..", "electron", "main.cjs")
                };

                string electronExe = null;
                foreach (var path in possibleElectronPaths)
                {
                    if (File.Exists(path))
                    {
                        electronExe = Path.GetFullPath(path);
                        break;
                    }
                }

                string mainScript = null;
                foreach (var path in possibleMainScripts)
                {
                    if (File.Exists(path))
                    {
                        mainScript = Path.GetFullPath(path);
                        break;
                    }
                }

                if (!string.IsNullOrEmpty(electronExe) && !string.IsNullOrEmpty(mainScript))
                {
                    ProcessStartInfo psi = new ProcessStartInfo();
                    psi.FileName = electronExe;
                    psi.Arguments = "\"" + mainScript + "\" --portable";
                    psi.WorkingDirectory = Path.GetDirectoryName(mainScript);
                    psi.UseShellExecute = false;
                    psi.CreateNoWindow = true;

                    Process.Start(psi);
                    return;
                }

                // Fallback: Open compiled web app in browser
                string[] possibleHtmlPaths = new string[]
                {
                    Path.Combine(baseDir, "App", "dist", "index.html"),
                    Path.Combine(baseDir, "dist", "index.html"),
                    Path.Combine(baseDir, "index.html"),
                    Path.Combine(baseDir, "..", "dist", "index.html")
                };

                foreach (var htmlPath in possibleHtmlPaths)
                {
                    if (File.Exists(htmlPath))
                    {
                        Process.Start(new ProcessStartInfo(Path.GetFullPath(htmlPath)) { UseShellExecute = true });
                        return;
                    }
                }

                MessageBox.Show(
                    "No se encontraron los componentes de inicio de ProcesStudio.\nVerifique que la carpeta App/ contenga los archivos del programa.",
                    "ProcesStudio Portable",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
            catch (Exception ex)
            {
                MessageBox.Show(
                    "Error al iniciar ProcesStudio Portable:\n" + ex.Message,
                    "Error",
                    MessageBoxButtons.OK,
                    MessageBoxIcon.Error
                );
            }
        }
    }
}
