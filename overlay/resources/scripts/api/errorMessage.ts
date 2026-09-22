// Do not expose exception traces, request URLs, tokens or response bodies in the UI.
export function errorMessage(error: any): string {
    const status = error?.response?.status;
    const data = error?.response?.data;
    const detail = typeof data?.errors?.[0]?.detail === 'string' ? data.errors[0].detail : null;
    const reference = /^[a-f0-9-]{36}$/.test(data?.reference || '') ? ` Référence : ${data.reference}.` : '';
    if (!status) return 'Connexion au panel impossible. Vérifiez votre connexion Internet puis réessayez. Si le problème persiste, contactez un administrateur.';
    if (status === 401 || status === 419) return 'Votre session a expiré. Reconnectez-vous au panel puis recommencez.';
    if (status === 403) return 'Accès refusé. Votre compte ne dispose pas des permissions nécessaires pour cette action.';
    if (status === 429) return 'Trop de demandes rapprochées. Patientez une minute avant de réessayer.';
    if (data?.code === 'VINUS_CATALOG' && detail) return detail.slice(0, 800) + reference;
    if (status >= 500) return `Le panel ou le service qu’il contacte rencontre un problème (HTTP ${status}). Contactez un administrateur avec l’heure de l’erreur.${reference}`;
    if (detail) return detail.slice(0, 500);
    if (status === 404) return 'Élément introuvable. Actualisez la page : il a peut-être été déplacé ou supprimé.';
    if (status === 409) return 'L’état du serveur a changé. Actualisez les informations avant de recommencer.';
    if (status === 422) return 'Certaines informations sont invalides. Vérifiez les champs et les options sélectionnées.';
    return `La demande a été refusée (HTTP ${status}). Actualisez la page puis réessayez.`;
}
