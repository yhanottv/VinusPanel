import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.nav`
    ${tw`sticky top-0 lg:top-3 z-40 w-full overflow-x-auto border-b p-2 lg:h-[calc(100vh-1.5rem)] lg:overflow-hidden lg:rounded-xl lg:border lg:p-0`};

    @media (min-width: 1024px) {
        height: calc(100vh - 1.5rem);
        align-self: start;
    }
    background: var(--vinus-glass-navigation);
    backdrop-filter: blur(28px) saturate(115%);
    -webkit-backdrop-filter: blur(28px) saturate(115%);
    border-color: rgba(255, 255, 255, 0.065);
    box-shadow: var(--vinus-navigation-shadow);

    &::-webkit-scrollbar {
        display: none;
    }

    & > div {
        ${tw`flex items-center gap-1 lg:h-full lg:flex-col lg:items-stretch lg:gap-0 lg:px-3 lg:py-5`};
    }

    .server-sidebar-brand {
        ${tw`hidden lg:block lg:border-b lg:pb-5`};
        border-color: rgba(255, 255, 255, 0.065);

        a {
            ${tw`flex items-center no-underline`};
        }

        img {
            ${tw`mr-3 h-10 w-10 rounded-xl object-contain`};
            background: rgba(var(--vinus-accent-rgb), 0.1);
            border: 1px solid rgba(var(--vinus-accent-rgb), 0.22);
        }

        strong,
        span {
            ${tw`block`};
        }

        strong {
            ${tw`text-base font-semibold text-neutral-100`};
        }

        span {
            ${tw`mt-0.5 text-[0.62rem] font-semibold uppercase tracking-[0.17em] text-neutral-500`};
        }
    }

    .server-sidebar-current {
        ${tw`hidden lg:my-4 lg:grid lg:grid-cols-[2.75rem_minmax(0,1fr)] lg:gap-3 lg:rounded-xl lg:border lg:p-3`};
        background: rgba(255, 255, 255, 0.018);
        border-color: var(--vinus-border);

        @media (min-width: 1024px) {
            grid-template-columns: 2rem minmax(0, 1fr);
            flex-shrink: 0;
            gap: 0.6rem;
            padding: 0.75rem 0.5rem;
        }

        .server-sidebar-server-icon {
            ${tw`flex h-8 w-8 items-center justify-center rounded-lg text-primary-300`};
            background: rgba(0, 0, 0, 0.24);
        }

        strong,
        small,
        .server-status {
            ${tw`block truncate`};
        }

        strong {
            ${tw`text-sm font-semibold text-neutral-100`};
        }

        .server-status {
            ${tw`mt-0.5 text-xs font-medium text-neutral-500`};

            &::before {
                content: '';
                ${tw`mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-neutral-500`};
            }

            &.server-status-running {
                ${tw`text-green-400`};

                &::before {
                    ${tw`bg-green-400`};
                    box-shadow: 0 0 8px rgba(52, 211, 153, 0.65);
                }
            }

            &.server-status-starting,
            &.server-status-stopping {
                ${tw`text-yellow-400`};

                &::before {
                    ${tw`bg-yellow-400`};
                }
            }
        }

        small {
            ${tw`mt-1 font-mono text-[0.65rem] text-neutral-600`};
        }
    }

    .server-sidebar-links {
        ${tw`flex items-center gap-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:items-stretch lg:gap-3 lg:overflow-y-auto`};
    }

    .server-sidebar-section {
        ${tw`flex flex-none items-center gap-1 lg:block`};

        & > p {
            ${tw`hidden lg:mb-1.5 lg:block lg:px-3 lg:text-[0.61rem] lg:font-semibold lg:uppercase lg:tracking-[0.17em] lg:text-neutral-500`};
        }

        & > a,
        & > div > a {
            ${tw`inline-flex h-10 flex-none items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium text-neutral-400 no-underline transition-colors lg:mb-0.5 lg:w-full lg:gap-3`};

            svg {
                ${tw`text-neutral-500`};
            }

            &:hover {
                ${tw`text-neutral-100`};
                background: rgba(255, 255, 255, 0.035);
            }

            &.active {
                ${tw`text-neutral-50`};
                background: rgba(var(--vinus-accent-rgb), 0.065);
                border-color: rgba(var(--vinus-accent-rgb), 0.16);
                box-shadow: inset 2px 0 0 #ff7a1a;

                svg {
                    color: #ff9b52;
                }
            }
        }
    }

    .server-sidebar-footer {
        ${tw`hidden lg:block lg:border-t lg:pt-4`};
        border-color: rgba(255, 255, 255, 0.065);

        a,
        button {
            ${tw`mb-0.5 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-sm text-neutral-500 no-underline transition-colors`};

            &:hover {
                ${tw`text-neutral-200`};
                background: rgba(255, 255, 255, 0.04);
            }
        }

        button:hover {
            ${tw`text-red-300`};
            background: rgba(244, 63, 94, 0.07);
        }
    }
`;

export default SubNavigation;
