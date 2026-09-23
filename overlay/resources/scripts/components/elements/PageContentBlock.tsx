import { useDesign } from '@/designRuntime';
import { vt } from '@/locales/translate';
import LanguageSelector from '@/components/elements/LanguageSelector';
import React, { useEffect } from 'react';
import ContentContainer from '@/components/elements/ContentContainer';
import { CSSTransition } from 'react-transition-group';
import tw from 'twin.macro';
import FlashMessageRender from '@/components/FlashMessageRender';
import { DiscordAnnouncement } from '@/components/elements/DiscordButton';

export interface PageContentBlockProps {
    title?: string;
    className?: string;
    showFlashKey?: string;
}

const PageContentBlock: React.FC<PageContentBlockProps> = ({ title, showFlashKey, className, children }) => {
    const design = useDesign();
    useEffect(() => {
        if (title) {
            document.title = design.options.title_template.replace('{page}', title).replace('{panel}', design.brand_name);
        }
    }, [title, design.brand_name, design.options.title_template]);

    return (
        <CSSTransition timeout={150} classNames={'fade'} appear in>
            <>
                <ContentContainer css={tw`my-5 sm:my-8`} className={className}>
                    <div className={'vinus-language-bar'}><LanguageSelector /></div>
                    <DiscordAnnouncement />
                    {showFlashKey && <FlashMessageRender byKey={showFlashKey} css={tw`mb-4`} />}
                    {children}
                </ContentContainer>
                <ContentContainer className="vinus-page-footer" css={tw`mb-4`}>
                    <p className="vinus-footer-credit" css={tw`text-center text-xs text-neutral-500`}>{vt("Propulsé par ")}<a
                            rel={'noopener nofollow noreferrer'}
                            href={'https://pterodactyl.io'}
                            target={'_blank'}
                            css={tw`no-underline text-neutral-500 hover:text-neutral-300`}
                        >
                            Pterodactyl&reg;
                        </a>
                        &nbsp;&middot;&nbsp;2015 - {new Date().getFullYear()}
                    </p>
                    {design.options.footer_theme && <p className="vinus-footer-custom">VinusPanel</p>}
                    {design.options.footer_text && <p className="vinus-footer-custom">{design.options.footer_text}</p>}
                </ContentContainer>
            </>
        </CSSTransition>
    );
};

export default PageContentBlock;
