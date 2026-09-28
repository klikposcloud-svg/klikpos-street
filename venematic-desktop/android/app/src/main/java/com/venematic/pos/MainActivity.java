package com.venematic.pos;

import android.os.Bundle;
import android.os.Build;
import android.content.IntentFilter;
import android.webkit.WebView;
import android.util.Log;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "VenematicMainActivity";
    private static MainActivity instance;
    private SmsReceiver smsReceiver;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = this;

        // Solicitar permisos de recepción de SMS en tiempo de ejecución para Android 6.0+
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                if (checkSelfPermission(android.Manifest.permission.RECEIVE_SMS) != android.content.pm.PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{
                        android.Manifest.permission.RECEIVE_SMS,
                        android.Manifest.permission.READ_SMS
                    }, 501);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error solicitando permisos de SMS", e);
            }
        }

        // Registrar receptor dinámico en primer plano
        try {
            smsReceiver = new SmsReceiver();
            IntentFilter filter = new IntentFilter("android.provider.Telephony.SMS_RECEIVED");
            filter.setPriority(999);
            registerReceiver(smsReceiver, filter);
            Log.d(TAG, "Receptor de SMS Pago Móvil registrado con éxito");
        } catch (Exception e) {
            Log.e(TAG, "Error registrando receptor dinámico de SMS", e);
        }
    }

    @Override
    public void onDestroy() {
        super.onDestroy();
        try {
            if (smsReceiver != null) {
                unregisterReceiver(smsReceiver);
            }
        } catch (Exception ignored) {}
    }

    public static void handleIncomingSms(final String body, final String sender) {
        if (instance != null && instance.getBridge() != null) {
            instance.runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    try {
                        WebView webView = instance.getBridge().getWebView();
                        if (webView != null) {
                            String safeBody = body.replace("\\", "\\\\")
                                                  .replace("\"", "\\\"")
                                                  .replace("\n", " ")
                                                  .replace("\r", "");
                            String safeSender = sender.replace("\\", "\\\\")
                                                      .replace("\"", "\\\"");
                            String script = "window.dispatchEvent(new CustomEvent('venematic:sms_received', { detail: { body: \"" + safeBody + "\", sender: \"" + safeSender + "\" } }));" +
                                            "window.dispatchEvent(new CustomEvent('klikpos:sms_received', { detail: { body: \"" + safeBody + "\", sender: \"" + safeSender + "\" } }));";
                            webView.evaluateJavascript(script, null);
                            Log.d(TAG, "Eventos venematic:sms_received y klikpos:sms_received inyectados al WebView con éxito");
                        }
                    } catch (Exception e) {
                        Log.e(TAG, "Error evaluando script en WebView", e);
                    }
                }
            });
        }
    }
}
