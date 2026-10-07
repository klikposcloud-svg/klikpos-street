package com.klikpos.pos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Receptor estático de SMS bancarios (Pago Móvil).
 * Une SMS multiparte por remitente y los entrega al WebView vía MainActivity.
 * Si la app está cerrada, MainActivity los encola en SharedPreferences.
 */
public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "KlikSmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) return;
        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        String format = bundle.getString("format");
        if (pdus == null) return;

        Map<String, StringBuilder> bySender = new LinkedHashMap<>();
        for (Object pdu : pdus) {
            try {
                SmsMessage sms = Build.VERSION.SDK_INT >= Build.VERSION_CODES.M
                        ? SmsMessage.createFromPdu((byte[]) pdu, format)
                        : SmsMessage.createFromPdu((byte[]) pdu);
                if (sms == null) continue;
                String sender = sms.getDisplayOriginatingAddress();
                if (sender == null) sender = "SMS";
                StringBuilder sb = bySender.get(sender);
                if (sb == null) { sb = new StringBuilder(); bySender.put(sender, sb); }
                if (sms.getMessageBody() != null) sb.append(sms.getMessageBody());
            } catch (Exception e) {
                Log.e(TAG, "Error leyendo PDU", e);
            }
        }

        for (Map.Entry<String, StringBuilder> entry : bySender.entrySet()) {
            String body = entry.getValue().toString();
            if (!body.isEmpty()) {
                MainActivity.deliverPaymentText(context, body, entry.getKey(), "sms");
            }
        }
    }
}
