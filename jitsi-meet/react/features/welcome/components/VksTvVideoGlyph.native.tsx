import React from 'react';
import Svg, { G, Path, Rect } from 'react-native-svg';

interface IGlyphProps {

    /**
     * Stroke color of the glyph.
     */
    color?: string;

    /**
     * Size of the square the glyph is drawn in, in pixels.
     */
    size?: number;

    /**
     * Width of the stroke in the glyph's own 24x24 grid. The brand mark keeps
     * the lucide default (2), single decorative icons use a thinner line.
     */
    strokeWidth?: number;
}

/**
 * Lens of the video-camera glyph: the lucide Video triangle that sticks out to
 * the right of the body.
 */
export const VIDEO_LENS_PATH = 'M16,13 L21.223,16.482 a0.5,0.5 0 0 0 0.777,-0.416 L22,7.87 a0.5,0.5 0 0 0'
    + ' -0.752,-0.432 L16,10.5';

/**
 * Renders the video-camera glyph of the brand mark (lucide Video) on its own
 * 24x24 grid, so decorative icons of the app draw the very same camera the
 * logo and the web UI favicon are built of.
 *
 * @param {IGlyphProps} props - Component props.
 * @returns {ReactElement}
 */
const VksTvVideoGlyph = ({ color = '#FFFFFF', size = 24, strokeWidth = 2 }: IGlyphProps) => (
    <Svg
        height = { size }
        viewBox = '0 0 24 24'
        width = { size }>
        <G
            fill = 'none'
            stroke = { color }
            strokeLinecap = 'round'
            strokeLinejoin = 'round'
            strokeWidth = { strokeWidth }>
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

export default VksTvVideoGlyph;
