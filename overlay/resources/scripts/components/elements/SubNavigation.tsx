import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.nav`
    ${tw`sticky top-0 z-40 w-full overflow-x-auto border-b p-2 lg:h-[calc(100vh-1.5rem)] lg:overflow-hidden lg:rounded-2xl lg:border lg:p-0`};
    background: rgba(15, 15, 19, 0.97);
    border-color: rgba(255, 255, 255, 0.075);
    box-shadow: 0 24px 70px rgba(0, 0, 0, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.025);

    &::-webkit-scrollbar {
        display: none;
    }

    & > div {
        ${tw`flex items-center gap-1 lg:h-full lg:flex-col lg:items-stretch lg:gap-0 lg:p-5`};
    }

    .server-sidebar-brand {
        ${tw`hidden lg:block lg:border-b lg:pb-5`};
        border-color: rgba(255, 255, 255, 0.075);

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
        ${tw`hidden lg:my-5 lg:grid lg:grid-cols-[2.75rem_minmax(0,1fr)] lg:gap-3 lg:rounded-xl lg:border lg:p-3`};
        background: linear-gradient(135deg, rgba(var(--vinus-accent-rgb), 0.1), rgba(255, 255, 255, 0.025));
        border-color: rgba(var(--vinus-accent-rgb), 0.17);

        .server-sidebar-server-icon {
            ${tw`flex h-11 w-11 items-center justify-center rounded-lg text-primary-300`};
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
        ${tw`flex items-center gap-1 lg:min-h-0 lg:flex-1 lg:flex-col lg:items-stretch lg:gap-4 lg:overflow-y-auto`};
    }

    .server-sidebar-section {
        ${tw`flex items-center gap-1 lg:block`};

        & > p {
            ${tw`hidden lg:mb-1.5 lg:block lg:px-3 lg:text-[0.61rem] lg:font-semibold lg:uppercase lg:tracking-[0.17em] lg:text-neutral-600`};
        }

        & > a,
        & > div > a {
            ${tw`inline-flex h-10 flex-none items-center gap-2 rounded-lg border border-transparent px-3 text-sm font-medium text-neutral-400 no-underline transition-colors lg:mb-0.5 lg:w-full lg:gap-3`};

            svg {
                ${tw`text-neutral-500`};
            }

            &:hover {
                ${tw`text-neutral-100`};
                background: rgba(255, 255, 255, 0.045);
            }

            &.active {
                ${tw`text-neutral-50`};
                background: rgba(var(--vinus-accent-rgb), 0.11);
                box-shadow: inset 3px 0 0 var(--vinus-accent);

                svg {
                    color: #ff9b52;
                }
            }
        }
    }

    .server-sidebar-footer {
        ${tw`hidden lg:block lg:border-t lg:pt-4`};
        border-color: rgba(255, 255, 255, 0.075);

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
