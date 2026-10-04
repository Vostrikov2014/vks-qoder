import React from 'react';
import Svg, { Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

interface IProps {

    /**
     * Size of the logo square in pixels.
     */
    size?: number;
}

/**
 * Renders the VKS TV brand mark: a rounded tile with the platform gradient and a
 * white video glyph, mirroring the web UI favicon of the platform.
 *
 * @param {IProps} props - Component props.
 * @returns {ReactElement}
 */
const VksTvLogo = ({ size = 64 }: IProps) => (
    <Svg
        height = { size }
        viewBox = '0 0 108 108'
        width = { size }>
        <Defs>
            <LinearGradient
                gradientUnits = 'userSpaceOnUse'
                id = 'vksTvGradient'
                x1 = '0'
                x2 = '108'
                y1 = '0'
                y2 = '108'>
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
            height = '108'
            rx = '20'
            width = '108'
            x = '0'
            y = '0' />
        <G
            transform = 'translate(21, 21) scale(2.75)'>
            <Path
                d = 'M4,6 L16,6 A2,2 0 0 1 18,8 L18,16 A2,2 0 0 1 16,18 L4,18 A2,2 0 0 1 2,16 L2,8 A2,2 0 0 1 4,6 Z'
                fill = 'none'
                stroke = '#FFFFFF'
                strokeWidth = '2' />
            <Path
                d = 'M16,13 L21.223,16.482 a0.5,0.5 0 0 0 0.777,-0.416 L21.9999,7.87 a0.5,0.5 0 0 0 -0.752,-0.432 L16,10.5'
                fill = 'none'
                stroke = '#FFFFFF'
                strokeWidth = '2' />
        </G>
    </Svg>
);

export default VksTvLogo;
