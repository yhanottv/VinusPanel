import PageContentBlock, { PageContentBlockProps } from '@/components/elements/PageContentBlock';
import React from 'react';
import { ServerContext } from '@/state/server';
import styled from 'styled-components/macro';
import tw from 'twin.macro';

interface Props extends PageContentBlockProps {
    title: string;
}

const pageDetails: Record<string, { label: string; description: string }> = {
    'File Manager': {
        label: 'Fichiers',
        description: 'Parcourez, modifiez et organisez les fichiers de cette instance.',
    },
    Databases: {
        label: 'Bases de données',
        description: 'Gérez les accès et les bases utilisées par votre serveur.',
    },
    Schedules: {
        label: 'Automatisations',
        description: 'Planifiez des commandes et des actions récurrentes.',
    },
    Users: {
        label: 'Accès',
        description: 'Contrôlez les personnes autorisées et leurs permissions.',
    },
    Backups: {
        label: 'Sauvegardes',
        description: 'Créez et restaurez des points de récupération fiables.',
    },
    Network: {
        label: 'Réseau',
        description: 'Consultez les allocations et les ports exposés par le serveur.',
    },
    'Startup Settings': {
        label: 'Démarrage',
        description: 'Configurez la commande, l’image et les variables de lancement.',
    },
    Settings: {
        label: 'Paramètres',
        description: 'Modifiez l’identité du serveur et ses options de maintenance.',
    },
    'Activity Log': {
        label: 'Activité',
        description: 'Retracez les actions récentes effectuées sur cette instance.',
    },
};

const PageIntro = styled.header`
    ${tw`relative mb-6 overflow-hidden rounded-2xl border px-5 py-5 sm:px-6`};
    background: linear-gradient(105deg, rgba(20, 33, 49, 0.96), rgba(12, 21, 32, 0.92));
    border-color: rgba(126, 144, 163, 0.16);
    box-shadow: 0 18px 45px rgba(0, 0, 0, 0.15);

    &::before {
        content: '';
        ${tw`absolute bottom-0 left-0 top-0 w-1`};
        background: #ff7a1a;
        box-shadow: 0 0 22px rgba(255, 122, 26, 0.45);
    }

    h1 {
        ${tw`text-2xl font-semibold text-neutral-50`};
    }

    p {
        ${tw`mt-1 max-w-2xl text-sm text-neutral-400`};
    }
`;

const ServerContentBlock: React.FC<Props> = ({ title, children, ...props }) => {
    const name = ServerContext.useStoreState((state) => state.server.data!.name);
    const details = pageDetails[title];
    const label = details?.label || title;

    return (
        <PageContentBlock title={`${name} | ${label}`} {...props}>
            {title !== 'Console' && (
                <PageIntro>
                    <h1>{label}</h1>
                    <p>{details?.description || `Gérez les paramètres de ${name}.`}</p>
                </PageIntro>
            )}
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
