package com.klikpos.pos;

import android.content.Context;
import android.content.SharedPreferences;
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
    }

    @Override
    public void onDestroy() {
        if (instance == this) instance = null;
        super.onDestroy();
    }

    /** Punto único de entrada para notificaciones bancarias y alertas de pago. */
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
        return arr;
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
