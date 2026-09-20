import styled from 'styled-components/macro';
import tw from 'twin.macro';

const Label = styled.label<{ isLight?: boolean }>`
    ${tw`mb-1 block text-sm font-medium normal-case text-neutral-300 sm:mb-2`};
    ${(props) => props.isLight && tw`text-neutral-300`};
`;

export default Label;
