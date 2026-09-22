#!/bin/sh
#
# JMP — Jitsi Meet web container configuration.
#
# The image is built once and runs in two contours (local and production). Everything that
# differs between them is expressed through environment variables and applied here, at
# container start, following the same idea as the official jitsi/web image (cont-init.d
# templates) but without extra dependencies: busybox sed on the two baked files.
#
# The patterns this script rewrites are single lines with unique keys in the sources
# (config.js: domain/muc/disableP2P/stunServers, nginx.conf: the `set $jmp_*` lines), so
# re-running the script is idempotent — it always replaces by key, never by previous value.
#
# Recognised environment variables (defaults = local contour):
#   XMPP_DOMAIN       Prosody virtual host the client connects to        (meet.jitsi)
#   XMPP_MUC_DOMAIN   Prosody MUC component, must match `main_muc`       (muc.meet.jitsi)
#   PROSODY_URL       where this container proxies /http-bind            (http://jitsi-prosody:5280)
#   JVB_WS_URL        where this container proxies /colibri-ws/*         (http://jitsi-jvb:9090)
#   APP_PREFIX        path prefix the app is served under, e.g. /jitsi   ("")
#   DISABLE_P2P       route two-person media over the JVB (no TURN yet)  (false)
#   P2P_STUN_SERVERS  comma separated stun: urls for the p2p ICE config  (unchanged if empty)
#   LEAVE_REDIRECT_URL  platform UI address to return to after the conference
#                        (explicitly empty = stock Jitsi behaviour)

set -eu

CONFIG_JS="${CONFIG_JS:-/usr/share/nginx/html/config.js}"
NGINX_CONF="${NGINX_CONF:-/etc/nginx/conf.d/default.conf}"

XMPP_DOMAIN="${XMPP_DOMAIN:-meet.jitsi}"
XMPP_MUC_DOMAIN="${XMPP_MUC_DOMAIN:-muc.meet.jitsi}"
PROSODY_URL="${PROSODY_URL:-http://jitsi-prosody:5280}"
JVB_WS_URL="${JVB_WS_URL:-http://jitsi-jvb:9090}"
DISABLE_P2P="${DISABLE_P2P:-false}"
P2P_STUN_SERVERS="${P2P_STUN_SERVERS:-}"
LEAVE_REDIRECT_URL="${LEAVE_REDIRECT_URL-http://localhost:5173/}"
APP_PREFIX="${APP_PREFIX:-}"

# replace_by_key <file> <bre> <replacement line>
# The replacement is taken literally; values are hosts, urls and booleans, so no sed
# escaping is needed beyond protecting the delimiter.
replace_by_key() {
    _file="$1"
    _pattern="$2"
    _replacement="$3"

    if [ "$(grep -c "$_pattern" "$_file" || true)" -eq 0 ]; then
        echo "jmp-config: pattern not found in $_file: $_pattern" >&2
        exit 1
    fi

    sed -i "s|$_pattern|$_replacement|" "$_file"
}

# ---------------------------------------------------------------------------
# 1. XMPP endpoints of the client
# ---------------------------------------------------------------------------
replace_by_key "$CONFIG_JS" \
    "^ *domain: '[^']*',$" \
    "        domain: '${XMPP_DOMAIN}',"

replace_by_key "$CONFIG_JS" \
    "^ *muc: '[^']*',$" \
    "        muc: '${XMPP_MUC_DOMAIN}',"

case "${DISABLE_P2P}" in
    true|false) ;;
    *) echo "jmp-config: DISABLE_P2P must be true or false, got '${DISABLE_P2P}'" >&2; exit 1 ;;
esac

replace_by_key "$CONFIG_JS" \
    "^ *disableP2P: .*$" \
    "    disableP2P: ${DISABLE_P2P},"

if [ -n "${P2P_STUN_SERVERS}" ]; then
    # "stun:a:443,stun:b:443" -> " [ { urls: 'stun:a:443' }, { urls: 'stun:b:443' } ],"
    _servers=$(printf '%s\n' $(echo "${P2P_STUN_SERVERS}" | tr ',' ' ') | tr -d '\r' \
        | sed "/^$/d;s|\(.*\)| { urls: '\1' },|" | tr -d '\n')
    replace_by_key "$CONFIG_JS" \
        "^ *stunServers: .*$" \
        "        stunServers: [${_servers} ],"
fi

# Where to send the user after the conference ends. An empty value keeps the stock Jitsi
# behaviour, so the redirection can be disabled per contour without a rebuild.
replace_by_key "$CONFIG_JS" \
    "^ *leaveRedirectUrl: .*$" \
    "    leaveRedirectUrl: '${LEAVE_REDIRECT_URL}',"

# ---------------------------------------------------------------------------
# 2. Reverse proxy of this container
# ---------------------------------------------------------------------------
replace_by_key "$NGINX_CONF" \
    "^ *set \$jmp_prosody .*$" \
    "    set \$jmp_prosody \"${PROSODY_URL}\";"

replace_by_key "$NGINX_CONF" \
    "^ *set \$jmp_jvb .*$" \
    "    set \$jmp_jvb \"${JVB_WS_URL}\";"

# config.js builds bosh/websocket urls as `//host + subdir + 'http-bind'`, therefore subdir
# must always carry both surrounding slashes: '/' at the root, '/jitsi/' under a prefix.
# (Serving under a non-root prefix additionally requires the nginx `location` blocks to
# match that prefix; both shipped contours run at the root, so the common case is '/'.)
if [ -n "${APP_PREFIX}" ]; then
    _prefix="/$(echo "${APP_PREFIX}" | sed -e 's|^/*||' -e 's|/*$||')/"
else
    _prefix="/"
fi

replace_by_key "$NGINX_CONF" \
    "^ *set \$subdir .*$" \
    "    set \$subdir \"${_prefix}\";"

echo "jmp-config: xmpp=${XMPP_DOMAIN} muc=${XMPP_MUC_DOMAIN} prosody=${PROSODY_URL} jvb=${JVB_WS_URL} prefix='${_prefix}' p2pDisabled=${DISABLE_P2P} leaveRedirect='${LEAVE_REDIRECT_URL}'"

# A broken rewrite must not start a container that silently serves a broken conference.
if command -v nginx >/dev/null 2>&1; then
    nginx -t
fi
