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

const PageIntro = styled.div`
    ${tw`mb-5 flex items-center border-b pb-4`};
    border-color: rgba(255, 255, 255, 0.06);

    p {
        ${tw`max-w-2xl text-sm text-neutral-400`};
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
                    <p>{details?.description || `Gérez les paramètres de ${name}.`}</p>
                </PageIntro>
            )}
            {children}
        </PageContentBlock>
    );
};

export default ServerContentBlock;
