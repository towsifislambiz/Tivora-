package com.tivora.app;

import android.app.Notification;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.net.Uri;
import android.os.Build;
import android.os.Vibrator;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;

import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TivoraMessagingService extends FirebaseMessagingService {

    private static final String TAG = "TivoraMessagingService";
    private static MediaPlayer mediaPlayer = null;
    private static Vibrator vibrator = null;
    private static final ConcurrentHashMap<String, Integer> activeCallNotifications = new ConcurrentHashMap<>();

    @Override
    public void onNewToken(@NonNull String token) {
        super.onNewToken(token);
        Log.d(TAG, "New FCM Token generated: " + token);
        getSharedPreferences("tivora_prefs", MODE_PRIVATE)
                .edit()
                .putString("fcm_token", token)
                .apply();
    }

    @Override
    public void onMessageReceived(@NonNull RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);
        Log.d(TAG, "FCM Message received: " + remoteMessage.getData());

        Map<String, String> data = remoteMessage.getData();
        if (data == null || data.isEmpty()) {
            if (remoteMessage.getNotification() != null) {
                showSimpleNotification(
                        remoteMessage.getNotification().getTitle(),
                        remoteMessage.getNotification().getBody(),
                        null
                );
            }
            return;
        }

        String type = data.get("type");
        String callId = data.get("callId");
        String status = data.get("status");

        if ("incoming_call".equals(type) || "call".equals(type)) {
            if (status == null || "calling".equals(status) || "ringing".equals(status)) {
                handleIncomingCall(data);
            } else if ("cancelled".equals(status) || "ended".equals(status) || "rejected".equals(status) || "missed".equals(status) || "timeout".equals(status)) {
                handleCallDismissal(callId);
            }
        } else if ("message".equals(type) || data.containsKey("conversationId")) {
            handleMessageNotification(data);
        } else {
            String title = data.getOrDefault("title", remoteMessage.getNotification() != null ? remoteMessage.getNotification().getTitle() : "Tivora Notification");
            String body = data.getOrDefault("body", remoteMessage.getNotification() != null ? remoteMessage.getNotification().getBody() : "");
            showSimpleNotification(title, body, data.get("conversationId"));
        }
    }

    private void handleMessageNotification(Map<String, String> data) {
        String senderName = data.getOrDefault("senderName", data.getOrDefault("title", "Tivora Message"));
        String messageBody = data.getOrDefault("text", data.getOrDefault("body", "Sent a message"));
        String conversationId = data.get("conversationId");

        NotificationChannelHelper.createNotificationChannels(this);

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (conversationId != null) {
            intent.putExtra("conversationId", conversationId);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                (conversationId != null ? conversationId.hashCode() : 1001),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/tivora_message");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NotificationChannelHelper.CHANNEL_MESSAGES_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(senderName)
                .setContentText(messageBody)
                .setAutoCancel(true)
                .setSound(soundUri)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_MESSAGE)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            int notificationId = conversationId != null ? Math.abs(conversationId.hashCode()) : (int) System.currentTimeMillis();
            notificationManager.notify(notificationId, builder.build());
        }
    }

    private void handleIncomingCall(Map<String, String> data) {
        String callId = data.get("callId");
        if (callId == null) callId = "default_call_" + System.currentTimeMillis();

        String callerName = data.getOrDefault("callerName", data.getOrDefault("callerDisplayName", "Tivora Friend"));
        String callType = data.getOrDefault("callType", data.getOrDefault("type", "voice"));
        String callTitle = "video".equalsIgnoreCase(callType) ? "Incoming Video Call" : "Incoming Voice Call";

        int notificationId = Math.abs(callId.hashCode());
        activeCallNotifications.put(callId, notificationId);

        NotificationChannelHelper.createNotificationChannels(this);

        // Start looping ringtone
        startRingtone(this);

        // Answer PendingIntent -> CallAnswerActivity
        Intent answerIntent = new Intent(this, CallAnswerActivity.class);
        answerIntent.putExtra("callId", callId);
        answerIntent.putExtra("notificationId", notificationId);
        PendingIntent answerPendingIntent = PendingIntent.getActivity(
                this,
                notificationId + 1,
                answerIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Decline PendingIntent -> CallDeclineReceiver
        Intent declineIntent = new Intent(this, CallDeclineReceiver.class);
        declineIntent.setAction(CallDeclineReceiver.ACTION_DECLINE);
        declineIntent.putExtra("callId", callId);
        declineIntent.putExtra("notificationId", notificationId);
        PendingIntent declinePendingIntent = PendingIntent.getBroadcast(
                this,
                notificationId + 2,
                declineIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        // Full Screen Intent (Lock screen / heads-up)
        Intent fullScreenIntent = new Intent(this, CallAnswerActivity.class);
        fullScreenIntent.putExtra("callId", callId);
        fullScreenIntent.putExtra("notificationId", notificationId);
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(
                this,
                notificationId + 3,
                fullScreenIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Uri ringtoneUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + getPackageName() + "/raw/tivora_ringtone");

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NotificationChannelHelper.CHANNEL_CALLS_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(callerName)
                .setContentText(callTitle)
                .setCategory(NotificationCompat.CATEGORY_CALL)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setSound(ringtoneUri)
                .setFullScreenIntent(fullScreenPendingIntent, true)
                .addAction(R.mipmap.ic_launcher, "❌ Decline", declinePendingIntent)
                .addAction(R.mipmap.ic_launcher, "📞 Answer", answerPendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify(notificationId, builder.build());
        }
    }

    private void handleCallDismissal(String callId) {
        Log.d(TAG, "Dismissing call notification for callId: " + callId);
        stopRingtone();

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            if (callId != null && activeCallNotifications.containsKey(callId)) {
                Integer notificationId = activeCallNotifications.remove(callId);
                if (notificationId != null) {
                    notificationManager.cancel(notificationId);
                }
            } else {
                // Cancel default call notification group if callId not found
                for (Integer id : activeCallNotifications.values()) {
                    notificationManager.cancel(id);
                }
                activeCallNotifications.clear();
            }
        }
    }

    private void showSimpleNotification(String title, String body, String conversationId) {
        NotificationChannelHelper.createNotificationChannels(this);

        Intent intent = new Intent(this, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        if (conversationId != null) {
            intent.putExtra("conversationId", conversationId);
        }

        PendingIntent pendingIntent = PendingIntent.getActivity(
                this,
                (int) System.currentTimeMillis(),
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, NotificationChannelHelper.CHANNEL_MESSAGES_ID)
                .setSmallIcon(R.mipmap.ic_launcher)
                .setContentTitle(title != null ? title : "Tivora")
                .setContentText(body != null ? body : "")
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
        if (notificationManager != null) {
            notificationManager.notify((int) System.currentTimeMillis(), builder.build());
        }
    }

    public static synchronized void startRingtone(Context context) {
        try {
            stopRingtone();

            Uri soundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/raw/tivora_ringtone");
            mediaPlayer = new MediaPlayer();
            mediaPlayer.setDataSource(context, soundUri);
            mediaPlayer.setAudioAttributes(
                    new AudioAttributes.Builder()
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                            .build()
            );
            mediaPlayer.setLooping(true);
            mediaPlayer.prepare();
            mediaPlayer.start();

            vibrator = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (vibrator != null && vibrator.hasVibrator()) {
                long[] pattern = {0, 1000, 500, 1000};
                vibrator.vibrate(pattern, 0);
            }
        } catch (Exception e) {
            Log.e(TAG, "Error playing ringtone: ", e);
        }
    }

    public static synchronized void stopRingtone() {
        try {
            if (mediaPlayer != null) {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
                mediaPlayer.release();
                mediaPlayer = null;
            }
            if (vibrator != null) {
                vibrator.cancel();
                vibrator = null;
            }
        } catch (Exception e) {
            Log.e(TAG, "Error stopping ringtone: ", e);
        }
    }
}
