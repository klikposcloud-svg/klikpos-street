package com.klikpos.pos;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.regex.Pattern;

/**
 * Receptor de notificaciones del sistema para KlikPOS.
 * Captura las alertas emitidas por la app de SMS (Google Messages, Samsung, MIUI, etc.)
 * y por las aplicaciones de los bancos venezolanos (BDVApp, Banesco, etc.)
 * sin requerir permisos peligrosos de SMS en el manifiesto (0% riesgo de Google Play Protect).
 */
public class BankNotificationListener extends NotificationListenerService {
    private static final Pattern PAYMENT_HINT = Pattern.compile(
            "(?i)(pago\\s*m[oó]vil|pagom[oó]vil|pagoclave|tpago|recibi|abono|acredit|transferencia|bdv|banesco|mercantil|bancamiga|provincial|bnc|bicentenario|bancaribe).*(bs\\.?|ref|monto)",
            Pattern.DOTALL);

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null || getPackageName().equals(sbn.getPackageName())) return;
            Notification n = sbn.getNotification();
            if (n == null || n.extras == null) return;
            Bundle ex = n.extras;

            CharSequence title = ex.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence text = ex.getCharSequence(Notification.EXTRA_TEXT);
            CharSequence bigText = ex.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence summary = ex.getCharSequence(Notification.EXTRA_SUMMARY_TEXT);
            CharSequence[] lines = ex.getCharSequenceArray(Notification.EXTRA_TEXT_LINES);

            StringBuilder sb = new StringBuilder();
            if (title != null && title.length() > 0) sb.append(title).append(": ");
            if (bigText != null && bigText.length() > 0) {
                sb.append(bigText).append(" ");
            } else if (text != null && text.length() > 0) {
                sb.append(text).append(" ");
            }
            if (lines != null) {
                for (CharSequence line : lines) {
                    if (line != null) sb.append(line).append(" ");
                }
            }
            if (summary != null) sb.append(summary);

            String body = sb.toString().trim();
            if (body.isEmpty() || !PAYMENT_HINT.matcher(body).find()) return;

            MainActivity.deliverPaymentText(getApplicationContext(), body, sbn.getPackageName(), "notification");
        } catch (Exception ignored) {}
    }
}
