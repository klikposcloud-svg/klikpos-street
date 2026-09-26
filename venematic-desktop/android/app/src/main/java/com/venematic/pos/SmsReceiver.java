package com.venematic.pos;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "VenematicSmsReceiver";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent != null && "android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            Bundle bundle = intent.getExtras();
            if (bundle != null) {
                Object[] pdus = (Object[]) bundle.get("pdus");
                String format = bundle.getString("format");
                if (pdus != null) {
                    for (Object pdu : pdus) {
                        try {
                            SmsMessage sms;
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                                sms = SmsMessage.createFromPdu((byte[]) pdu, format);
                            } else {
                                sms = SmsMessage.createFromPdu((byte[]) pdu);
                            }
                            if (sms != null) {
                                String sender = sms.getDisplayOriginatingAddress();
                                String body = sms.getMessageBody();
                                if (body != null) {
                                    Log.d(TAG, "SMS detectado de: " + sender + " | Contenido: " + body);
                                    MainActivity.handleIncomingSms(body, sender != null ? sender : "SMS");
                                }
                            }
                        } catch (Exception e) {
                            Log.e(TAG, "Error leyendo PDU de SMS", e);
                        }
                    }
                }
            }
        }
    }
}
