import { FileObject } from '@/api/server/files/loadDirectory';
export type SortKey = 'name' | 'size' | 'modified';
export function browseFiles(files: FileObject[], query: string, key: SortKey, descending: boolean) {
    return files.filter(file => file.name.toLocaleLowerCase().includes(query.toLocaleLowerCase())).sort((a,b) => {
        if (a.isFile !== b.isFile) return a.isFile ? 1 : -1;
        const value = key === 'size' ? a.size - b.size : key === 'modified' ? +a.modifiedAt - +b.modifiedAt : a.name.localeCompare(b.name, undefined, { numeric: true });
        return (descending ? -1 : 1) * (value || a.name.localeCompare(b.name));
    });
}
export function selectPage(selected: string[], visible: string[], checked: boolean) {
    return checked ? Array.from(new Set([...selected, ...visible])) : selected.filter(name => !visible.includes(name));
}
