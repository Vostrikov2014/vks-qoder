// @ts-expect-error
import jwtDecode from 'jwt-decode';

import { getBackendSafeRoomName } from '../util/uri';

import logger from './logger';

/**
 * Key under which the token of the room the current tab joined is kept in the
 * browser session storage.
 */
const STORAGE_KEY = 'jitsi.jwt';

/**
 * Key under which the platform share address of the room the current tab opened is
 * kept in the browser session storage.
 */
const SHARE_URL_STORAGE_KEY = 'jitsi.shareUrl';

/**
 * The persisted token together with the room it gives access to.
 */
interface IStoredToken {
    jwt: string;
    room: string;
}

/**
 * The persisted share address together with the room it belongs to.
 */
interface IStoredShareUrl {
    room: string;
    shareUrl: string;
}

/**
 * Remembers the token of the room the user is about to join.
 *
 * <p>The application strips the token from the address bar as soon as the
 * connection is established (see {@code features/app/middleware.ts}), so a copy
 * has to outlive the URL. Without it reloading the room page would open an
 * anonymous connection, which a JWT-authenticated Prosody refuses.
 *
 * @param {string} jwt - The token parsed from the room URL.
 * @param {string|undefined} room - The room the token gives access to.
 * @returns {void}
 */
export function storeJWT(jwt: string, room?: string) {
    const backendSafeRoom = getBackendSafeRoomName(room);

    if (!backendSafeRoom) {
        return;
    }

    try {
        const storedToken: IStoredToken = { jwt,
            room: backendSafeRoom };

        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storedToken));
    } catch (e) {
        logger.error('Unable to keep the JWT for this tab', e);
    }
}

/**
 * Returns the token a previous visit to the given room was made with, if any.
 *
 * <p>Only a token of the very same room is eligible: a room opened without a
 * token in its URL can never borrow the token of another room. An expired token
 * is dropped, since reusing it would only produce a failed connection.
 *
 * @param {string|undefined} room - The room the user is opening.
 * @returns {string|undefined} The token to reuse or {@code undefined}.
 */
export function restoreJWT(room?: string): string | undefined {
    const backendSafeRoom = getBackendSafeRoomName(room);

    if (!backendSafeRoom) {
        return undefined;
    }

    let storedToken: IStoredToken | undefined;

    try {
        const stored = sessionStorage.getItem(STORAGE_KEY);

        storedToken = stored ? JSON.parse(stored) : undefined;
    } catch (e) {
        return undefined;
    }

    if (!storedToken || typeof storedToken.jwt !== 'string' || storedToken.room !== backendSafeRoom) {
        return undefined;
    }

    if (_isExpired(storedToken.jwt)) {
        clearJWT();

        return undefined;
    }

    return storedToken.jwt;
}

/**
 * Forgets the token kept for this tab, e.g. when the user logs out.
 *
 * @returns {void}
 */
export function clearJWT() {
    try {
        sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {
        // Nothing to do: without sessionStorage there is nothing stored either.
    }
}

/**
 * Remembers the platform share address the room was opened with.
 *
 * <p>The address travels as a config hash override, and the hash is stripped from the
 * address bar together with the token (see {@code features/app/middleware.ts}). Without
 * a copy of its own the invite dialog would fall back to the bare room URL after a
 * reload, and a guest opening that URL would be refused by Prosody.
 *
 * @param {string} shareUrl - The stable join address of the room.
 * @param {string|undefined} room - The room the address belongs to.
 * @returns {void}
 */
export function storeShareUrl(shareUrl: string, room?: string) {
    const backendSafeRoom = getBackendSafeRoomName(room);

    if (!backendSafeRoom || !shareUrl) {
        return;
    }

    try {
        const storedShareUrl: IStoredShareUrl = { room: backendSafeRoom,
            shareUrl };

        sessionStorage.setItem(SHARE_URL_STORAGE_KEY, JSON.stringify(storedShareUrl));
    } catch (e) {
        logger.error('Unable to keep the share URL for this tab', e);
    }
}

/**
 * Returns the share address a previous visit to the given room was opened with, if any.
 *
 * <p>Mirrors {@link restoreJWT}: only an address of the very same room is eligible, so
 * a room opened without one can never borrow the address of another room.
 *
 * @param {string|undefined} room - The room the user is opening.
 * @returns {string|undefined} The share address to reuse or {@code undefined}.
 */
export function restoreShareUrl(room?: string): string | undefined {
    const backendSafeRoom = getBackendSafeRoomName(room);

    if (!backendSafeRoom) {
        return undefined;
    }

    let storedShareUrl: IStoredShareUrl | undefined;

    try {
        const stored = sessionStorage.getItem(SHARE_URL_STORAGE_KEY);

        storedShareUrl = stored ? JSON.parse(stored) : undefined;
    } catch (e) {
        return undefined;
    }

    if (!storedShareUrl
            || typeof storedShareUrl.shareUrl !== 'string'
            || storedShareUrl.room !== backendSafeRoom) {
        return undefined;
    }

    return storedShareUrl.shareUrl;
}

/**
 * Tells whether the token is past its expiry. The signature is intentionally not
 * verified here: the check only avoids reusing a token the server would reject
 * anyway.
 *
 * @param {string} jwt - The token to check.
 * @returns {boolean}
 * @private
 */
function _isExpired(jwt: string): boolean {
    try {
        const { exp } = jwtDecode(jwt);

        return typeof exp === 'number' && exp * 1000 <= Date.now();
    } catch (e) {
        // An unreadable token is of no use.
        return true;
    }
}
