import { browseFiles, selectPage } from './browse';
import { FileObject } from '@/api/server/files/loadDirectory';
const file = (name: string, size = 0, isFile = true) => ({ name, size, isFile, modifiedAt: new Date(size) } as FileObject);
describe('File browsing', () => {
    it('searches the whole directory before pagination, without mutating SWR data', () => {
        const files = Array.from({ length: 300 }, (_,i) => file(`file-${i}`));
        const before = files.slice();
        expect(browseFiles(files, 'FILE-299', 'name', false).map(f => f.name)).toEqual(['file-299']);
        expect(files).toEqual(before);
    });
    it('keeps folders first in both sort directions', () => {
        const files = [file('a', 2), file('folder', 0, false), file('z', 8)];
        expect(browseFiles(files, '', 'size', true).map(f => f.name)).toEqual(['folder','z','a']);
        expect(browseFiles(files, '', 'modified', false).map(f => f.name)).toEqual(['folder','a','z']);
    });
    it('selects only visible rows and preserves selection on other pages', () => {
        expect(selectPage(['other', 'a'], ['a','b'], true)).toEqual(['other','a','b']);
        expect(selectPage(['other', 'a'], ['a','b'], false)).toEqual(['other']);
    });
});
