import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`sticky z-40 w-full overflow-x-auto px-4 py-3`};
    top: 4.5rem;
    background: rgba(8, 9, 11, 0.86);
    border-bottom: 1px solid rgba(126, 144, 163, 0.12);
    backdrop-filter: blur(14px);

    &::-webkit-scrollbar {
        display: none;
    }

    & > div {
        ${tw`relative mx-auto flex items-center rounded-xl p-1 text-sm`};
        width: max-content;
        min-width: min(100%, 1280px);
        max-width: 1280px;
        background: #0d0e11;
        border: 1px solid rgba(255, 255, 255, 0.08);

        & > a,
        & > div {
            ${tw`inline-block whitespace-nowrap rounded-lg px-3.5 py-2 text-neutral-400 no-underline transition-all duration-150`};

            &:hover {
                ${tw`text-neutral-100`};
                background: rgba(255, 122, 26, 0.07);
            }

            &:active,
            &.active {
                color: #dff3ff;
                background: rgba(255, 122, 26, 0.14);
                box-shadow: inset 0 0 0 1px rgba(255, 122, 26, 0.18);
            }

            &:focus-visible {
                outline: 2px solid #ff7a1a;
                outline-offset: -1px;
            }
        }
    }

    &.server-sidebar {
        ${tw`z-30`};

        .server-sidebar-brand,
        .server-sidebar-label,
        .server-sidebar-current {
            ${tw`hidden`};
        }

        .server-sidebar-links {
            ${tw`flex items-center`};
        }

        .server-sidebar-links {
            & > a,
            & > div > a {
                ${tw`inline-flex items-center gap-2`};

                & > svg {
                    color: #6f8499;
                }

                &.active > svg,
                &:hover > svg {
                    color: #ff7a1a;
                }
            }
        }
    }

    @media (min-width: 1024px) {
        &.server-sidebar {
            ${tw`sticky overflow-y-auto overflow-x-hidden p-0`};
            top: 5.25rem;
            height: calc(100vh - 6rem);
            background: transparent;
            border: 0;
            backdrop-filter: none;

            & > div {
                ${tw`relative m-0 flex h-full min-w-0 flex-col items-stretch overflow-hidden rounded-2xl p-5`};
                width: 100%;
                background: linear-gradient(180deg, rgba(12, 12, 13, 0.99), rgba(7, 8, 9, 0.99));
                border-color: rgba(255, 255, 255, 0.08);
                box-shadow: 0 20px 48px rgba(0, 0, 0, 0.3);

                &::after {
                    content: '';
                    ${tw`pointer-events-none absolute -bottom-10 -right-10 h-44 w-44`};
                    background: url('/assets/images/vinus/eagle.png') center / contain no-repeat;
                    opacity: 0.035;
                }

                .server-sidebar-brand {
                    ${tw`relative z-10 mb-5 block border-b pb-5`};
                    border-color: rgba(255, 255, 255, 0.08);

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
                        ${tw`text-sm font-semibold text-neutral-100`};
                    }

                    span {
                        ${tw`mt-0.5 text-[0.64rem] uppercase tracking-[0.16em] text-neutral-500`};
                    }
                }

                .server-sidebar-label {
                    ${tw`relative z-10 mb-2 block px-2 text-[0.64rem] font-semibold uppercase tracking-[0.18em] text-neutral-600`};
                }

                .server-sidebar-links {
                    ${tw`relative z-10 flex min-h-0 flex-1 flex-col items-stretch gap-1 overflow-y-auto`};
                }

                .server-sidebar-links > a,
                .server-sidebar-links > div,
                .server-sidebar-links > div > a {
                    ${tw`w-full`};
                }

                .server-sidebar-links > a,
                .server-sidebar-links > div > a {
                    ${tw`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium`};
                    border: 1px solid transparent;

                    & > svg {
                        ${tw`text-sm`};
                    }

                    &.active {
                        color: #f8fbff;
                        background: rgba(255, 255, 255, 0.07);
                        border-color: rgba(255, 255, 255, 0.07);
                        box-shadow: inset 3px 0 0 #ff7a1a;
                    }
                }

                .server-sidebar-current {
                    ${tw`relative z-10 mt-5 block rounded-xl border p-3`};
                    background: rgba(255, 255, 255, 0.035);
                    border-color: rgba(255, 255, 255, 0.08);

                    span,
                    strong,
                    small {
                        ${tw`block truncate`};
                    }

                    span {
                        ${tw`text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-neutral-500`};
                    }

                    strong {
                        ${tw`mt-2 text-sm font-semibold text-neutral-100`};
                    }

                    small {
                        ${tw`mt-1 font-mono text-[0.65rem] text-neutral-600`};
                    }
                }
            }
        }
    }
`;

export default SubNavigation;
