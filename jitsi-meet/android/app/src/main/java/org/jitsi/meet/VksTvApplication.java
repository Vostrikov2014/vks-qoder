/*
 * Copyright @ 2024-present VKS TV
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

import android.app.Application;

import com.facebook.react.modules.network.OkHttpClientProvider;

import java.util.concurrent.TimeUnit;

/**
 * Application entry point of VKS TV.
 *
 * <p>Configures the shared React Native network client so that a host with
 * several address records stays reachable when one of them is down.
 */
public class VksTvApplication extends Application {

    /**
     * Connect timeout for a single address of a host, in seconds.
     */
    private static final int CONNECT_TIMEOUT_SECONDS = 10;

    @Override
    public void onCreate() {
        super.onCreate();

        // VKS TV: the shared React Native client connects with a timeout of
        // zero, which means "wait forever". A conference host may publish
        // several A records; while the socket to a dead address never fails,
        // OkHttp has no reason to try the remaining healthy address, so the
        // conference never starts. A finite per-address timeout restores the
        // address failover that a stock TCP stack provides on its own.
        OkHttpClientProvider.setOkHttpClientFactory(() ->
            OkHttpClientProvider.createClientBuilder(this)
                .connectTimeout(CONNECT_TIMEOUT_SECONDS, TimeUnit.SECONDS)
                .build());
    }
}
