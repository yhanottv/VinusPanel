import { vt } from '@/locales/translate';
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
        label: vt("Fichiers"),
        description: vt("Parcourez, modifiez et organisez les fichiers de cette instance."),
    },
    Databases: {
        label: vt("Bases de données"),
        description: vt("Gérez les accès et les bases utilisées par votre serveur."),
    },
    Schedules: {
        label: vt("Automatisations"),
        description: vt("Planifiez des commandes et des actions récurrentes."),
    },
    Users: {
        label: vt("Accès"),
        description: vt("Contrôlez les personnes autorisées et leurs permissions."),
    },
    Backups: {
        label: vt("Sauvegardes"),
        description: vt("Créez et restaurez des points de récupération fiables."),
    },
    Network: {
        label: vt("Réseau"),
        description: vt("Consultez les allocations et les ports exposés par le serveur."),
    },
    'Startup Settings': {
        label: vt("Démarrage"),
        description: vt("Configurez la commande, l’image et les variables de lancement."),
    },
    Settings: {
        label: vt("Paramètres"),
        description: vt("Modifiez l’identité du serveur et ses options de maintenance."),
    },
    'Activity Log': {
        label: vt("Activité"),
        description: vt("Retracez les actions récentes effectuées sur cette instance."),
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
