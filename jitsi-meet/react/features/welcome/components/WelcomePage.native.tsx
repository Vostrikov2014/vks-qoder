import React from 'react';
import {
    Animated,
    NativeSyntheticEvent,
    Pressable,
    PressableStateCallbackType,
    ScrollView,
    StyleProp,
    TextInputFocusEventData,
    TextStyle,
    View,
    ViewStyle
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { connect } from 'react-redux';

import { createWelcomePageEvent } from '../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../analytics/functions';
import { getName } from '../../app/functions.native';
import { IReduxState } from '../../app/types';
import { translate } from '../../base/i18n/functions';
import Icon from '../../base/icons/components/Icon';
import { IconWarning } from '../../base/icons/svg';
import LoadingIndicator from '../../base/react/components/native/LoadingIndicator';
import Text from '../../base/react/components/native/Text';
import BaseTheme from '../../base/ui/components/BaseTheme.native';
import Input from '../../base/ui/components/native/Input';
import getUnsafeRoomText from '../../base/util/getUnsafeRoomText.native';
import WelcomePageTabs
    from '../../mobile/navigation/components/welcome/components/WelcomePageTabs';
import { createInstantConference } from '../actions.native';

import {
    IProps as AbstractProps,
    AbstractWelcomePage,
    _mapStateToProps as _abstractMapStateToProps
} from './AbstractWelcomePage';
import VksTvVideoGlyph from './VksTvVideoGlyph.native';
import styles from './styles.native';

/**
 * Size and stroke width of the camera glyph on the «Create a meeting» tile.
 * The web start page draws the very same glyph oversized and hairline-thin
 * (140px / stroke 1, 96px in its phone layout), so the phone tile keeps the
 * thin line at a slightly reduced size.
 */
const CREATE_TILE_ICON_SIZE = 88;
const CREATE_TILE_ICON_STROKE_WIDTH = 1;

/**
 * Arrow of the «Connect» tile, mirroring the lucide ArrowRight of the web
 * start page (size 52 / stroke 1.8) at the compact tile's scale.
 */
const CONNECT_TILE_ICON_SIZE = 36;
const CONNECT_TILE_ICON_STROKE_WIDTH = 1.8;

/**
 * Color of the «Connect» tile arrow: the accent purple the web start page
 * paints its connect icon with (jmp-ui HomePage `.tile-icon-arrow`).
 */
const CONNECT_TILE_ICON_COLOR = '#C26BF5';

/**
 * Minimum viewport width for the wide tiles layout of the start screen. Below
 * it the tiles are stacked in a column, above (landscape, TV) they sit side by
 * side, like the two columns of the web start page.
 */
const WIDE_TILES_MIN_WIDTH = 700;

interface IProps extends AbstractProps {

    /**
     * The width of the app viewport, used to pick the tiles layout.
     */
    _clientWidth: number;

    /**
     * Function for getting the unsafe room text.
     */
    getUnsafeRoomTextFn: Function;

    /**
     * Default prop for navigating between screen components(React Navigation).
     */
    navigation: any;
}

/**
 * Arrow of the «Connect» tile: the lucide ArrowRight of the web start page -
 * a shaft plus a head. The base icon set only ships a chevron, which reads as
 * «next» rather than «go to the meeting», so the glyph is drawn here.
 *
 * @returns {ReactElement}
 */
const ConnectArrowGlyph = () => (
    <Svg
        height = { CONNECT_TILE_ICON_SIZE }
        viewBox = '0 0 24 24'
        width = { CONNECT_TILE_ICON_SIZE }>
        <Path
            d = 'M5,12 L19,12 M12,5 L19,12 L12,19'
            fill = 'none'
            stroke = { CONNECT_TILE_ICON_COLOR }
            strokeLinecap = 'round'
            strokeLinejoin = 'round'
            strokeWidth = { CONNECT_TILE_ICON_STROKE_WIDTH } />
    </Svg>
);

/**
 * The native container rendering the welcome page: the start screen of the
 * app, made of action tiles that mirror the jmp-ui HomePage - a primary blue
 * tile that creates a new video meeting and a dark tile that joins a meeting
 * by its code or link.
 *
 * @augments AbstractWelcomePage
 */
class WelcomePage extends AbstractWelcomePage<IProps> {
    _onFieldBlur: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;
    _onFieldFocus: (e: NativeSyntheticEvent<TextInputFocusEventData>) => void;

    /**
     * Constructor of the Component.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state._fieldFocused = false;

        this.state.isSettingsScreenFocused = false;

        this.state.roomNameInputAnimation = new Animated.Value(1);

        // Bind event handlers so they are only bound once per instance.
        this._getConnectTileStyle = this._getConnectTileStyle.bind(this);
        this._getCreateTileStyle = this._getCreateTileStyle.bind(this);
        this._onConnectPress = this._onConnectPress.bind(this);
        this._onCreateConference = this._onCreateConference.bind(this);
        this._onFieldFocusChange = this._onFieldFocusChange.bind(this);

        // Specially bind functions to avoid function definition on render.
        this._onFieldBlur = this._onFieldFocusChange.bind(this, false);
        this._onFieldFocus = this._onFieldFocusChange.bind(this, true);
        this._onSettingsScreenFocused = this._onSettingsScreenFocused.bind(this);
    }

    /**
     * Implements React's {@link Component#componentDidMount()}. Invoked
     * immediately after mounting occurs.
     *
     * @inheritdoc
     * @returns {void}
     */
    override componentDidMount() {
        super.componentDidMount();

        const {
            navigation,
            t
        } = this.props;

        navigation.setOptions({
            headerTitle: t('welcomepage.headerTitle')
        });

        navigation.addListener('blur', () => {
            // Leaving the start screen drops whatever was typed: the join
            // field is a one-shot entry point, not stored state.
            this.setState({
                insecureRoomName: false,
                room: ''
            });
        });
    }

    /**
     * Implements React's {@link Component#render()}. Renders a prompt for
     * entering a room name.
     *
     * @inheritdoc
     * @returns {ReactElement}
     */
    override render() {
        // We want to have the welcome page support the reduced UI layout,
        // but we ran into serious issues enabling it so we disable it
        // until we have a proper fix in place. We leave the code here though, because
        // this part should be fine when the bug is fixed.
        //
        // NOTE: when re-enabling, don't forget to uncomment the respective _mapStateToProps line too

        /*
        const { _reducedUI } = this.props;

        if (_reducedUI) {
            return this._renderReducedUI();
        }
        */

        return this._renderFullUI();
    }

    /**
     * Renders the insecure room name warning.
     *
     * @inheritdoc
     */
    _doRenderInsecureRoomNameWarning() {
        return (
            <View style = { styles.insecureRoomNameWarningContainer as ViewStyle }>
                <Icon
                    src = { IconWarning }
                    style = { styles.insecureRoomNameWarningIcon } />
                <Text style = { styles.insecureRoomNameWarningText as TextStyle }>
                    { this.props.getUnsafeRoomTextFn(this.props.t) }
                </Text>
            </View>
        );
    }

    /**
     * Returns the style of the «Connect» tile: the dark tile lightens while it
     * is pressed, and only when a code or link has been typed - an empty tile
     * stays inert, like on the web start page.
     *
     * @private
     * @param {PressableStateCallbackType} state - The pressable state of the
     * tile.
     * @returns {StyleProp<ViewStyle>}
     */
    _getConnectTileStyle({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> {
        const hasRoom = Boolean(this.state.room.trim());

        return [
            styles.tile,
            styles.connectTile,
            pressed && hasRoom && styles.connectTilePressed
        ] as StyleProp<ViewStyle>;
    }

    /**
     * Returns the style of the «Create a meeting» tile: the blue tile lightens
     * while it is pressed and fades out while the conference is being created.
     *
     * @private
     * @param {PressableStateCallbackType} state - The pressable state of the
     * tile.
     * @returns {StyleProp<ViewStyle>}
     */
    _getCreateTileStyle({ pressed }: PressableStateCallbackType): StyleProp<ViewStyle> {
        const { creatingConference } = this.state;

        return [
            styles.tile,
            styles.createTile,
            pressed && !creatingConference && styles.createTilePressed,
            creatingConference && styles.tileDisabled
        ] as StyleProp<ViewStyle>;
    }

    /**
     * Handles a press on the «Connect» tile: the whole tile is the join form,
     * so a tap (outside of the input) joins - but only once a code or link has
     * been typed, exactly like the web start page, where an empty code leaves
     * the tile inert.
     *
     * @private
     * @returns {void}
     */
    _onConnectPress() {
        if (this.state.joining || !this.state.room.trim()) {
            return;
        }

        this._onJoin();
    }

    /**
     * Handles the «Create a conference» action: asks the platform for a fresh
     * instant room and joins it right away.
     *
     * @private
     * @returns {Promise<void>}
     */
    async _onCreateConference() {
        const { dispatch, t } = this.props;

        if (this.state.creatingConference) {
            return;
        }

        sendAnalytics(createWelcomePageEvent('clicked', 'createConferenceButton'));

        this.setState({
            createConferenceError: false,
            creatingConference: true
        });

        const created = await dispatch(
            createInstantConference(t('welcomepage.instantConferenceSubject')));

        if (created) {
            // The app has navigated to the new conference, so this component
            // unmounts and there is nothing left to update.
            return;
        }

        this._mounted && this.setState({
            createConferenceError: true,
            creatingConference: false
        });
    }

    /**
     * Callback for when the room field's focus changes.
     *
     * @private
     * @param {boolean} focused - The focused state of the field.
     * @returns {void}
     */
    _onFieldFocusChange(focused: boolean) {
        this.setState({
            _fieldFocused: focused
        });
    }

    /**
     * Callback for when the settings screen is focused: the brand header of
     * the welcome route is hidden and the tiles collapse, so the settings
     * screen gets the full height of the start page.
     *
     * @private
     * @param {boolean} focused - The focused state of the screen.
     * @returns {void}
     */
    _onSettingsScreenFocused(focused: boolean) {
        this.setState({
            isSettingsScreenFocused: focused
        });

        this.props.navigation.setOptions({
            headerShown: !focused
        });

        Animated.timing(
            this.state.roomNameInputAnimation,
            {
                toValue: focused ? 0 : 1,
                duration: 500,
                useNativeDriver: true
            })
            .start();
    }

    /**
     * Renders the «Connect» tile: the dark tile that joins a meeting by its
     * code or link. The whole tile is the join form, exactly like on the web
     * start page - typing into the field enables the tile, tapping it (or the
     * keyboard «go» key) joins.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderConnectTile() {
        const { t } = this.props;
        const { joining } = this.state;

        return (
            <Pressable
                accessibilityLabel = { t('welcomepage.accessibilityLabel.connect') }
                accessibilityRole = 'button'
                onPress = { this._onConnectPress }
                style = { this._getConnectTileStyle }>
                <View style = { styles.tileIcon as ViewStyle }>
                    { joining
                        ? <LoadingIndicator
                            color = { BaseTheme.palette.icon01 }
                            size = 'small' />
                        : <ConnectArrowGlyph /> }
                </View>
                <Input
                    accessibilityLabel = { t('welcomepage.enterMeetingCode') }
                    autoCapitalize = { 'none' }
                    autoFocus = { false }
                    customStyles = { styles.connectInput }
                    hideFocusedBorder = { true }
                    onBlur = { this._onFieldBlur }
                    onChange = { this._onRoomChange }
                    onFocus = { this._onFieldFocus }
                    onSubmitEditing = { this._onJoin }
                    placeholder = { t('welcomepage.enterMeetingCode') }
                    returnKeyType = { 'go' }
                    value = { this.state.room } />
                {
                    this._renderInsecureRoomNameWarning()
                }
                <Text style = { styles.connectTileTitle as TextStyle }>
                    { t('welcomepage.connect') }
                </Text>
            </Pressable>
        );
    }

    /**
     * Renders the «Create a meeting» tile: the primary blue tile that asks the
     * platform for a fresh conference and joins it in one tap, mirroring the
     * web start page's blue tile.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderCreateTile() {
        const { t } = this.props;
        const { creatingConference, joining } = this.state;

        return (
            <Pressable
                accessibilityLabel = { t('welcomepage.accessibilityLabel.createConference') }
                accessibilityRole = 'button'
                disabled = { creatingConference || joining }
                onPress = { this._onCreateConference }
                style = { this._getCreateTileStyle }>
                <View style = { styles.tileIcon as ViewStyle }>
                    { creatingConference
                        ? <LoadingIndicator
                            color = { BaseTheme.palette.icon01 }
                            size = 'large' />
                        : <VksTvVideoGlyph
                            size = { CREATE_TILE_ICON_SIZE }
                            strokeWidth = { CREATE_TILE_ICON_STROKE_WIDTH } /> }
                </View>
                <Text style = { styles.createTileTitle as TextStyle }>
                    { t('welcomepage.createConference') }
                </Text>
            </Pressable>
        );
    }

    /**
     * Renders the full welcome page.
     *
     * @returns {ReactElement}
     */
    _renderFullUI() {
        return (
            <SafeAreaView
                edges = { [ 'left', 'right' ] }
                style = { styles.page as StyleProp<ViewStyle> }>
                { this._renderTiles() }
                <View style = { styles.welcomePage as ViewStyle }>
                    <WelcomePageTabs
                        disabled = { Boolean(this.state._fieldFocused) } // @ts-ignore
                        onListContainerPress = { this._onFieldBlur }
                        onSettingsScreenFocused = { this._onSettingsScreenFocused } />
                </View>
            </SafeAreaView>
        );
    }

    /**
     * Renders the action tiles of the start screen: the primary «Create a
     * meeting» tile and the «Connect» tile. On screens that are too short for
     * both, the block scrolls instead of squeezing the tiles.
     *
     * @private
     * @returns {ReactElement}
     */
    _renderTiles() {
        const { _clientWidth, t } = this.props;
        const { createConferenceError, isSettingsScreenFocused } = this.state;

        return (
            <ScrollView
                contentContainerStyle = { styles.tilesScrollContent as StyleProp<ViewStyle> }
                keyboardDismissMode = { 'on-drag' }
                keyboardShouldPersistTaps = { 'handled' }
                showsVerticalScrollIndicator = { false }
                style = { styles.tilesScroll as StyleProp<ViewStyle> }>
                <Animated.View
                    style = { [
                        styles.tiles,
                        _clientWidth >= WIDE_TILES_MIN_WIDTH && styles.tilesWide,
                        isSettingsScreenFocused && styles.tilesCollapsed,
                        { opacity: this.state.roomNameInputAnimation }
                    ] as StyleProp<ViewStyle> }>
                    { this._renderCreateTile() }
                    { this._renderConnectTile() }
                    { createConferenceError
                        && <Text style = { styles.createConferenceErrorText as TextStyle }>
                            { t('welcomepage.createConferenceError') }
                        </Text> }
                </Animated.View>
            </ScrollView>
        );
    }

    /**
     * Renders a "reduced" version of the welcome page.
     *
     * @returns {ReactElement}
     */
    _renderReducedUI() {
        const { t } = this.props;

        return (
            <View style = { styles.reducedUIContainer as ViewStyle }>
                <Text style = { styles.reducedUIText }>
                    { t('welcomepage.reducedUIText', { app: getName() }) }
                </Text>
            </View>
        );
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {Object}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        ..._abstractMapStateToProps(state),

        _clientWidth: state['features/base/responsive-ui'].clientWidth,

        // _reducedUI: state['features/base/responsive-ui'].reducedUI
        getUnsafeRoomTextFn: (t: Function) => getUnsafeRoomText(state, t, 'welcome')
    };
}

export default translate(connect(_mapStateToProps)(WelcomePage));
