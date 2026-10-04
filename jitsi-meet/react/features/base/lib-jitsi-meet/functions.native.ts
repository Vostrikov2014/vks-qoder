// @ts-ignore
import { safeJsonParse } from '@jitsi/js-utils/json';
// @ts-ignore
import { Worklets } from 'react-native-worklets-core';

import { loadScript } from '../util/loadScript.native';

import logger from './logger';

export * from './functions.any';


/**
 * Worklet context usefull for running small tasks off the JS thread.
 */
export const workletContext = Worklets.createContext('ConfigParser');


/**
 * Loads config.js from a specific remote server.
 *
 * VKS TV: the budget is deliberately larger than the upstream ten seconds. A
 * host may publish several A records; Android's OkHttp walks them sequentially
 * with a ten second connect timeout each, so the upstream budget leaves the
 * app no room to fail over from an unreachable address to a healthy one and
 * the conference never starts. Twenty seconds still bounds the wait but lets
 * one dead address be skipped.
 *
 * @param {string} url - The URL to load.
 * @returns {Promise<Object>}
 */
export async function loadConfig(url: string): Promise<Object> {
    try {
        const configTxt = await loadScript(url, 20 * 1000, true);

        let locJson = '{}';

        try {
            const urlObj = new URL(url);

            locJson = JSON.stringify({
                host: urlObj.host,
                hostname: urlObj.hostname,
                protocol: urlObj.protocol,
                origin: urlObj.origin,
                href: urlObj.href,
                pathname: urlObj.pathname
            });
        } catch (e) {
            // Ignore URL parsing errors
        }

        const parseConfigAsync = workletContext.createRunAsync(function parseConfig(
            configText: string,
            locData: string
        ): string {
            'worklet';
            try {
                // Used IIFE wrapper to capture config object from config.js with polyfilled location
                const configObj = eval(
                    '(function(){\n'
                    + 'var location = (typeof globalThis !== "undefined" && globalThis.location) || ' + locData + ';\n'
                    + configText
                    + '\n; return (typeof config !== "undefined" ? config : globalThis.config); })()'
                );

                if (configObj == void 0) {
                    return 'Worklet_Error: config is undefined after eval()';
                }

                if (typeof configObj !== 'object') {
                    return 'Worklet_Error: config is not an object';
                }

                return JSON.stringify(configObj);
            } catch (err) {
                return 'Worklet_Error:' + ((err as Error)?.message ?? String(err));
            }
        });

        const workletConfig = await parseConfigAsync(configTxt, locJson);

        if (typeof workletConfig !== 'string') {
            throw new Error('Worklet error: workletConfig is not a string');
        }

        if (workletConfig.startsWith('Worklet_Error:')) {
            const msg = workletConfig.slice('Worklet_Error:'.length);

            throw new Error(`Worklet error: ${msg}`);
        }

        const config = safeJsonParse(workletConfig);

        logger.info(`Config loaded from ${url}`);

        return config;
    } catch (err) {
        logger.error(`Failed to load config from ${url}`, err);

        throw err;
    }
}
