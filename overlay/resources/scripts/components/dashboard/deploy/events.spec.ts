/** @jest-environment jsdom */
import { DEPLOY_OPEN_EVENT, openDeployWizard } from './events';

const claim = (event: Event) => {
    const detail = (event as CustomEvent<{ handled: boolean }>).detail;
    if (!detail.handled) detail.handled = true;
};

it('reports that nothing handled the request when no wizard is mounted', () => {
    expect(openDeployWizard()).toBe(false);
});

it('reports a handled request when a wizard listens', () => {
    window.addEventListener(DEPLOY_OPEN_EVENT, claim);
    expect(openDeployWizard()).toBe(true);
    window.removeEventListener(DEPLOY_OPEN_EVENT, claim);
});

it('lets only the first of several wizards act', () => {
    const opened: string[] = [];
    const first = (event: Event) => {
        const detail = (event as CustomEvent<{ handled: boolean }>).detail;
        if (detail.handled) return;
        detail.handled = true;
        opened.push('first');
    };
    const second = (event: Event) => {
        const detail = (event as CustomEvent<{ handled: boolean }>).detail;
        if (detail.handled) return;
        detail.handled = true;
        opened.push('second');
    };
    window.addEventListener(DEPLOY_OPEN_EVENT, first);
    window.addEventListener(DEPLOY_OPEN_EVENT, second);
    expect(openDeployWizard()).toBe(true);
    window.removeEventListener(DEPLOY_OPEN_EVENT, first);
    window.removeEventListener(DEPLOY_OPEN_EVENT, second);
    expect(opened).toEqual(['first']);
});
