import BaseTheme from '../../../ui/components/BaseTheme.native';

const BUTTON_HEIGHT = BaseTheme.spacing[7];

const button = {
    borderRadius: BaseTheme.shape.borderRadius,
    display: 'flex',
    height: BUTTON_HEIGHT,
    justifyContent: 'center'
};

const buttonLabel = {
    // Buttons always carry an explicit label style, so the shared base has to
    // provide a color: without it react-native-paper falls back to
    // theme.colors.primary, i.e. the light Material purple of the default theme
    // (#6750A4), which is off-brand and barely readable on the dark surfaces.
    color: BaseTheme.palette.text01,
    ...BaseTheme.typography.bodyShortBold
};

// jmp-ui --border-strong (dark theme): the hairline that separates a filled
// control from the near-black page behind it. Same value the web Button uses
// for its secondary variant.
const SECONDARY_BORDER_COLOR = 'rgba(255, 255, 255, 0.16)';

export default {
    button: {
        ...button
    },

    buttonSecondary: {
        ...button,
        borderColor: SECONDARY_BORDER_COLOR,
        borderWidth: 1
    },

    buttonLabel: {
        ...buttonLabel
    },

    buttonLabelDisabled: {
        ...buttonLabel,
        color: BaseTheme.palette.text03
    },

    buttonContent: {
        height: BUTTON_HEIGHT
    },

    // disabled01 is the token the web Button and iconButtonContainerDisabled use
    // for the same state; ui08 resolves to ui21 (#B3B3B3), a light grey that
    // turns a disabled button into a bright slab on the #141414 background.
    buttonDisabled: {
        ...button,
        backgroundColor: BaseTheme.palette.disabled01
    },

    buttonLabelPrimary: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    },

    buttonLabelPrimaryText: {
        ...buttonLabel,
        color: BaseTheme.palette.action01
    },

    buttonLabelSecondary: {
        ...buttonLabel,

        // Secondary buttons are filled with action02 (#2E2E33), so the label has
        // to be the light text token. text04 (surface01) is meant for text on
        // light surfaces and would be near-black on the dark fill.
        color: BaseTheme.palette.text01
    },

    buttonLabelDestructive: {
        ...buttonLabel,
        color: BaseTheme.palette.text01
    },

    buttonLabelDestructiveText: {
        ...buttonLabel,
        color: BaseTheme.palette.actionDanger
    },

    buttonLabelTertiary: {
        ...buttonLabel,
        color: BaseTheme.palette.text01,
        marginHorizontal: BaseTheme.spacing[2],
        textAlign: 'center'
    },

    buttonLabelTertiaryDisabled: {
        ...buttonLabel,
        color: BaseTheme.palette.text03,
        textAlign: 'center'
    }
};
