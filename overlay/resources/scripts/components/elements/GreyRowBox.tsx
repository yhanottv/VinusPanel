import styled from 'styled-components/macro';
import tw from 'twin.macro';

export default styled.div<{ $hoverable?: boolean }>`
    ${tw`flex items-center overflow-hidden rounded-lg border bg-neutral-800 p-4 text-neutral-200 no-underline transition-colors duration-150`};
    border-color: rgba(255, 255, 255, 0.08);
    box-shadow: 0 12px 30px rgba(0, 0, 0, 0.1);

    ${(props) => props.$hoverable !== false && tw`hover:border-neutral-500`};

    & .icon {
        ${tw`flex w-16 items-center justify-center rounded-lg bg-neutral-800 p-3`};
    }
`;
