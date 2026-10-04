/*
 * Copyright @ 2017-present 8x8, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.jitsi.meet;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.RestrictionEntry;
import android.content.RestrictionsManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.view.KeyEvent;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.oney.WebRTCModule.WebRTCModuleOptions;

import org.jitsi.meet.sdk.JitsiMeet;
import org.jitsi.meet.sdk.JitsiMeetActivity;
import org.jitsi.meet.sdk.JitsiMeetConferenceOptions;
import org.jitsi.meet.sdk.JitsiMeetUserInfo;
import org.json.JSONException;
import org.json.JSONObject;
import org.webrtc.Logging;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.lang.reflect.Method;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.regex.Pattern;

/**
 * The one and only Activity that the Jitsi Meet app needs. The
 * {@code Activity} is launched in {@code singleTask} mode, so it will be
 * created upon application initialization and there will be a single instance
 * of it. Further attempts at launching the application once it was already
 * launched will result in {@link MainActivity#onNewIntent(Intent)} being called.
 */
public class MainActivity extends JitsiMeetActivity {
    /**
     * The request code identifying requests for the permission to draw on top
     * of other apps. The value must be 16-bit and is arbitrarily chosen here.
     */
    private static final int OVERLAY_PERMISSION_REQUEST_CODE
        = (int) (Math.random() * Short.MAX_VALUE);

    /**
     * ServerURL configuration key for restriction configuration using {@link android.content.RestrictionsManager}
     */
    public static final String RESTRICTION_SERVER_URL = "SERVER_URL";

    /**
     * Path of the public join-link resolution endpoint of the JMP backend,
     * see jmp-api {@code JoinController}.
     */
    private static final String JOIN_API_PATH = "/api/v1/join/";

    /**
     * Path of the instant-guest-room resolution endpoint of the JMP backend,
     * see jmp-api {@code JoinController.resolveRoom}.
     */
    private static final String JOIN_API_ROOM_PATH = "/api/v1/join/room/";

    /**
     * Shape of an instant guest room name: the platform prefix plus the 8 random
     * lower-case alphanumerics invented by the backend. Such rooms are not stored
     * anywhere, so they resolve through the dedicated room endpoint that mints a
     * fresh guest token, instead of the link lookup by slug — the same rule the
     * web client applies on its join page.
     */
    private static final Pattern INSTANT_ROOM_PATTERN = Pattern.compile("vks-[0-9a-z]{8}");

    /**
     * Path prefix of a shareable JMP join link ({@code https://host/j/<slug>}),
     * see {@code JitsiLinkBuilder.JOIN_PATH}.
     */
    private static final String JOIN_LINK_PREFIX = "j";

    /**
     * Join decision that carries a ready-to-open Jitsi room URL.
     */
    private static final String DECISION_REDIRECT = "REDIRECT";

    /**
     * Connect and read timeout of the join-link resolution request, in milliseconds.
     */
    private static final int JOIN_API_TIMEOUT_MS = 10_000;

    /**
     * Broadcast receiver for restrictions handling
     */
    private BroadcastReceiver broadcastReceiver;

    /**
     * Flag if configuration is provided by RestrictionManager
     */
    private boolean configurationByRestrictions = false;

    /**
     * Default URL as could be obtained from RestrictionManager
     */
    private String defaultURL;

    /**
     * Single background thread that exchanges join links for room URLs.
     */
    private ExecutorService joinLinkExecutor;

    /**
     * Whether a conference is currently running; used to decide where a failed
     * join link should leave the user.
     */
    private boolean inConference;

    // JitsiMeetActivity overrides
    //

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        JitsiMeet.showSplashScreen(this);

        WebRTCModuleOptions options = WebRTCModuleOptions.getInstance();
        options.loggingSeverity = Logging.Severity.LS_ERROR;

        super.onCreate(null);
    }

    @Override
    protected boolean extraInitialize() {
        Log.d(this.getClass().getSimpleName(), "LIBRE_BUILD="+BuildConfig.LIBRE_BUILD);

        // Setup Crashlytics and Firebase Dynamic Links
        // Here we are using reflection since it may have been disabled at compile time.
        try {
            Class<?> cls = Class.forName("org.jitsi.meet.GoogleServicesHelper");
            Method m = cls.getMethod("initialize", JitsiMeetActivity.class);
            m.invoke(null, this);
        } catch (Exception e) {
            // Ignore any error, the module is not compiled when LIBRE_BUILD is enabled.
        }

        // In Debug builds React needs permission to write over other apps in
        // order to display the warning and error overlays.
        if (BuildConfig.DEBUG) {
            if (!Settings.canDrawOverlays(this)) {
                Intent intent
                    = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + getPackageName()));

                startActivityForResult(intent, OVERLAY_PERMISSION_REQUEST_CODE);

                return true;
            }
        }

        return false;
    }

    @Override
    protected void initialize() {
        broadcastReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                // As new restrictions including server URL are received,
                // conference should be restarted with new configuration.
                leave();
                recreate();
            }
        };
        registerReceiver(broadcastReceiver,
            new IntentFilter(Intent.ACTION_APPLICATION_RESTRICTIONS_CHANGED));

        resolveRestrictions();
        setJitsiMeetConferenceDefaultOptions();

        // VKS TV: a shared join link (https://host/j/<slug>) carries no room
        // address. It must be exchanged for a short-lived Jitsi room URL through
        // the JMP API, so the SDK join is skipped for such intents.
        Uri joinLink = getJoinLink(getIntent());
        if (joinLink != null) {
            resolveJoinLink(joinLink);
            return;
        }

        super.initialize();
    }

    @Override
    public void onDestroy() {
        if (broadcastReceiver != null) {
            unregisterReceiver(broadcastReceiver);
            broadcastReceiver = null;
        }

        if (joinLinkExecutor != null) {
            joinLinkExecutor.shutdownNow();
            joinLinkExecutor = null;
        }

        super.onDestroy();
    }

    /**
     * Join links received while the activity is already running are resolved the
     * same way as the cold start ones. The base implementation is deliberately
     * bypassed: it would turn the raw {@code /j/<slug>} address into a room name.
     */
    @Override
    public void onNewIntent(Intent intent) {
        Uri joinLink = getJoinLink(intent);
        if (joinLink != null) {
            resolveJoinLink(joinLink);
            return;
        }

        super.onNewIntent(intent);
    }

    @Override
    protected void onConferenceJoined(HashMap<String, Object> extraData) {
        inConference = true;
        super.onConferenceJoined(extraData);
    }

    @Override
    protected void onConferenceTerminated(HashMap<String, Object> extraData) {
        inConference = false;
        super.onConferenceTerminated(extraData);
    }

    private void setJitsiMeetConferenceDefaultOptions() {

        // Set default options
        JitsiMeetConferenceOptions defaultOptions
            = new JitsiMeetConferenceOptions.Builder()
            .setServerURL(buildURL(defaultURL))
            .setFeatureFlag("welcomepage.enabled", true)
            .setFeatureFlag("server-url-change.enabled", !configurationByRestrictions)
            // VKS TV: the platform provides conference functionality only, so the
            // device calendar integration is not part of the product and its
            // welcome page tab is hidden.
            .setFeatureFlag("calendar.enabled", false)
            .build();
        JitsiMeet.setDefaultConferenceOptions(defaultOptions);
    }

    private void resolveRestrictions() {
        RestrictionsManager manager =
            (RestrictionsManager) getSystemService(Context.RESTRICTIONS_SERVICE);
        Bundle restrictions = manager.getApplicationRestrictions();
        Collection<RestrictionEntry> entries = manager.getManifestRestrictions(
            getApplicationContext().getPackageName());
        for (RestrictionEntry restrictionEntry : entries) {
            String key = restrictionEntry.getKey();
            if (RESTRICTION_SERVER_URL.equals(key)) {
                // If restrictions are passed to the application.
                if (restrictions != null &&
                    restrictions.containsKey(RESTRICTION_SERVER_URL)) {
                    defaultURL = restrictions.getString(RESTRICTION_SERVER_URL);
                    configurationByRestrictions = true;
                // Otherwise use default URL from app-restrictions.xml.
                } else {
                    defaultURL = restrictionEntry.getSelectedString();
                    configurationByRestrictions = false;
                }
            }
        }
    }

    // Activity lifecycle method overrides
    //

    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == OVERLAY_PERMISSION_REQUEST_CODE) {
            if (Settings.canDrawOverlays(this)) {
                initialize();
                return;
            }

            throw new RuntimeException("Overlay permission is required when running in Debug mode.");
        }

        super.onActivityResult(requestCode, resultCode, data);
    }

    // ReactAndroid/src/main/java/com/facebook/react/ReactActivity.java
    @Override
    public boolean onKeyUp(int keyCode, KeyEvent event) {
        if (BuildConfig.DEBUG && keyCode == KeyEvent.KEYCODE_MENU) {
            JitsiMeet.showDevOptions();
            return true;
        }

        return super.onKeyUp(keyCode, event);
    }

    @Override
    public void onPictureInPictureModeChanged(boolean isInPictureInPictureMode) {
        super.onPictureInPictureModeChanged(isInPictureInPictureMode);

        Log.d(TAG, "Is in picture-in-picture mode: " + isInPictureInPictureMode);
    }

    // Helper methods
    //

    /**
     * Extracts a JMP join link from an intent, if the intent carries one.
     *
     * <p>A join link is a shareable, credential-free address of the shape
     * {@code https://host/j/<slug>}; the conference behind it can only be joined
     * after the link is resolved through the API.
     */
    private @Nullable Uri getJoinLink(@Nullable Intent intent) {
        if (intent == null || !Intent.ACTION_VIEW.equals(intent.getAction())) {
            return null;
        }

        Uri uri = intent.getData();
        if (uri == null) {
            return null;
        }

        String scheme = uri.getScheme();
        if (!"https".equals(scheme) && !"http".equals(scheme)) {
            return null;
        }

        List<String> segments = uri.getPathSegments();
        if (segments.size() != 2 || !JOIN_LINK_PREFIX.equals(segments.get(0))) {
            return null;
        }

        return uri;
    }

    /**
     * Exchanges a join link for a room URL on a background thread, then joins the
     * conference on the main one.
     */
    private void resolveJoinLink(@NonNull Uri joinLink) {
        if (joinLinkExecutor == null) {
            joinLinkExecutor = Executors.newSingleThreadExecutor();
        }

        final String slug = joinLink.getPathSegments().get(1);
        final String apiPath = INSTANT_ROOM_PATTERN.matcher(slug).matches()
            ? JOIN_API_ROOM_PATH
            : JOIN_API_PATH;
        final String requestUrl = joinLink.getScheme() + "://" + joinLink.getAuthority()
            + apiPath + Uri.encode(slug);

        joinLinkExecutor.execute(() -> {
            String responseBody = null;
            try {
                responseBody = fetchJoinResponse(requestUrl);
            } catch (Exception e) {
                Log.w(TAG, "Failed to resolve the join link " + requestUrl, e);
            }

            final String result = responseBody;
            runOnUiThread(() -> onJoinLinkResolved(result));
        });
    }

    /**
     * Issues the anonymous GET request that asks the JMP backend for the room URL
     * behind a join link.
     */
    private static String fetchJoinResponse(String requestUrl) throws IOException {
        HttpURLConnection connection = (HttpURLConnection) new URL(requestUrl).openConnection();
        try {
            connection.setRequestMethod("GET");
            connection.setConnectTimeout(JOIN_API_TIMEOUT_MS);
            connection.setReadTimeout(JOIN_API_TIMEOUT_MS);
            connection.setRequestProperty("Accept", "application/json");

            int status = connection.getResponseCode();
            if (status != HttpURLConnection.HTTP_OK) {
                throw new IOException("The join API responded with HTTP " + status);
            }

            try (InputStream input = connection.getInputStream()) {
                ByteArrayOutputStream buffer = new ByteArrayOutputStream();
                byte[] chunk = new byte[4096];
                int read;
                while ((read = input.read(chunk)) != -1) {
                    buffer.write(chunk, 0, read);
                }
                return buffer.toString(StandardCharsets.UTF_8.name());
            }
        } finally {
            connection.disconnect();
        }
    }

    /**
     * Handles the outcome of the join-link resolution: a {@code REDIRECT} response
     * carries the ready-to-open room URL, every other decision explains why the
     * meeting cannot be entered.
     */
    private void onJoinLinkResolved(@Nullable String responseBody) {
        if (responseBody != null) {
            try {
                JSONObject response = new JSONObject(responseBody);
                if (DECISION_REDIRECT.equals(response.optString("decision"))) {
                    joinResolvedRoom(
                        response.isNull("roomUrl") ? null : response.optString("roomUrl"),
                        response.isNull("displayName") ? null : response.optString("displayName"));
                    return;
                }

                showJoinError(joinErrorMessage(response.optString("decision")));
            } catch (JSONException e) {
                Log.w(TAG, "Malformed join response", e);
                showJoinError(R.string.join_link_failed);
            }
        } else {
            showJoinError(R.string.join_link_failed);
        }

        // The link could not be opened: keep the user in the conference if one is
        // running, otherwise fall back to the conference start screen.
        if (!inConference) {
            joinWelcomePage();
        }
    }

    /**
     * Joins the room URL minted by the backend, carrying the display name of the
     * visitor whenever the backend recognised one.
     */
    private void joinResolvedRoom(@Nullable String roomUrl, @Nullable String displayName) {
        if (roomUrl == null || roomUrl.isEmpty()) {
            showJoinError(R.string.join_link_failed);
            if (!inConference) {
                joinWelcomePage();
            }
            return;
        }

        JitsiMeetConferenceOptions.Builder builder
            = new JitsiMeetConferenceOptions.Builder().setRoom(roomUrl);
        if (displayName != null && !displayName.isEmpty()) {
            JitsiMeetUserInfo userInfo = new JitsiMeetUserInfo();
            userInfo.setDisplayName(displayName);
            builder.setUserInfo(userInfo);
        }

        join(builder.build());
    }

    private static int joinErrorMessage(String decision) {
        switch (decision) {
            case "LOGIN":
                return R.string.join_link_login_required;
            case "ENDED":
                return R.string.join_link_ended;
            case "DENIED":
                return R.string.join_link_denied;
            default:
                return R.string.join_link_not_found;
        }
    }

    private void showJoinError(int messageResId) {
        Toast.makeText(this, messageResId, Toast.LENGTH_LONG).show();
    }

    /**
     * Opens the conference start screen: joining without a room asks the app to
     * display its welcome page.
     */
    private void joinWelcomePage() {
        join(new JitsiMeetConferenceOptions.Builder().build());
    }

    private @Nullable URL buildURL(String urlStr) {
        try {
            return new URL(urlStr);
        } catch (Exception e) {
            return null;
        }
    }
}
