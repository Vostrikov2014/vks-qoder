import React, { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { makeStyles } from 'tss-react/mui';

import { IReduxState } from '../../../app/types';
import { isMobileBrowser } from '../../../base/environment/utils';
import { getLocalParticipant, isLocalParticipantModerator } from '../../../base/participants/functions';
import ContextMenu from '../../../base/ui/components/web/ContextMenu';
import {
    getVerticalViewMaxWidth,
    isFilmstripDisabled,
    isFilmstripVisible
} from '../../../filmstrip/functions.web';
import { isReactionsButtonEnabled, shouldDisplayReactionsButtons } from '../../../reactions/functions.web';
import { isCCTabEnabled } from '../../../subtitles/functions.any';
import { isTranscribing } from '../../../transcribing/functions';
import { LAYOUTS } from '../../../video-layout/constants';
import { getCurrentLayout } from '../../../video-layout/functions.web';
import {
    setHangupMenuVisible,
    setOverflowMenuVisible,
    setToolbarHovered,
    setToolboxVisible
} from '../../actions.web';
import {
    getJwtDisabledButtons,
    getVisibleButtons,
    getVisibleButtonsForReducedUI,
    isButtonEnabled,
    isToolboxVisible
} from '../../functions.web';
import { useKeyboardShortcuts, useToolboxButtons } from '../../hooks.web';
import { IToolboxButton } from '../../types';
import HangupButton from '../HangupButton';

import { EndConferenceButton } from './EndConferenceButton';
import HangupMenuButton from './HangupMenuButton';
import { LeaveConferenceButton } from './LeaveConferenceButton';
import OverflowMenuButton from './OverflowMenuButton';
import Separator from './Separator';

/**
 * The type of the React {@code Component} props of {@link Toolbox}.
 */
interface IProps {

    /**
     * Optional toolbar background color passed as a prop.
     */
    toolbarBackgroundColor?: string;

    /**
     * Explicitly passed array with the buttons which this Toolbox should display.
     */
    toolbarButtons?: Array<string>;
}

const useStyles = makeStyles()(() => {
    return {
        hangupMenu: {
            position: 'relative',
            right: 'auto',
            display: 'flex',
            flexDirection: 'column',
            rowGap: '8px',
            margin: 0,
            padding: '16px',
            marginBottom: '8px'
        }
    };
});

/**
 * Main toolbar buttons pinned to the right corner of the videospace instead
 * of sitting in the centered button group. The array order defines the
 * display order from left to right.
 */
const RIGHT_CORNER_BUTTON_KEYS = [ 'participants-pane', 'chat' ];

/**
 * Toolbar buttons pinned to the left corner of the videospace instead of
 * sitting in the centered button group. Unlike the right corner keys, these
 * may also come from the overflow menu (fullscreen): such buttons are moved
 * out of the "More actions" menu into this group.
 */
const LEFT_CORNER_BUTTON_KEYS = [ 'tileview', 'fullscreen' ];

/**
 * All toolbar buttons pinned to the corners of the videospace on desktop.
 * In the mobile layout they are moved into the "More actions" menu.
 */
const CORNER_BUTTON_KEYS = [ ...RIGHT_CORNER_BUTTON_KEYS, ...LEFT_CORNER_BUTTON_KEYS ];

/**
 * Toolbar buttons moved to the top of the "More actions" menu in the mobile
 * layout: the participant profile (showing the display name) comes first,
 * followed by the right corner buttons (participants, chat).
 */
const TOP_OVERFLOW_BUTTON_KEYS = [ 'profile', ...RIGHT_CORNER_BUTTON_KEYS ];

/**
 * A component that renders the main toolbar.
 *
 * @param {IProps} props - The props of the component.
 * @returns {ReactElement}
 */
export default function Toolbox({
    toolbarButtons,
    toolbarBackgroundColor: toolbarBackgroundColorProp
}: IProps) {
    const { classes, cx } = useStyles();
    const { t } = useTranslation();
    const dispatch = useDispatch();
    const _toolboxRef = useRef<HTMLDivElement>(null);

    const conference = useSelector((state: IReduxState) => state['features/base/conference'].conference);
    const isNarrowLayout = useSelector((state: IReduxState) => state['features/base/responsive-ui'].isNarrowLayout);
    const videoSpaceWidth = useSelector((state: IReduxState) => state['features/base/responsive-ui'].videoSpaceWidth);
    const currentLayout = useSelector(getCurrentLayout);
    const filmstripVisible = useSelector(isFilmstripVisible);
    const filmstripDisabled = useSelector(isFilmstripDisabled);
    const filmstripResizing = useSelector((state: IReduxState) => state['features/filmstrip'].isResizing);
    const verticalViewMaxWidth = useSelector(getVerticalViewMaxWidth);
    const isModerator = useSelector(isLocalParticipantModerator);
    const customToolbarButtons = useSelector((state: IReduxState) => state['features/base/config'].customToolbarButtons);
    const iAmRecorder = useSelector((state: IReduxState) => state['features/base/config'].iAmRecorder);
    const iAmSipGateway = useSelector((state: IReduxState) => state['features/base/config'].iAmSipGateway);
    const overflowDrawer = useSelector((state: IReduxState) => state['features/toolbox'].overflowDrawer);
    const shiftUp = useSelector((state: IReduxState) => state['features/toolbox'].shiftUp);
    const overflowMenuVisible = useSelector((state: IReduxState) => state['features/toolbox'].overflowMenuVisible);
    const hangupMenuVisible = useSelector((state: IReduxState) => state['features/toolbox'].hangupMenuVisible);
    const buttonsWithNotifyClick
        = useSelector((state: IReduxState) => state['features/toolbox'].buttonsWithNotifyClick);
    const reduxToolbarButtons = useSelector((state: IReduxState) => state['features/toolbox'].toolbarButtons);
    const toolbarButtonsToUse = toolbarButtons || reduxToolbarButtons;
    const isDialogVisible = useSelector((state: IReduxState) => Boolean(state['features/base/dialog'].component));
    const localParticipant = useSelector(getLocalParticipant);
    const transcribing = useSelector(isTranscribing);
    const _isCCTabEnabled = useSelector(isCCTabEnabled);
    // Read toolbar background color from config (if provided) or from props.
    const toolbarBackgroundColorFromConfig = useSelector((state: IReduxState) =>
        state['features/base/config'].toolbarConfig?.backgroundColor);
    const toolbarBackgroundColor = toolbarBackgroundColorProp || toolbarBackgroundColorFromConfig;
    // Do not convert to selector, it returns new array and will cause re-rendering of toolbox on every action.
    const jwtDisabledButtons = getJwtDisabledButtons(transcribing, _isCCTabEnabled, localParticipant?.features);

    const reactionsButtonEnabled = useSelector(isReactionsButtonEnabled);
    const _shouldDisplayReactionsButtons = useSelector(shouldDisplayReactionsButtons);
    const toolbarVisible = useSelector(isToolboxVisible);
    const mainToolbarButtonsThresholds
        = useSelector((state: IReduxState) => state['features/toolbox'].mainToolbarButtonsThresholds);
    const { reducedUImainToolbarButtons } = useSelector((state: IReduxState) => state['features/base/config']);
    const reducedUI = useSelector((state: IReduxState) => state['features/base/responsive-ui'].reducedUI);
    const allButtons = useToolboxButtons(customToolbarButtons);
    const isMobile = isMobileBrowser();
    // The mobile layout (mobile browser or a narrow window): the corner
    // buttons are moved into the "More actions" menu instead of being pinned
    // to the corners of the videospace.
    const isMobileLayout = isMobile || isNarrowLayout;
    const endConferenceSupported = Boolean(conference?.isEndConferenceSupported() && isModerator);

    // The main filmstrip of the vertical filmstrip layouts is a drawer docked
    // to the right edge of the videospace (the videoconference page is its
    // containing block): it slides in by animating `right` from a negative
    // offset to 0, floating over the videospace on the way in. This holds
    // next to the open chat or participants panel as well, since the panels
    // live outside of the page. To keep the chat and participants buttons
    // clear of the thumbnails they are offset to the left by the width of the
    // open drawer.
    const isFilmstripDrawerLayout = currentLayout === LAYOUTS.VERTICAL_FILMSTRIP_VIEW
        || currentLayout === LAYOUTS.STAGE_FILMSTRIP_VIEW;
    const filmstripDrawerOffset = isFilmstripDrawerLayout && filmstripVisible && !filmstripDisabled
        ? verticalViewMaxWidth
        : 0;

    // The corner buttons ride along with the filmstrip drawer, so they use the
    // same animation as the filmstrip itself (it also slides `right` for 1s).
    // While the resize handle is being dragged the buttons follow instantly.
    const rightCornerButtonsTransition = filmstripResizing ? 'none' : 'right 1s';

    useKeyboardShortcuts(toolbarButtonsToUse);

    useEffect(() => {
        if (!toolbarVisible) {
            if (document.activeElement instanceof HTMLElement
                && _toolboxRef.current?.contains(document.activeElement)) {
                document.activeElement.blur();
            }
        }
    }, [ toolbarVisible ]);

    /**
     * Sets the visibility of the hangup menu.
     *
     * @param {boolean} visible - Whether or not the hangup menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetHangupVisible = useCallback((visible: boolean) => {
        dispatch(setHangupMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, [ dispatch ]);

    /**
     * Sets the visibility of the overflow menu.
     *
     * @param {boolean} visible - Whether or not the overflow menu should be
     * displayed.
     * @private
     * @returns {void}
     */
    const onSetOverflowVisible = useCallback((visible: boolean) => {
        dispatch(setOverflowMenuVisible(visible));
        dispatch(setToolbarHovered(visible));
    }, [ dispatch ]);

    useEffect(() => {

        // On mobile web we want to keep both toolbox and hang up menu visible
        // because they depend on each other.
        if (endConferenceSupported && isMobile) {
            hangupMenuVisible && dispatch(setToolboxVisible(true));
        } else if (hangupMenuVisible && !toolbarVisible) {
            onSetHangupVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [ dispatch, hangupMenuVisible, toolbarVisible, onSetHangupVisible ]);

    useEffect(() => {
        if (overflowMenuVisible && isDialogVisible) {
            onSetOverflowVisible(false);
            dispatch(setToolbarHovered(false));
        }
    }, [ dispatch, overflowMenuVisible, isDialogVisible, onSetOverflowVisible ]);

    /**
     * Key handler for overflow/hangup menus.
     *
     * @param {KeyboardEvent} e - Esc key click to close the popup.
     * @returns {void}
     */
    const onEscKey = useCallback((e?: React.KeyboardEvent) => {
        if (e?.key === 'Escape') {
            e?.stopPropagation();
            hangupMenuVisible && dispatch(setHangupMenuVisible(false));
            overflowMenuVisible && dispatch(setOverflowMenuVisible(false));
        }
    }, [ dispatch, hangupMenuVisible, overflowMenuVisible ]);

    /**
     * Dispatches an action signaling the toolbar is not being hovered.
     *
     * @private
     * @returns {void}
     */
    const onMouseOut = useCallback(() => {
        !overflowMenuVisible && dispatch(setToolbarHovered(false));
    }, [ dispatch, overflowMenuVisible ]);

    /**
     * Dispatches an action signaling the toolbar is being hovered.
     *
     * @private
     * @returns {void}
     */
    const onMouseOver = useCallback(() => {
        dispatch(setToolbarHovered(true));
    }, [ dispatch ]);

    /**
     * Handle focus on the toolbar.
     *
     * @returns {void}
     */
    const handleFocus = useCallback(() => {
        dispatch(setToolboxVisible(true));
    }, [ dispatch ]);

    /**
     * Handle blur the toolbar..
     *
     * @returns {void}
     */
    const handleBlur = useCallback(() => {
        dispatch(setToolboxVisible(false));
    }, [ dispatch ]);

    if (iAmRecorder || iAmSipGateway) {
        return null;
    }


    const rootClassNames = `new-toolbox ${toolbarVisible ? 'visible' : ''} ${
        toolbarButtonsToUse.length ? '' : 'no-buttons'}`;

    const toolbarAccLabel = 'toolbar.accessibilityLabel.moreActionsMenu';
    const containerClassName = `toolbox-content${isMobileLayout ? ' toolbox-content-mobile' : ''}`;

    const normalUIButtons = getVisibleButtons({
        allButtons,
        buttonsWithNotifyClick,
        toolbarButtons: toolbarButtonsToUse,
        clientWidth: videoSpaceWidth,
        jwtDisabledButtons,
        mainToolbarButtonsThresholds
    });

    const reducedUIButtons = getVisibleButtonsForReducedUI({
        allButtons,
        buttonsWithNotifyClick,
        jwtDisabledButtons,
        reducedUImainToolbarButtons,
    });

    const mainMenuButtons = reducedUI
        ? reducedUIButtons.mainMenuButtons
        : normalUIButtons.mainMenuButtons;
    const allOverflowMenuButtons = reducedUI
        ? []
        : normalUIButtons.overflowMenuButtons;
    // The corner groups are only used in the desktop layout. In the mobile
    // layout the corner buttons go back to the "More actions" menu instead
    // (see `overflowMenuButtons` below).
    // Right corner buttons follow the key order above, unlike the center row
    // which keeps the order given by the toolbar thresholds.
    const rightCornerButtons: IToolboxButton[] = isMobileLayout ? [] : RIGHT_CORNER_BUTTON_KEYS
        .map(key => mainMenuButtons.find(button => button.key === key))
        .filter((button): button is IToolboxButton => button !== undefined);
    // The tileview button comes from the main row, while fullscreen usually
    // lives in the overflow menu: collect both into the left corner group.
    const leftCornerButtons: IToolboxButton[] = isMobileLayout ? [] : [
        ...mainMenuButtons.filter(({ key }) => LEFT_CORNER_BUTTON_KEYS.includes(key)),
        ...allOverflowMenuButtons.filter(({ key }) => LEFT_CORNER_BUTTON_KEYS.includes(key))
    ];
    // The mobile top overflow buttons are kept out of the center row as well
    // (with the default config they are not part of the main row anyway).
    const centerMenuButtons = mainMenuButtons.filter(({ key }) =>
        !CORNER_BUTTON_KEYS.includes(key) && !(isMobileLayout && TOP_OVERFLOW_BUTTON_KEYS.includes(key)));
    // In the mobile layout the corner buttons join the "More actions" menu
    // instead of being pinned to the corners. The top of the menu is formed
    // by `TOP_OVERFLOW_BUTTON_KEYS`: the participant profile (the display
    // name) goes first, followed by participants and chat (the desktop corner
    // order is kept). The rest of the corner buttons keep their place in the
    // overflow list or are appended to it. On desktop the left corner keys
    // are kept out of the menu, because they are displayed in the corner
    // instead.
    const overflowMenuButtons = isMobileLayout
        ? [
            ...TOP_OVERFLOW_BUTTON_KEYS
                .map(key => [ ...mainMenuButtons, ...allOverflowMenuButtons ]
                    .find(button => button.key === key))
                .filter((button): button is IToolboxButton => button !== undefined),
            ...allOverflowMenuButtons.filter(({ key }) => !TOP_OVERFLOW_BUTTON_KEYS.includes(key)),
            ...mainMenuButtons.filter(({ key }) => LEFT_CORNER_BUTTON_KEYS.includes(key))
        ]
        : allOverflowMenuButtons.filter(({ key }) => !LEFT_CORNER_BUTTON_KEYS.includes(key));
    const raiseHandInOverflowMenu = overflowMenuButtons.some(({ key }) => key === 'raisehand');
    const showReactionsInOverflowMenu = _shouldDisplayReactionsButtons
        && (
            (!reactionsButtonEnabled && (raiseHandInOverflowMenu || isNarrowLayout || isMobile))
            || overflowMenuButtons.some(({ key }) => key === 'reactions'));
    const showRaiseHandInReactionsMenu = showReactionsInOverflowMenu && raiseHandInOverflowMenu;

    return (
        <div
            className = { cx(rootClassNames, shiftUp && 'shift-up') }
            id = 'new-toolbox'
            style = { toolbarBackgroundColor ? { backgroundColor: toolbarBackgroundColor } : undefined }>
            <div className = { containerClassName }>
                {Boolean(leftCornerButtons.length) && (
                    <div className = 'toolbox-content-items toolbox-left-corner'>
                        {leftCornerButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                { ...rest }
                                buttonKey = { key }
                                key = { key } />))}
                    </div>
                )}
                <div
                    className = 'toolbox-content-wrapper'
                    onBlur = { handleBlur }
                    onFocus = { handleFocus }
                    { ...(isMobile ? {} : {
                        onMouseOut,
                        onMouseOver
                    }) }>

                    <div
                        className = 'toolbox-content-items'
                        ref = { _toolboxRef }>
                        {centerMenuButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                { ...rest }
                                buttonKey = { key }
                                key = { key } />))}

                        {Boolean(overflowMenuButtons.length) && (
                            <OverflowMenuButton
                                ariaControls = 'overflow-menu'
                                ariaLabel = { t('toolbar.accessibilityLabel.moreActionsMenu') }
                                buttons = { overflowMenuButtons.reduce<Array<IToolboxButton[]>>((acc, val) => {
                                    if (val.key === 'reactions' && showReactionsInOverflowMenu) {
                                        return acc;
                                    }

                                    if (val.key === 'raisehand' && showRaiseHandInReactionsMenu) {
                                        return acc;
                                    }

                                    if (acc.length) {
                                        const prev = acc[acc.length - 1];
                                        const group = prev[prev.length - 1].group;

                                        if (group === val.group) {
                                            prev.push(val);
                                        } else {
                                            acc.push([ val ]);
                                        }
                                    } else {
                                        acc.push([ val ]);
                                    }

                                    return acc;
                                }, []) }
                                isOpen = { overflowMenuVisible }
                                key = 'overflow-menu'
                                onToolboxEscKey = { onEscKey }
                                onVisibilityChange = { onSetOverflowVisible }
                                showRaiseHandInReactionsMenu = { showRaiseHandInReactionsMenu }
                                showReactionsMenu = { showReactionsInOverflowMenu } />
                        )}

                        {isButtonEnabled('hangup', toolbarButtonsToUse) && (
                            endConferenceSupported
                                ? <HangupMenuButton
                                    ariaControls = 'hangup-menu'
                                    ariaLabel = { t('toolbar.accessibilityLabel.hangup') }
                                    isOpen = { hangupMenuVisible }
                                    key = 'hangup-menu'
                                    notifyMode = { buttonsWithNotifyClick?.get('hangup-menu') }
                                    onVisibilityChange = { onSetHangupVisible }>
                                    <ContextMenu
                                        accessibilityLabel = { t(toolbarAccLabel) }
                                        className = { classes.hangupMenu }
                                        hidden = { false }
                                        inDrawer = { overflowDrawer }
                                        onKeyDown = { onEscKey }>
                                        <EndConferenceButton
                                            buttonKey = 'end-meeting'
                                            notifyMode = { buttonsWithNotifyClick?.get('end-meeting') } />
                                        <LeaveConferenceButton
                                            buttonKey = 'hangup'
                                            notifyMode = { buttonsWithNotifyClick?.get('hangup') } />
                                    </ContextMenu>
                                </HangupMenuButton>
                                : <HangupButton
                                    buttonKey = 'hangup'
                                    customClass = 'hangup-button'
                                    key = 'hangup-button'
                                    notifyMode = { buttonsWithNotifyClick.get('hangup') }
                                    visible = { isButtonEnabled('hangup', toolbarButtonsToUse) } />
                        )}
                    </div>
                </div>

                {Boolean(rightCornerButtons.length) && (
                    <div
                        className = 'toolbox-content-items toolbox-right-corner'
                        style = { videoSpaceWidth > 0
                            ? {
                                right: `calc(100% - ${videoSpaceWidth}px + 16px + ${filmstripDrawerOffset}px)`,
                                transition: rightCornerButtonsTransition
                            }
                            : undefined }>
                        {rightCornerButtons.map(({ Content, key, ...rest }) => Content !== Separator && (
                            <Content
                                { ...rest }
                                buttonKey = { key }
                                key = { key } />))}
                    </div>
                )}
            </div>
        </div>
    );
}
