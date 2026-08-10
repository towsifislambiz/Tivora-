package com.tivora.app;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.content.ContentResolver;
import android.content.Context;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;

public class NotificationChannelHelper {

    public static final String CHANNEL_MESSAGES_ID = "tivora_messages";
    public static final String CHANNEL_MESSAGES_NAME = "Tivora Messages";

    public static final String CHANNEL_CALLS_ID = "tivora_calls";
    public static final String CHANNEL_CALLS_NAME = "Tivora Calls";

    public static void createNotificationChannels(Context context) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return;
        }

        NotificationManager notificationManager = context.getSystemService(NotificationManager.class);
        if (notificationManager == null) return;

        // 1. Messages Notification Channel
        NotificationChannel messageChannel = new NotificationChannel(
                CHANNEL_MESSAGES_ID,
                CHANNEL_MESSAGES_NAME,
                NotificationManager.IMPORTANCE_HIGH
        );
        messageChannel.setDescription("Notifications for new Tivora direct messages");
        messageChannel.enableVibration(true);
        messageChannel.setVibrationPattern(new long[]{0, 250, 250, 250});

        Uri messageSoundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/raw/tivora_message");
        AudioAttributes audioAttributesMessage = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_COMMUNICATION_INSTANT)
                .build();
        messageChannel.setSound(messageSoundUri, audioAttributesMessage);

        notificationManager.createNotificationChannel(messageChannel);

        // 2. Incoming Calls Notification Channel
        NotificationChannel callChannel = new NotificationChannel(
                CHANNEL_CALLS_ID,
                CHANNEL_CALLS_NAME,
                NotificationManager.IMPORTANCE_MAX
        );
        callChannel.setDescription("High-priority notifications for incoming Tivora voice and video calls");
        callChannel.enableVibration(true);
        callChannel.setVibrationPattern(new long[]{0, 1000, 500, 1000});
        callChannel.setLockscreenVisibility(android.app.Notification.VISIBILITY_PUBLIC);

        Uri callSoundUri = Uri.parse(ContentResolver.SCHEME_ANDROID_RESOURCE + "://" + context.getPackageName() + "/raw/tivora_ringtone");
        AudioAttributes audioAttributesCall = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE)
                .build();
        callChannel.setSound(callSoundUri, audioAttributesCall);

        notificationManager.createNotificationChannel(callChannel);
    }
}
