import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useLayoutEffect } from 'react';
import { GestureResponderEvent, ScrollView, Text, TouchableHighlight, View, ViewStyle } from 'react-native';
import { Edge } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';

import { IReduxState } from '../../../app/types';
import i18next, { DEFAULT_LANGUAGE } from '../../../base/i18n/i18next';
import { IconArrowLeft } from '../../../base/icons/svg';
import JitsiScreen from '../../../base/modal/components/JitsiScreen';
import BaseThemeNative from '../../../base/ui/components/BaseTheme.native';
import HeaderNavigationButton from '../../../mobile/navigation/components/HeaderNavigationButton';

import styles from './styles';

/**
 * The languages selectable in the Android app.
 *
 * English is the builtin default UI language and Russian is the only extra
 * bundle registered in BuiltinLanguages.native.ts. Labels are shown as
 * endonyms, independent of the currently active UI language.
 */
const AVAILABLE_LANGUAGES: Array<{ code: string; label: string; }> = [
    { code: 'en', label: 'English' },
    { code: 'ru', label: 'Русский' }
];

const LanguageSelectView = ({ goBack, isInWelcomePage }: {
    goBack?: (e?: GestureResponderEvent | React.MouseEvent) => void;
    isInWelcomePage?: boolean;
}) => {
    const navigation = useNavigation();
    const { conference } = useSelector((state: IReduxState) => state['features/base/conference']);
    const { language: currentLanguage = DEFAULT_LANGUAGE } = i18next;

    const setLanguage = useCallback(language => () => {
        i18next.changeLanguage(language);
        conference?.setTranscriptionLanguage(language);
        goBack?.();
    }, [ conference, i18next ]);

    const headerLeft = () => (
        <HeaderNavigationButton
            color = { BaseThemeNative.palette.link01 }
            onPress = { goBack }
            src = { IconArrowLeft }
            style = { styles.backBtn }
            twoActions = { true } />
    );

    useLayoutEffect(() => {
        navigation.setOptions({
            headerLeft
        });
    }, [ navigation ]);

    return (
        <JitsiScreen
            disableForcedKeyboardDismiss = { true }
            safeAreaInsets = { [ !isInWelcomePage && 'bottom', 'left', 'right' ].filter(Boolean) as Edge[] }
            style = { styles.settingsViewContainer }>
            <ScrollView
                bounces = { isInWelcomePage }
                contentContainerStyle = { styles.languageListContainer as ViewStyle }>
                {
                    AVAILABLE_LANGUAGES.map(({ code, label }) => (
                        <TouchableHighlight
                            disabled = { currentLanguage === code }
                            key = { code }
                            onPress = { setLanguage(code) }>
                            <View
                                style = { styles.languageOption as ViewStyle }>
                                <Text
                                    style = { [
                                        styles.text,
                                        styles.fieldLabelText,
                                        currentLanguage === code && styles.selectedLanguage ] }>
                                    { label }
                                </Text>
                            </View>
                        </TouchableHighlight>
                    ))
                }
            </ScrollView>
        </JitsiScreen>
    );
};

export default LanguageSelectView;
