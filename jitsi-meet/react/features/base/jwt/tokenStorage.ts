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
 * The persisted token together with the room it gives access to.
 */
interface IStoredToken {
    jwt: string;
    room: string;
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
