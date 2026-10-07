package com.klikpos.pos;

import android.Manifest;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebView;

import com.getcapacitor.BridgeActivity;

import org.json.JSONArray;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "KlikMainActivity";
    private static final String PREFS = "klik_payment_queue";
    private static final String KEY = "items";
    private static final long MAX_AGE_MS = 2L * 60 * 60 * 1000; // 2 horas
    private static final int MAX_ITEMS = 40;

    private static MainActivity instance;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(KlikSmsPlugin.class);
        super.onCreate(savedInstanceState);
        instance = this;

        // Solicitar permisos de SMS (Recepción en vivo y lectura de buzón)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                if (checkSelfPermission(Manifest.permission.RECEIVE_SMS) != PackageManager.PERMISSION_GRANTED
                        || checkSelfPermission(Manifest.permission.READ_SMS) != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{
                            Manifest.permission.RECEIVE_SMS,
                            Manifest.permission.READ_SMS
                    }, 501);
                }
            } catch (Exception e) {
                Log.e(TAG, "Error solicitando permisos SMS", e);
            }
        }
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    /** Punto único de entrada para SMS y notificaciones bancarias. */
    public static synchronized void deliverPaymentText(Context ctx, String body, String sender, String source) {
        try {
            JSONObject item = new JSONObject();
            item.put("id", source + "_" + System.currentTimeMillis() + "_" + Math.abs(body.hashCode()));
            item.put("body", body);
            item.put("sender", sender == null ? "" : sender);
            item.put("source", source);
            item.put("timestamp", System.currentTimeMillis());
            enqueue(ctx, item);
            dispatchToWebView(item);
        } catch (Exception e) {
            Log.e(TAG, "Error entregando texto de pago", e);
        }
    }

    private static void enqueue(Context ctx, JSONObject item) throws Exception {
        SharedPreferences sp = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray old = new JSONArray(sp.getString(KEY, "[]"));
        JSONArray fresh = new JSONArray();
        long now = System.currentTimeMillis();
        for (int i = 0; i < old.length(); i++) {
            JSONObject o = old.optJSONObject(i);
            if (o != null && now - o.optLong("timestamp", 0) < MAX_AGE_MS) fresh.put(o);
        }
        fresh.put(item);
        while (fresh.length() > MAX_ITEMS) fresh.remove(0);
        sp.edit().putString(KEY, fresh.toString()).apply();
    }

    /** Devuelve y vacía la cola (la llama el plugin KlikSms.drain()). */
    public static synchronized JSONArray drainQueue(Context ctx) {
        SharedPreferences sp = ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        JSONArray arr;
        try { arr = new JSONArray(sp.getString(KEY, "[]")); } catch (Exception e) { arr = new JSONArray(); }
        sp.edit().putString(KEY, "[]").apply();

        // Si tenemos permiso READ_SMS, verificar también mensajes bancarios en el buzón SMS
        // en caso de que el SMS haya llegado antes de abrir la app o con el proceso detenido
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M &&
                ctx.checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED) {
            readRecentInboxSms(ctx, arr);
        }

        return arr;
    }

    private static void readRecentInboxSms(Context ctx, JSONArray outArr) {
        android.database.Cursor cursor = null;
        try {
            android.net.Uri inboxUri = android.net.Uri.parse("content://sms/inbox");
            long cutoff = System.currentTimeMillis() - MAX_AGE_MS;
            String selection = "date > ?";
            String[] selectionArgs = new String[]{ String.valueOf(cutoff) };
            String sortOrder = "date DESC LIMIT 15";

            cursor = ctx.getContentResolver().query(
                    inboxUri,
                    new String[]{"_id", "address", "body", "date"},
                    selection,
                    selectionArgs,
                    sortOrder
            );

            if (cursor != null && cursor.moveToFirst()) {
                java.util.regex.Pattern bankPattern = java.util.regex.Pattern.compile(
                        "(?i)(pago\\s*m[oó]vil|pagom[oó]vil|pagoclave|tpago|banesco|bdv|mercantil|bancamiga|provincial|bnc|bicentenario|bancaribe).*(bs|ref)",
                        java.util.regex.Pattern.DOTALL
                );
                do {
                    int bodyIdx = cursor.getColumnIndex("body");
                    int addrIdx = cursor.getColumnIndex("address");
                    int dateIdx = cursor.getColumnIndex("date");
                    int idIdx = cursor.getColumnIndex("_id");

                    String body = bodyIdx >= 0 ? cursor.getString(bodyIdx) : null;
                    String address = addrIdx >= 0 ? cursor.getString(addrIdx) : "SMS";
                    long date = dateIdx >= 0 ? cursor.getLong(dateIdx) : System.currentTimeMillis();
                    String id = "inbox_" + (idIdx >= 0 ? cursor.getString(idIdx) : String.valueOf(date));

                    if (body != null && bankPattern.matcher(body).find()) {
                        boolean already = false;
                        for (int i = 0; i < outArr.length(); i++) {
                            JSONObject existing = outArr.optJSONObject(i);
                            if (existing != null && body.equals(existing.optString("body", ""))) {
                                already = true;
                                break;
                            }
                        }
                        if (!already) {
                            JSONObject item = new JSONObject();
                            item.put("id", id);
                            item.put("body", body);
                            item.put("sender", address == null ? "SMS" : address);
                            item.put("source", "inbox");
                            item.put("timestamp", date > 0 ? date : System.currentTimeMillis());
                            outArr.put(item);
                        }
                    }
                } while (cursor.moveToNext());
            }
        } catch (Exception e) {
            Log.e(TAG, "Error leyendo buzón SMS nativo", e);
        } finally {
            if (cursor != null) {
                try { cursor.close(); } catch (Exception ignored) {}
            }
        }
    }

    private static void dispatchToWebView(final JSONObject item) {
        final MainActivity act = instance;
        if (act == null || act.getBridge() == null) return;
        act.runOnUiThread(() -> {
            try {
                WebView wv = act.getBridge().getWebView();
                if (wv == null) return;
                String json = item.toString();
                String js = "(function(d){window.dispatchEvent(new CustomEvent('klikpos:sms_received',{detail:d}));"
                        + "window.dispatchEvent(new CustomEvent('venematic:sms_received',{detail:d}));})(" + json + ");";
                wv.evaluateJavascript(js, null);
            } catch (Exception e) {
                Log.e(TAG, "Error inyectando evento SMS", e);
            }
        });
    }
}
