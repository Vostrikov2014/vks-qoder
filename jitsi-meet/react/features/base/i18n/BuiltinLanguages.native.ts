import i18next from 'i18next';

/**
 * The builtin languages.
 *
 * NOTE: For the Android build we only bundle Russian. English is always
 * available as the builtin default language (loaded from lang/main.json in
 * i18next.ts), so it does not need to be registered here. Any other language
 * is intentionally excluded: React Native has no HTTP backend, so only the
 * bundles registered below are usable in the app.
 */
const _LANGUAGES = {

    // Russian
    'ru': {
        main: require('../../../../lang/main-ru')
    }
};

// Register all builtin languages with the i18n library.
for (const name in _LANGUAGES) { // eslint-disable-line guard-for-in
    const { main } = _LANGUAGES[name as keyof typeof _LANGUAGES];

    i18next.addResourceBundle(
        name,
        'main',
        main,
        /* deep */ true,
        /* overwrite */ true);
}
