import { DefaultTheme } from 'react-native-paper';

import { remToPixels } from './functions.any';
import { createColorTokens } from './utils';

export * from './functions.any';

/**
 * Converts all rem to pixels in an object.
 *
 * @param {Object} obj - The object to convert rem values in.
 * @returns {Object}
 */
function convertRemValues(obj: any): any {
    const converted: { [key: string]: any; } = {};

    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    Object.entries(obj).forEach(([ key, value ]) => {
        if (typeof value === 'string' && value.includes('rem')) {
            converted[key] = remToPixels(value);
        } else if (typeof value === 'object' && value !== null) {
            converted[key] = convertRemValues(value);
        } else {
            converted[key] = value;
        }
    });

    return converted;
}

/**
 * Border colors mirroring the jmp-ui dark theme: --border and --border-strong.
 * They are not part of the app palette (no token resolves to an rgba value), but
 * react-native-paper expects them for its separators.
 */
const BORDER = 'rgba(255, 255, 255, 0.10)';
const BORDER_STRONG = 'rgba(255, 255, 255, 0.16)';

/**
 * Creates a React Native Paper theme based on the app UI tokens.
 *
 * @param {Object} arg - The ui tokens.
 * @returns {Object}
 */
export function createNativeTheme({ font, colorMap, shape, spacing, typography }: any): any {
    const palette = createColorTokens(colorMap);

    return {
        ...DefaultTheme,

        // react-native-paper components read theme.colors, not the app palette. Left
        // untouched they return the light Material 3 defaults, which leak into the UI:
        // the purple primary (#6750A4) is the ripple and the label color of a Button
        // that does not set one, outlineVariant (#CAC4D0) is the color of Divider, and
        // onSurface (black) is the color of a Text without an explicit style. Mapping
        // the keys the app consumes keeps every fallback inside the palette shared with
        // the web UI.
        colors: {
            ...DefaultTheme.colors,
            onPrimary: palette.text01,
            onSurface: palette.text01,
            onSurfaceVariant: palette.text02,
            outline: BORDER_STRONG,
            outlineVariant: BORDER,
            primary: palette.action01,
            surface: palette.uiBackground
        },
        palette,
        shape,
        spacing,
        typography: {
            font,
            ...convertRemValues(typography)
        }
    };
}
