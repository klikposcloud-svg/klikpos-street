package com.klikpos.pos;

import android.Manifest;
import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Build;
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
 * JS: window.Capacitor.Plugins.KlikSms.drain() / status() / requestSms() / openNotificationAccess()
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
        ret.put("sms", hasSms());
        ret.put("notifications", hasNotificationAccess());
        call.resolve(ret);
    }

    @PluginMethod
    public void requestSms(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !hasSms() && getActivity() != null) {
            getActivity().requestPermissions(new String[]{
                    Manifest.permission.RECEIVE_SMS,
                    Manifest.permission.READ_SMS
            }, 501);
        }
        JSObject ret = new JSObject();
        ret.put("sms", hasSms());
        call.resolve(ret);
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
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return getContext().checkSelfPermission(Manifest.permission.RECEIVE_SMS) == PackageManager.PERMISSION_GRANTED
                || getContext().checkSelfPermission(Manifest.permission.READ_SMS) == PackageManager.PERMISSION_GRANTED;
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
