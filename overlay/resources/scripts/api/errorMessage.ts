import { vt } from '@/locales/translate';
// Do not expose exception traces, request URLs, tokens or response bodies in the UI.
export function errorMessage(error: any): string {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const detail = typeof data?.errors?.[0]?.detail === 'string' ? data.errors[0].detail : null;
    const reference = /^[a-f0-9-]{36}$/.test(data?.reference || '') ? ' ' + vt('Référence : {{reference}}.', { reference: data.reference }) : '';
    if (!status) return vt("Connexion au panel impossible. Vérifiez votre connexion Internet puis réessayez. Si le problème persiste, contactez un administrateur.");
    if (status === 401 || status === 419) return vt("Votre session a expiré. Reconnectez-vous au panel puis recommencez.");
    if (status === 403) return vt("Accès refusé. Votre compte ne dispose pas des permissions nécessaires pour cette action.");
    if (status === 429) return vt("Trop de demandes rapprochées. Patientez une minute avant de réessayer.");
    if (data?.code === 'VINUS_CATALOG' && detail) return detail.slice(0, 800) + reference;
    if (status >= 500) return vt('Le panel ou le service qu’il contacte rencontre un problème (HTTP {{status}}). Contactez un administrateur avec l’heure de l’erreur.', { status }) + reference;
    if (detail) return detail.slice(0, 500);
    if (status === 404) return vt("Élément introuvable. Actualisez la page : il a peut-être été déplacé ou supprimé.");
    if (status === 409) return vt("L’état du serveur a changé. Actualisez les informations avant de recommencer.");
    if (status === 422) return vt("Certaines informations sont invalides. Vérifiez les champs et les options sélectionnées.");
    return vt('La demande a été refusée (HTTP {{status}}). Actualisez la page puis réessayez.', { status });
}
