export interface OwnerCandidate { id: number; email: string }

/**
 * The client API does not expose numeric user ids, so the signed-in administrator is matched by
 * e-mail address. Fall back to the first account only when no match exists.
 */
export const pickOwnerId = (users: OwnerCandidate[], email?: string): number => {
    const wanted = (email || '').trim().toLowerCase();
    const own = wanted ? users.find((entry) => entry.email.trim().toLowerCase() === wanted) : undefined;

    return own?.id ?? users[0]?.id ?? 0;
};
