import styled from 'styled-components/macro';
import tw from 'twin.macro';

const SubNavigation = styled.div`
    ${tw`sticky z-40 w-full overflow-x-auto px-4 py-3`};
    top: 4.75rem;
    background: rgba(8, 13, 20, 0.78);
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
        background: #0e1622;
        border: 1px solid rgba(126, 144, 163, 0.16);

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

        & > div {
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
            top: 6rem;
            height: calc(100vh - 7rem);
            background: transparent;
            border: 0;
            backdrop-filter: none;

            & > div {
                ${tw`relative m-0 flex h-full min-w-0 flex-col items-stretch gap-1 overflow-hidden rounded-2xl p-2`};
                width: 100%;
                background: linear-gradient(180deg, rgba(18, 31, 46, 0.98), rgba(9, 17, 26, 0.98));
                border-color: rgba(157, 176, 195, 0.16);
                box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);

                &::before {
                    content: 'ESPACE SERVEUR';
                    ${tw`relative z-10 mb-2 block px-3 pb-3 pt-2 text-[0.68rem] font-semibold tracking-[0.18em] text-neutral-500`};
                    border-bottom: 1px solid rgba(157, 176, 195, 0.12);
                }

                &::after {
                    content: '';
                    ${tw`pointer-events-none absolute -bottom-10 -right-10 h-44 w-44`};
                    background: url('/assets/images/vinus/eagle.png') center / contain no-repeat;
                    opacity: 0.035;
                }

                & > a,
                & > div,
                & > div > a {
                    ${tw`w-full`};
                }

                & > a,
                & > div > a {
                    ${tw`relative z-10 flex items-center gap-3 rounded-xl px-3 py-2.5`};
                    border: 1px solid transparent;

                    & > svg {
                        ${tw`text-sm`};
                    }

                    &.active {
                        color: #f8fbff;
                        background: linear-gradient(90deg, rgba(255, 122, 26, 0.2), rgba(255, 122, 26, 0.05));
                        border-color: rgba(255, 122, 26, 0.22);
                        box-shadow: inset 3px 0 0 #ff7a1a, 0 8px 20px rgba(0, 0, 0, 0.1);
                    }
                }
            }
        }
    }
`;

export default SubNavigation;
