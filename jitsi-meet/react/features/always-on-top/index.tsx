import React from 'react';

import { renderElement, unmountElement } from '../base/react/dom.web';

import AlwaysOnTop from './AlwaysOnTop';

// Render the main/root Component.
renderElement(<AlwaysOnTop />, document.getElementById('react'));

window.addEventListener(
    'beforeunload',
    () => unmountElement(document.getElementById('react') ?? document.body));
