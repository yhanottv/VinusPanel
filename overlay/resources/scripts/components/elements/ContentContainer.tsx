import styled from 'styled-components/macro';
import { breakpoint } from '@/theme';
import tw from 'twin.macro';

const ContentContainer = styled.div`
    width: auto;
    max-width: 1500px;
    ${tw`mx-4`};

    ${breakpoint('md')`
        ${tw`mx-6`};
    `};

    ${breakpoint('xl')`
        ${tw`mx-8`};
    `};
`;
ContentContainer.displayName = 'ContentContainer';

export default ContentContainer;
