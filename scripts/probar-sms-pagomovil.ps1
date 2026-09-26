# ==============================================================================
# VENEMATIC POS - SIMULADOR Y PROBADOR DE SMS / PAGO MÓVIL (WEBHOOK)
# ==============================================================================

param(
    [string]$Port = "3002"
)

$baseUrl = "http://localhost:$Port"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "     VENEMATIC POS - PROBADOR DE SMS Y PAGO MÓVIL AUTOMÁTICO    " -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host " Servidor destino: $baseUrl" -ForegroundColor Yellow
Write-Host " Nota: Asegúrate de tener Venematic POS abierto en tu PC." -ForegroundColor Gray
Write-Host "-----------------------------------------------------------------" -ForegroundColor DarkGray

function Send-TestWebhook($bodyText, $bancoNombre) {
    $url = "$baseUrl/api/payments/webhook"
    Write-Host "`n>>> Enviando simulación de SMS ($bancoNombre)..." -ForegroundColor Yellow
    Write-Host "    Texto SMS: `"$bodyText`"" -ForegroundColor Gray

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $bodyText -ContentType "text/plain; charset=utf-8"
        Write-Host ">>> [EXITO] ¡Pago Móvil recibido por el servidor POS!" -ForegroundColor Green
        Write-Host "    Banco      : $($response.payment.banco)" -ForegroundColor Cyan
        Write-Host "    Monto      : Bs. $($response.payment.monto)" -ForegroundColor Cyan
        Write-Host "    Referencia : $($response.payment.referencia)" -ForegroundColor Cyan
        Write-Host "`n🔔 Si tienes la pantalla de Venematic POS abierta, deberías escuchar" -ForegroundColor Green
        Write-Host "   la campana sonora y ver la notificación flotante en pantalla." -ForegroundColor Green
    } catch {
        Write-Host "`n[ERROR] No se pudo conectar a $url" -ForegroundColor Red
        Write-Host "Verifica que Venematic POS esté en ejecución (puerto $Port)." -ForegroundColor Yellow
        Write-Host "Detalle: $($_.Exception.Message)" -ForegroundColor DarkRed
    }
}

function Menu {
    $refRandom = (Get-Random -Minimum 100000 -Maximum 999999).ToString()

    Write-Host "`nSelecciona qué entidad bancaria deseas simular:" -ForegroundColor Cyan
    Write-Host "  [1] Banco de Venezuela (BDV - PagoClave 2661/2662)" -ForegroundColor White
    Write-Host "  [2] Banesco (Pago Móvil Banesco)" -ForegroundColor White
    Write-Host "  [3] Mercantil (Tpago)" -ForegroundColor White
    Write-Host "  [4] Bancamiga (Pago Móvil Interbancario)" -ForegroundColor White
    Write-Host "  [5] Enviar SMS con Monto y Referencia Personalizados" -ForegroundColor White
    Write-Host "  [6] Disparo directo vía URL (GET de prueba rápida)" -ForegroundColor White
    Write-Host "  [0] Salir" -ForegroundColor DarkGray
    Write-Host ""
    $opc = Read-Host "Opción [1-6]"

    switch ($opc) {
        "1" {
            $monto = (Get-Random -Minimum 50 -Maximum 800) + 0.50
            $sms = "BDV: PagoClave recibido por Bs. $($monto.ToString('0.00')) del 04121234567 Ref $refRandom"
            Send-TestWebhook $sms "Banco de Venezuela"
        }
        "2" {
            $monto = (Get-Random -Minimum 100 -Maximum 1200) + 0.75
            $sms = "Banesco Pago Movil: Recibiste Bs. $($monto.ToString('0.00')) de JUAN PEREZ, tlf 04149876543, Ref: $refRandom"
            Send-TestWebhook $sms "Banesco"
        }
        "3" {
            $monto = (Get-Random -Minimum 80 -Maximum 950) + 0.00
            $sms = "Tpago: Recibido Bs $($monto.ToString('0.00')) de MARIA RODRIGUEZ del 04245556677 Ref $refRandom"
            Send-TestWebhook $sms "Mercantil"
        }
        "4" {
            $monto = (Get-Random -Minimum 150 -Maximum 2000) + 0.25
            $sms = "Bancamiga: Pago Movil acreditado por Bs. $($monto.ToString('0.00')) de CARLOS MENDEZ Ref: $refRandom"
            Send-TestWebhook $sms "Bancamiga"
        }
        "5" {
            $customMonto = Read-Host "Ingresa el Monto en Bolívares (ej: 450.50)"
            $customRef = Read-Host "Ingresa el Número de Referencia (ej: 849302)"
            $sms = "BDV: PagoClave recibido por Bs. $customMonto del 04169998877 Ref $customRef"
            Send-TestWebhook $sms "Personalizado"
        }
        "6" {
            $testUrl = "$baseUrl/api/payments/webhook?action=test&monto=350.00&banco=Banco+de+Venezuela&ref=$refRandom"
            Write-Host "`n>>> Abriendo URL de prueba en navegador: $testUrl" -ForegroundColor Yellow
            Start-Process $testUrl
        }
        "0" { return }
        default { Write-Host "Opción inválida." -ForegroundColor Red }
    }
}

Menu
