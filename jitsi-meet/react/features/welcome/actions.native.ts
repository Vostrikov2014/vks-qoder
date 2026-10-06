import { appNavigate } from '../app/actions.native';
import { IReduxState, IStore } from '../app/types';
import { parseURIString, toURLString } from '../base/util/uri';

import logger from './logger';

/**
 * REST path of the platform endpoint that creates an instant guest room, see
 * jmp-api {@code JoinController#instant}. Public on purpose: no account is
 * required to open a new conference.
 */
const _INSTANT_CONFERENCE_PATH = '/api/v1/join/instant';

/**
 * Join response decision meaning the returned address can be opened right away.
 */
const _REDIRECT_DECISION = 'REDIRECT';

/**
 * Subset of the platform join response this feature relies on, see
 * jmp-application {@code ConferenceLinkDto.JoinResponse}.
 */
interface IInstantConferenceResponse {

    /**
     * How the returned address should be treated.
     */
    decision?: string;

    /**
     * Ready-to-open Jitsi address of the new conference.
     */
    roomUrl?: string;
}

/**
 * Base URL of the platform serving the REST API.
 *
 * The API is exposed on the origin of the platform host (prod: nginx routes
 * {@code /api/} to the backend and Jitsi Meet to {@code /meet-legacy/} on one and
 * the same host), so any address of the platform reduces to that origin. The
 * deployment address carried in the config is preferred, and the location the app
 * currently navigates to is the fallback: the welcome page keeps working on a
 * stub config when the deployment one could not be fetched.
 *
 * @param {IReduxState} state - The redux state.
 * @returns {string|undefined}
 */
export function getPlatformBaseUrl(state: IReduxState): string | undefined {
    const { leaveRedirectUrl } = state['features/base/config'];
    const { locationURL } = state['features/base/connection'];

    return _toOrigin(leaveRedirectUrl)
        ?? _toOrigin(toURLString(locationURL))
        ?? undefined;
}

/**
 * Reduces a URL to the {@code protocol//host} origin it belongs to, dropping the
 * path: the platform API is never reached through the context root of a room.
 *
 * @param {string|undefined} url - The URL to take the origin of.
 * @returns {string|undefined}
 */
function _toOrigin(url?: string): string | undefined {
    const { host, protocol } = parseURIString(url ?? '') ?? {};

    return host && protocol ? `${protocol}//${host}` : undefined;
}

/**
 * Asks the platform for a brand-new guest room: the backend invents the room
 * name and signs a token that makes its creator the moderator.
 *
 * @param {string} baseUrl - Platform base URL.
 * @returns {Promise<string|undefined>} - Ready-to-open room address.
 */
async function _fetchInstantConferenceUrl(baseUrl: string): Promise<string | undefined> {
    const response = await fetch(`${baseUrl}${_INSTANT_CONFERENCE_PATH}`);

    if (!response.ok) {
        logger.error(`Failed to create an instant conference: HTTP ${response.status}`);

        return undefined;
    }

    const { decision, roomUrl }: IInstantConferenceResponse = await response.json();

    if (decision !== _REDIRECT_DECISION || !roomUrl) {
        logger.error(`Failed to create an instant conference: decision=${decision}`);

        return undefined;
    }

    return roomUrl;
}

/**
 * Creates a new instant conference on the platform and navigates the app to
 * it, mirroring the jmp-ui «Создать встречу» flow. The meeting is joined right
 * away and the creator can invite participants from inside it.
 *
 * The subject gives the meeting a human readable name in the UI. Inside a Jitsi
 * address hash every value is JSON-decoded by the client, hence the quoted
 * value, and the address already carries a config hash of its own, hence the
 * {@code &} separator.
 *
 * @param {string} subject - Human readable meeting name.
 * @returns {Function}
 */
export function createInstantConference(subject: string) {
    return async (dispatch: IStore['dispatch'], getState: IStore['getState']) => {
        const baseUrl = getPlatformBaseUrl(getState());

        if (!baseUrl) {
            logger.error('Cannot create an instant conference: platform base URL is missing.');

            return false;
        }

        logger.info(`Creating an instant conference via ${baseUrl}`);

        try {
            const roomUrl = await _fetchInstantConferenceUrl(baseUrl);

            if (!roomUrl) {
                return false;
            }

            logger.info('Instant conference created, joining the room.');

            const subjectOverride = subject
                ? `&config.subject=${encodeURIComponent(JSON.stringify(subject))}`
                : '';

            await dispatch(appNavigate(`${roomUrl}${subjectOverride}`));

            return true;
        } catch (error) {
            logger.error('Failed to create an instant conference', error);

            return false;
        }
    };
}
