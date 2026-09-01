const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
  try {
    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 1600,
      webPreferences: {
        nodeIntegration: false
      }
    });

    const htmlPath = path.resolve(__dirname, '../MiAppProcesos_USB/MANUAL_DE_USO.html');
    await win.loadFile(htmlPath);

    // Wait for fonts and styles to render
    await new Promise(r => setTimeout(r, 1200));

    const pdfBuffer = await win.webContents.printToPDF({
      pageSize: 'A4',
      printBackground: true,
      margins: {
        top: 0.4,
        bottom: 0.4,
        left: 0.4,
        right: 0.4
      }
    });

    const outPath1 = path.resolve(__dirname, '../MiAppProcesos_USB/MANUAL_DE_USO.pdf');
    const outPath2 = path.resolve(__dirname, '../MANUAL_DE_USO.pdf');

    fs.writeFileSync(outPath1, pdfBuffer);
    fs.writeFileSync(outPath2, pdfBuffer);

    console.log('[SUCCESS] PDF generado en:', outPath1);
    console.log('[SUCCESS] PDF generado en:', outPath2);
    app.exit(0);
  } catch (err) {
    console.error('[ERROR] Error al generar PDF:', err);
    app.exit(1);
  }
});
