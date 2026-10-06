import { StyleSheet } from 'react-native';

import { BoxModel } from '../../base/styles/components/styles/BoxModel';
import BaseTheme from '../../base/ui/components/BaseTheme.native';

export const AVATAR_SIZE = 104;

/**
 * The default color of text on the WelcomePage.
 */
const TEXT_COLOR = BaseTheme.palette.text01;

/**
 * Palette of the start screen tiles. Literal values of the jmp-ui HomePage
 * (`HomePage.css`): the web start screen keeps its own dark palette regardless
 * of the app theme, and the phone start screen mirrors it one-to-one.
 */
const TILE_BACKGROUND = '#202020'; // --lp-tile
const TILE_BACKGROUND_PRESSED = '#2E2E33'; // --lp-tile-hover
const TILE_BLUE = '#2563EB'; // --lp-blue
const TILE_BLUE_PRESSED = '#3B82F6'; // --lp-blue-hover
const TILE_INPUT_BACKGROUND = 'rgba(255, 255, 255, 0.06)';
const TILE_RADIUS = 24; // --lp-radius

/**
 * The styles of the React {@code Components} of the feature welcome including
 * {@code WelcomePage} and {@code BlankPage}.
 */
export default {

    blankPageText: {
        color: TEXT_COLOR,
        fontSize: 18
    },

    /**
     * View that is rendered when there is no welcome page.
     */
    blankPageWrapper: {
        ...StyleSheet.absoluteFillObject,
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center'
    },

    /**
     * Join input of the «Connect» tile: the jmp-ui HomePage `.meeting-input` -
     * a borderless field on a translucent white fill, unlike the bordered box
     * the app uses elsewhere. The style splits into the 'container' and
     * 'input' parts read by {@code Input}.
     */
    connectInput: {
        container: {
            width: '100%'
        },
        input: {
            backgroundColor: TILE_INPUT_BACKGROUND,
            borderColor: 'transparent',
            borderRadius: 14,
            borderWidth: 0
        }
    },

    /**
     * «Connect» tile: the dark block that carries the join form. The arrow
     * stays on top, the input and the title are pinned to the bottom, like
     * `.tile-connect` of the web start page.
     */
    connectTile: {
        backgroundColor: TILE_BACKGROUND,
        padding: BaseTheme.spacing[4]
    },

    connectTilePressed: {
        backgroundColor: TILE_BACKGROUND_PRESSED
    },

    /**
     * Title of the «Connect» tile; the web page keeps the same 2rem heading as
     * the primary tile, the compact phone tile steps it down a little.
     */
    connectTileTitle: {
        color: TEXT_COLOR,
        fontSize: 22,
        fontWeight: '700',
        lineHeight: 28,
        marginTop: BaseTheme.spacing[2]
    },

    /**
     * Error message shown when creating a conference failed: the
     * `.create-error` pill of the web start page, below the tiles.
     */
    createConferenceErrorText: {
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderColor: 'rgba(239, 68, 68, 0.4)',
        borderRadius: 14,
        borderWidth: 1,
        color: '#FCA5A5',
        fontSize: 15,
        marginTop: BaseTheme.spacing[3],
        paddingHorizontal: BaseTheme.spacing[3],
        paddingVertical: BaseTheme.spacing[2],
        textAlign: 'center'
    },

    /**
     * Primary «Create a meeting» tile: the blue block of the web start screen.
     * It takes the space the compact dark tile leaves, keeps the camera on top
     * and the title at the bottom. The minimum height keeps the tile intact on
     * short screens - the tiles block scrolls instead of squeezing it.
     */
    createTile: {
        backgroundColor: TILE_BLUE,
        flex: 1,
        minHeight: 176,
        padding: BaseTheme.spacing[4]
    },

    createTilePressed: {
        backgroundColor: TILE_BLUE_PRESSED
    },

    /**
     * Title of the «Create a meeting» tile. The web page sets 3.6rem on its
     * desktop layout and 2rem in the phone one; the phone tile follows the
     * reduced size.
     */
    createTileTitle: {
        color: TEXT_COLOR,
        fontSize: 28,
        fontWeight: '700',
        lineHeight: 34
    },

    /**
     * Container for the items in the side bar.
     */
    itemContainer: {
        flexDirection: 'column',
        paddingTop: 10
    },

    /**
     * Top-level screen style. The dark jmp-ui background is set explicitly so
     * the start screen stays dark on every navigation state.
     */
    page: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        flexDirection: 'column'
    },

    /**
     * The styles for reduced UI mode.
     */
    reducedUIContainer: {
        alignItems: 'center',
        backgroundColor: BaseTheme.palette.link01,
        flex: 1,
        justifyContent: 'center'
    },

    reducedUIText: {
        color: TEXT_COLOR,
        fontSize: 12
    },

    /**
     * The container of the label of the audio-video switch.
     */
    switchLabel: {
        paddingHorizontal: 3
    },

    /**
     * Room input style.
     */
    textInput: {
        backgroundColor: 'transparent',
        borderColor: BaseTheme.palette.ui10,
        borderRadius: 4,
        borderWidth: 1,
        color: TEXT_COLOR,
        fontSize: 23,
        height: 50,
        padding: 4,
        textAlign: 'center'
    },

    /**
     * Application title style.
     */
    title: {
        color: TEXT_COLOR,
        fontSize: 25,
        marginBottom: 2 * BoxModel.margin,
        textAlign: 'center'
    },

    insecureRoomNameWarningContainer: {
        alignItems: 'center',
        flexDirection: 'row',
        marginTop: BaseTheme.spacing[2],
        width: '100%'
    },

    insecureRoomNameWarningIcon: {
        color: BaseTheme.palette.warning02,
        fontSize: 18,
        marginRight: 8
    },

    insecureRoomNameWarningText: {
        color: BaseTheme.palette.text01,
        flex: 1
    },

    /**
     * The shared look of the start screen tiles (jmp-ui HomePage `.tile`):
     * rounded corners, a column that grows from the top-left corner.
     */
    tile: {
        alignItems: 'flex-start',
        borderRadius: TILE_RADIUS,
        padding: BaseTheme.spacing[4],
        width: '100%'
    },

    /**
     * Disabled state of a tile while its action is in flight
     * (jmp-ui HomePage `.tile:disabled`).
     */
    tileDisabled: {
        opacity: 0.7
    },

    /**
     * Glyph block of a tile. `marginBottom: auto` pushes the rest of the tile
     * content down, so the icon keeps the top of the tile.
     */
    tileIcon: {
        marginBottom: 'auto'
    },

    /**
     * The block of the action tiles, mirroring the `.cards-grid` of the web
     * start page - the same 8px (`--space-2`) gap between the tiles.
     */
    tiles: {
        flex: 1,
        gap: BaseTheme.spacing[2],
        paddingBottom: BaseTheme.spacing[3],
        paddingHorizontal: BaseTheme.spacing[3],
        paddingTop: BaseTheme.spacing[2]
    },

    /**
     * Tiles collapsed behind the settings screen of the welcome page.
     */
    tilesCollapsed: {
        flex: 0,
        height: 0,
        paddingBottom: 0,
        paddingHorizontal: 0,
        paddingTop: 0
    },

    /**
     * Scroll area of the tiles: on screens where the tiles cannot fit under
     * the brand mark, the page scrolls them instead of squeezing.
     */
    tilesScroll: {
        flex: 2
    },

    /**
     * Content of the tiles scroll area, stretched to the height of its
     * viewport, so the tiles fill the screen whenever there is room.
     */
    tilesScrollContent: {
        flexGrow: 1
    },

    /**
     * Wide (landscape / TV) screens keep the two tiles side by side, like the
     * two columns of the web start page.
     */
    tilesWide: {
        flexDirection: 'row'
    },

    /**
     * The style of the top-level container of {@code WelcomePage}.
     */
    welcomePage: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        overflow: 'hidden'
    },

    recentList: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        overflow: 'hidden'
    },

    recentListDisabled: {
        backgroundColor: BaseTheme.palette.uiBackground,
        flex: 1,
        opacity: 0.8,
        overflow: 'hidden'
    }
};
