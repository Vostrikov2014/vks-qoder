import { Theme } from '@mui/material';
import React, { Component } from 'react';
import { WithTranslation } from 'react-i18next';
import { connect as reduxConnect } from 'react-redux';
import { withStyles } from 'tss-react/mui';

import { IReduxState, IStore } from '../../../app/types';
import { IJitsiConference } from '../../../base/conference/reducer';
import { IConfig } from '../../../base/config/configType';
import { connect } from '../../../base/connection/actions.web';
import { toJid } from '../../../base/connection/functions';
import { translate, translateToHTML } from '../../../base/i18n/functions';
import { JitsiConnectionErrors } from '../../../base/lib-jitsi-meet';
import Dialog from '../../../base/ui/components/web/Dialog';
import Input from '../../../base/ui/components/web/Input';
import {
    authenticateAndUpgradeRole,
    cancelLogin
} from '../../actions.web';
import logger from '../../logger';

const styles = (theme: Theme) => {
    return {
        // Match the rest of the app (Prejoin name field, chat input,
        // participants search): the input surface is already #2E2E33 (ui02),
        // so on hover/focus lighten it one step to #3A3A42 (ui04) instead of
        // drawing the default blue focus frame. There is no border: the frame
        // is only the box-shadow applied on :focus, which we drop here.
        authInput: {
            marginBottom: '16px',

            '& input': {
                // Explicit dark surface so the field never flashes the browser
                // default white before/behind the themed background.
                backgroundColor: theme.palette.ui02,
                color: theme.palette.text01,
                transition: 'background-color 0.2s ease',

                '&:hover': {
                    background: theme.palette.ui04
                },

                '&:focus': {
                    outline: 'none',
                    boxShadow: 'none',
                    background: theme.palette.ui04
                },

                // Chrome autofills saved credentials when the dialog opens and
                // paints the field white/yellow, ignoring the theme. Keep it
                // dark: the box-shadow fills the field, text-fill-color keeps
                // the text visible, and a huge transition delays the browser's
                // own background change off-screen.
                '&:-webkit-autofill': {
                    WebkitBoxShadow: `0 0 0 1000px ${theme.palette.ui02} inset`,
                    WebkitTextFillColor: theme.palette.text01,
                    transition: 'background-color 99999s ease-in-out 0s'
                },

                '&:-webkit-autofill:hover, &:-webkit-autofill:focus': {
                    WebkitBoxShadow: `0 0 0 1000px ${theme.palette.ui04} inset`
                }
            }
        },

        // Status/error text rendered under the fields, styled like the rest of
        // the dialog content instead of the browser default.
        message: {
            ...theme.typography.bodyShortRegular,
            color: theme.palette.text01
        }
    };
};

/**
 * The type of the React {@code Component} props of {@link LoginDialog}.
 */
interface IProps extends WithTranslation {

    /**
     * An object containing the CSS classes.
     */
    classes?: Partial<Record<keyof ReturnType<typeof styles>, string>>;

    /**
     * {@link JitsiConference} That needs authentication - will hold a valid
     * value in XMPP login + guest access mode.
     */
    _conference?: IJitsiConference;

    /**
     * The server hosts specified in the global config.
     */
    _configHosts: IConfig['hosts'];

    /**
     * Indicates if the dialog should display "connecting" status message.
     */
    _connecting: boolean;

    /**
     * The error which occurred during login/authentication.
     */
    _error: any;

    /**
     * The progress in the floating range between 0 and 1 of the authenticating
     * and upgrading the role of the local participant/user.
     */
    _progress?: number;

    /**
     * Redux store dispatch method.
     */
    dispatch: IStore['dispatch'];

    /**
     * Conference room name.
     */
    roomName: string;
}

/**
 * The type of the React {@code Component} state of {@link LoginDialog}.
 */
interface IState {

    /**
     * The user entered password for the conference.
     */
    password: string;

    /**
     * The user entered local participant name.
     */
    username: string;
}

/**
 * Component that renders the login in conference dialog.
 *
 *  @returns {React$Element<any>}
 */
class LoginDialog extends Component<IProps, IState> {
    /**
     * Initializes a new {@code LoginDialog} instance.
     *
     * @inheritdoc
     */
    constructor(props: IProps) {
        super(props);

        this.state = {
            username: '',
            password: ''
        };

        this._onCancelLogin = this._onCancelLogin.bind(this);
        this._onLogin = this._onLogin.bind(this);
        this._onUsernameChange = this._onUsernameChange.bind(this);
        this._onPasswordChange = this._onPasswordChange.bind(this);
    }

    /**
     * Called when the cancel button is clicked.
     *
     * @private
     * @returns {void}
     */
    _onCancelLogin() {
        const { dispatch } = this.props;

        dispatch(cancelLogin());
    }

    /**
     * Notifies this LoginDialog that the login button (OK) has been pressed by
     * the user.
     *
     * @private
     * @returns {void}
     */
    _onLogin() {
        const {
            _conference: conference,
            _configHosts: configHosts,
            dispatch
        } = this.props;
        const { password, username } = this.state;
        const jid = toJid(username, configHosts ?? {
            authdomain: '',
            domain: ''
        });

        if (conference) {
            dispatch(authenticateAndUpgradeRole(jid, password, conference));
        } else {
            logger.info('Dispatching connect from LoginDialog.');

            // The connect thunk returns a promise that rejects with the raw
            // connection error (e.g. 'connection.otherError') when the XMPP
            // connection fails. That failure is already surfaced to the user
            // through the redux state and the inline dialog message, so we
            // swallow the rejection here to prevent an unhandled promise
            // rejection (which otherwise trips the webpack-dev-server overlay).
            Promise.resolve(
                dispatch(connect(jid, password))
            ).catch(() => {
                /* handled via redux state / renderMessage */
            });
        }
    }

    /**
     * Callback for the onChange event of the field.
     *
     * @param {string} value - The static event.
     * @returns {void}
     */
    _onPasswordChange(value: string) {
        this.setState({
            password: value
        });
    }

    /**
     * Callback for the onChange event of the username input.
     *
     * @param {string} value - The new value.
     * @returns {void}
     */
    _onUsernameChange(value: string) {
        this.setState({
            username: value
        });
    }

    /**
     * Renders an optional message, if applicable.
     *
     * @returns {ReactElement}
     * @private
     */
    renderMessage() {
        const {
            _configHosts: configHosts,
            _connecting: connecting,
            _error: error,
            _progress: progress,
            t
        } = this.props;
        const { username, password } = this.state;
        const messageOptions: { msg?: string; } = {};
        let messageKey;

        if (progress && progress < 1) {
            messageKey = 'connection.FETCH_SESSION_ID';
        } else if (error) {
            const { name } = error;

            if (name === JitsiConnectionErrors.PASSWORD_REQUIRED) {
                const { credentials } = error;

                if (credentials
                    && credentials.jid === toJid(username, configHosts ?? { authdomain: '',
                        domain: '' })
                    && credentials.password === password) {
                    messageKey = 'dialog.incorrectPassword';
                }
            } else if (name) {
                messageKey = 'dialog.connectErrorWithMsg';
                messageOptions.msg = `${name} ${error.message}`;
            }
        } else if (connecting) {
            messageKey = 'connection.CONNECTING';
        }

        if (messageKey) {
            return (
                <span className = { withStyles.getClasses(this.props).message }>
                    { translateToHTML(t, messageKey, messageOptions) }
                </span>
            );
        }

        return null;
    }

    /**
     * Implements {@Component#render}.
     *
     * @inheritdoc
     */
    override render() {
        const {
            _connecting: connecting,
            t
        } = this.props;
        const { password, username } = this.state;
        const classes = withStyles.getClasses(this.props);

        return (
            <Dialog
                disableAutoHideOnSubmit = { true }
                disableBackdropClose = { true }
                hideCloseButton = { true }
                ok = {{
                    disabled: connecting
                        || !password
                        || !username,
                    translationKey: 'dialog.login'
                }}
                onCancel = { this._onCancelLogin }
                onSubmit = { this._onLogin }
                titleKey = { t('dialog.authenticationRequired') }>
                <Input
                    autoFocus = { true }
                    className = { classes.authInput }
                    id = 'login-dialog-username'
                    label = { t('dialog.user') }
                    name = 'username'
                    onChange = { this._onUsernameChange }
                    placeholder = { t('dialog.userIdentifier') }
                    type = 'text'
                    value = { username } />
                <Input
                    className = { classes.authInput }
                    id = 'login-dialog-password'
                    label = { t('dialog.userPassword') }
                    name = 'password'
                    onChange = { this._onPasswordChange }
                    placeholder = { t('dialog.password') }
                    type = 'password'
                    value = { password } />
                { this.renderMessage() }
            </Dialog>
        );
    }
}

/**
 * Maps (parts of) the Redux state to the associated props for the
 * {@code LoginDialog} component.
 *
 * @param {Object} state - The Redux state.
 * @private
 * @returns {IProps}
 */
function mapStateToProps(state: IReduxState) {
    const {
        error: authenticateAndUpgradeRoleError,
        progress,
        thenableWithCancel
    } = state['features/authentication'];
    const { authRequired, conference } = state['features/base/conference'];
    const { hosts: configHosts } = state['features/base/config'];
    const {
        connecting,
        error: connectionError
    } = state['features/base/connection'];

    return {
        _conference: authRequired || conference,
        _configHosts: configHosts,
        _connecting: Boolean(connecting) || Boolean(thenableWithCancel),
        _error: connectionError || authenticateAndUpgradeRoleError,
        _progress: progress
    };
}

export default translate(reduxConnect(mapStateToProps)(withStyles(LoginDialog, styles)));
