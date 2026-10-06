import { connect } from 'react-redux';

import { createToolbarEvent } from '../../../../analytics/AnalyticsEvents';
import { sendAnalytics } from '../../../../analytics/functions';
import { IReduxState } from '../../../../app/types';
import { translate } from '../../../../base/i18n/functions';
import { IconAddUser } from '../../../../base/icons/svg';
import AbstractButton, { IProps as AbstractButtonProps } from '../../../../base/toolbox/components/AbstractButton';
import { shouldRenderInviteButton } from '../../../../participants-pane/functions';
import { doInvitePeople } from '../../../actions.native';

/**
 * A button to invite people to the conference: opens the invite dialog or the
 * system share sheet, depending on the configuration.
 */
class InviteButton extends AbstractButton<AbstractButtonProps> {
    override accessibilityLabel = 'toolbar.accessibilityLabel.invite';
    override icon = IconAddUser;
    override label = 'toolbar.invite';

    /**
     * Handles clicking / pressing the button.
     *
     * @override
     * @protected
     * @returns {void}
     */
    override _handleClick() {
        const { dispatch } = this.props;

        sendAnalytics(createToolbarEvent('invite'));
        dispatch(doInvitePeople());
    }
}

/**
 * Maps part of the Redux state to the props of this component.
 *
 * @param {Object} state - The Redux state.
 * @returns {IProps}
 */
function _mapStateToProps(state: IReduxState) {
    return {
        visible: shouldRenderInviteButton(state)
    };
}

export default translate(connect(_mapStateToProps)(InviteButton));
