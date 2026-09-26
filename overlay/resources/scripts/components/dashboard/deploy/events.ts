export const DEPLOY_OPEN_EVENT = 'vinus:deploy-open';

/**
 * Ask the mounted deployment wizard to open. Several pages can mount a wizard, so the first listener
 * claims the event. Returns false when nothing handled it, so the caller can fall back to its link.
 */
export function openDeployWizard(): boolean {
    const detail = { handled: false };
    window.dispatchEvent(new CustomEvent(DEPLOY_OPEN_EVENT, { detail }));

    return detail.handled;
}
