package com.tivora.app;

import android.content.Intent;
import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    private static final String TAG = "MainActivity";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Ensure Tivora notification channels exist on app launch
        NotificationChannelHelper.createNotificationChannels(this);

        // Handle intent if launched from notification answer button
        handleCallIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleCallIntent(intent);
    }

    private void handleCallIntent(Intent intent) {
        if (intent == null) return;
        String callId = intent.getStringExtra("callId");
        String action = intent.getStringExtra("action");

        if (callId != null && !callId.isEmpty()) {
            Log.d(TAG, "Opened MainActivity with callId: " + callId + ", action: " + action);
            // Stop any active background ringtone when opening main app
            TivoraMessagingService.stopRingtone();
        }
    }
}
