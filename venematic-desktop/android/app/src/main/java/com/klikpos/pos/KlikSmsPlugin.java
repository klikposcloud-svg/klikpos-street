package com.klikpos.pos;

import android.content.ComponentName;
import android.content.Intent;
import android.provider.Settings;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;

/**
 * Puente JS <-> nativo para Pago Móvil.
 * Utiliza NotificationListenerService para interceptar avisos de bancos y SMS
 * de manera 100% segura y permitida por Google Play Protect.
 */
@CapacitorPlugin(name = "KlikSms")
public class KlikSmsPlugin extends Plugin {

    @PluginMethod
    public void drain(PluginCall call) {
        JSONArray items = MainActivity.drainQueue(getContext());
        JSObject ret = new JSObject();
        try { ret.put("items", JSArray.from(toArray(items))); } catch (Exception e) { ret.put("items", new JSArray()); }
        call.resolve(ret);
    }

    @PluginMethod
    public void status(PluginCall call) {
        JSObject ret = new JSObject();
        boolean hasAccess = hasNotificationAccess();
        ret.put("sms", hasAccess);
        ret.put("notifications", hasAccess);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSms(PluginCall call) {
        openNotificationAccess(call);
    }

    @PluginMethod
    public void openNotificationAccess(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception ignored) {}
        call.resolve();
    }

    @PluginMethod
    public void openAppSettings(PluginCall call) {
        try {
            Intent i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
            i.setData(android.net.Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        } catch (Exception ignored) {}
        call.resolve();
    }

    private boolean hasSms() {
        return hasNotificationAccess();
    }

    private boolean hasNotificationAccess() {
        String flat = Settings.Secure.getString(getContext().getContentResolver(), "enabled_notification_listeners");
        if (flat == null) return false;
        String me = new ComponentName(getContext(), BankNotificationListener.class).flattenToString();
        return flat.contains(me);
    }

    private static Object[] toArray(JSONArray arr) throws Exception {
        Object[] out = new Object[arr.length()];
        for (int i = 0; i < arr.length(); i++) out[i] = arr.get(i);
        return out;
    }
}
