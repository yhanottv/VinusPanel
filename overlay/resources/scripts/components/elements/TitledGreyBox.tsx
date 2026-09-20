import React, { memo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import tw from 'twin.macro';
import isEqual from 'react-fast-compare';

interface Props {
    icon?: IconProp;
    title: string | React.ReactNode;
    className?: string;
    children: React.ReactNode;
}

const TitledGreyBox = ({ icon, title, children, className }: Props) => (
    <div css={tw`overflow-hidden rounded-2xl border border-neutral-600 bg-neutral-800 shadow-lg`} className={className}>
        <div
            css={tw`flex min-h-[3.5rem] items-center border-b border-neutral-600 bg-neutral-900 bg-opacity-40 px-4 py-3`}
        >
            {typeof title === 'string' ? (
                <p css={tw`flex items-center text-sm font-semibold text-neutral-100`}>
                    {icon && (
                        <span
                            css={tw`mr-3 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500 bg-opacity-10`}
                        >
                            <FontAwesomeIcon icon={icon} css={tw`text-primary-300`} />
                        </span>
                    )}
                    {title}
                </p>
            ) : (
                title
            )}
        </div>
        <div css={tw`p-4 sm:p-5`}>{children}</div>
    </div>
);

export default memo(TitledGreyBox, isEqual);
