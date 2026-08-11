package com.tivora.app;

import android.app.NotificationManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.util.Log;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;

public class CallDeclineReceiver extends BroadcastReceiver {
    private static final String TAG = "CallDeclineReceiver";
    public static final String ACTION_DECLINE = "com.tivora.app.ACTION_DECLINE_CALL";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        
        String action = intent.getAction();
        if (ACTION_DECLINE.equals(action)) {
            String callId = intent.getStringExtra("callId");
            int notificationId = intent.getIntExtra("notificationId", 2001);

            Log.d(TAG, "Declining callId: " + callId);

            // 1. Stop active ringtone
            TivoraMessagingService.stopRingtone();

            // 2. Dismiss notification
            NotificationManager notificationManager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (notificationManager != null) {
                notificationManager.cancel(notificationId);
            }

            // 3. Update Firestore status asynchronously
            if (callId != null && !callId.isEmpty()) {
                updateCallStatusInFirestore(callId, "rejected");
            }
        }
    }

    private void updateCallStatusInFirestore(final String callId, final String status) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    String firestoreUrl = "https://firestore.googleapis.com/v1/projects/tivora-2abd2/databases/(default)/documents/calls/" + callId + "?updateMask.fieldPaths=status";
                    URL url = new URL(firestoreUrl);
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("PATCH");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setDoOutput(true);

                    String jsonInputString = "{\"fields\": {\"status\": {\"stringValue\": \"" + status + "\"}}}";
                    try (OutputStream os = conn.getOutputStream()) {
                        byte[] input = jsonInputString.getBytes(StandardCharsets.UTF_8);
                        os.write(input, 0, input.length);
                    }

                    int responseCode = conn.getResponseCode();
                    Log.d(TAG, "Firestore update response code: " + responseCode);
                } catch (Exception e) {
                    Log.e(TAG, "Error updating call status in Firestore: ", e);
                }
            }
        }).start();
    }
}
