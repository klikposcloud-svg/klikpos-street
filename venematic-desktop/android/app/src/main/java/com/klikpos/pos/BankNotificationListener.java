package com.klikpos.pos;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.regex.Pattern;

/**
 * Lee notificaciones push de apps bancarias / app de mensajes (requiere que el usuario
 * active "Acceso a notificaciones" para KlikPOS). Sólo reenvía textos que parecen un pago.
 */
public class BankNotificationListener extends NotificationListenerService {
    private static final Pattern PAYMENT_HINT = Pattern.compile(
            "(?i)(pago\\s*m[oó]vil|pagom[oó]vil|pagoclave|tpago|recibi|abono|acredit|transferencia).*(bs\\.?|ref)",
            Pattern.DOTALL);

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        try {
            if (sbn == null || getPackageName().equals(sbn.getPackageName())) return;
            Notification n = sbn.getNotification();
            if (n == null || n.extras == null) return;
            Bundle ex = n.extras;
            CharSequence title = ex.getCharSequence(Notification.EXTRA_TITLE);
            CharSequence big = ex.getCharSequence(Notification.EXTRA_BIG_TEXT);
            CharSequence text = big != null ? big : ex.getCharSequence(Notification.EXTRA_TEXT);
            if (text == null) return;
            String body = (title != null ? title + ": " : "") + text;
            if (!PAYMENT_HINT.matcher(body).find()) return;
            MainActivity.deliverPaymentText(getApplicationContext(), body, sbn.getPackageName(), "notification");
        } catch (Exception ignored) {}
    }
}
