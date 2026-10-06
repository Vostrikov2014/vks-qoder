import React from 'react';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { VIDEO_LENS_PATH } from './VksTvVideoGlyph.native';

interface ILogoProps {

    /**
     * Size of the logo square in pixels.
     */
    size?: number;
}

/**
 * Renders the VKS TV brand mark. This mirrors the web UI logo of the platform
 * (jmp-ui `public/favicon.svg`) exactly: a rounded tile filled with the brand
 * diagonal gradient and a stroked white video-camera glyph.
 *
 * @param {ILogoProps} props - Component props.
 * @returns {ReactElement}
 */
const VksTvLogo = ({ size = 64 }: ILogoProps) => (
    <Svg
        height = { size }
        viewBox = '0 0 64 64'
        width = { size }>
        <Defs>
            <LinearGradient
                id = 'vksTvGradient'
                x1 = '0'
                x2 = '1'
                y1 = '0'
                y2 = '1'>
                <Stop
                    offset = '0'
                    stopColor = '#2563EB' />
                <Stop
                    offset = '0.5'
                    stopColor = '#3B82F6' />
                <Stop
                    offset = '1'
                    stopColor = '#1D4ED8' />
            </LinearGradient>
        </Defs>
        <Rect
            fill = 'url(#vksTvGradient)'
            height = '64'
            rx = '12'
            width = '64'
            x = '0'
            y = '0' />
        <G
            fill = 'none'
            stroke = '#FFFFFF'
            strokeLinecap = 'round'
            strokeLinejoin = 'round'
            strokeWidth = '2'
            transform = 'translate(8, 8) scale(2)'>
            <Path d = { VIDEO_LENS_PATH } />
            <Rect
                height = '12'
                rx = '2'
                width = '14'
                x = '2'
                y = '6' />
        </G>
    </Svg>
);

export default VksTvLogo;
