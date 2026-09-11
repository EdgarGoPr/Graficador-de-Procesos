$ErrorActionPreference = "Stop"
try {
    $cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert | Where-Object { $_.Subject -like "*ProcesStudio*" } | Select-Object -First 1

    if (-not $cert) {
        Write-Host "Generando certificado de firma de codigo..."
        $cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=ProcesStudio Software, O=DGSTI, C=AR" -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(5)
        
        $tempCertPath = Join-Path $env:TEMP "ProcesStudioCert.cer"
        Export-Certificate -Cert $cert -FilePath $tempCertPath | Out-Null
        Import-Certificate -FilePath $tempCertPath -CertStoreLocation "Cert:\CurrentUser\TrustedPublisher" | Out-Null
        Remove-Item $tempCertPath -Force -ErrorAction SilentlyContinue
        Write-Host "Certificado registrado en TrustedPublisher."
    }

    $exePath = Join-Path $PSScriptRoot "..\MiAppProcesos_USB\ProcesStudio.exe"
    if (Test-Path $exePath) {
        Unblock-File -Path $exePath -ErrorAction SilentlyContinue
        $sig = Set-AuthenticodeSignature -FilePath $exePath -Certificate $cert
        Write-Host "Estado de la firma:" $sig.Status
        Write-Host "Firmado con exito:" $sig.StatusMessage
    }
} catch {
    Write-Host "Error en el proceso de firma:" $_.Exception.Message
}
