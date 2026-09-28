import { ReactElement } from 'react';
import { Root, createRoot } from 'react-dom/client';

/**
 * The React roots created for the DOM containers. React 18 requires the root
 * to be created only once per container and then reused, because calling
 * {@code createRoot} again produces an independent React tree which loses the
 * state and the context of the previous one.
 *
 * @type {WeakMap<Element, Root>}
 */
const roots = new WeakMap<Element, Root>();

/**
 * Renders a React element into a DOM container. A drop-in replacement for the
 * deprecated {@code ReactDOM.render} which reuses the root created for the
 * container on one of the previous calls.
 *
 * @param {ReactElement} element - The React element to render.
 * @param {?Element} container - The DOM element to render into.
 * @returns {void}
 */
export function renderElement(element: ReactElement, container?: Element | null) {
    if (!container) {
        return;
    }

    let root = roots.get(container);

    if (!root) {
        root = createRoot(container);
        roots.set(container, root);
    }

    root.render(element);
}

/**
 * Unmounts the React tree previously rendered into the given container by
 * {@link renderElement}. A drop-in replacement for the deprecated
 * {@code ReactDOM.unmountComponentAtNode}.
 *
 * @param {?Element} container - The DOM element to unmount.
 * @returns {void}
 */
export function unmountElement(container?: Element | null) {
    if (!container) {
        return;
    }

    const root = roots.get(container);

    if (root) {
        root.unmount();
        roots.delete(container);
    }
}
