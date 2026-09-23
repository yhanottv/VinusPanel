import { normalizeDesign, safeDesignUrl, validCssRule } from './designRuntime';
import { optionDefaults } from './designOptions';

describe('theme draft boundaries', () => {
    it('migrates old settings while preserving custom identity and server banners', () => {
        const value=normalizeDesign({brand_name:'Example',servers:{abc:{banner:'/assets/vinus/custom/banner.png'}}});
        expect(value.brand_name).toBe('Example');
        expect(value.options.content_width).toBe('full');
        expect(value.options.blur_address).toBe(true);
        expect(value.servers.abc.banner).toBe('/assets/vinus/custom/banner.png');
        expect(value.navigation).toEqual([]);
        expect(value.options).not.toBe(optionDefaults);
    });
    it.each(['javascript:alert(1)','//elsewhere.test/a.png','data:image/svg+xml,test','https://example.com/"onerror','https://example.com/\\a'])('refuses unsafe design URLs: %s',value=>expect(safeDesignUrl(value)).toBe(false));
    it.each(['/assets/vinus/custom/a.png','https://example.com/a.webp',''])('accepts image paths: %s',value=>expect(safeDesignUrl(value)).toBe(true));
    it.each(['@import x','color:red}</style>','background:url(https://example.com)','width:expression(alert(1))','color:red\\3b'])('refuses CSS escapes and resources: %s',value=>expect(validCssRule('.app-shell',value)).toBe(false));
    it('accepts declarations without executing or fetching content',()=>expect(validCssRule('.app-shell h1','color: #fff; letter-spacing: -.03em;')).toBe(true));
});
