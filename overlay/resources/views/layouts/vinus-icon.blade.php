@php
$vinusIconPaths = [
    'home' => 'M3 10 12 3l9 7v10H3Z M9 20v-7h6v7',
    'server' => 'M4 3h16v7H4Z M4 14h16v7H4Z M7 6.5h.01 M7 17.5h.01 M11 6.5h6 M11 17.5h6',
    'nodes' => 'M9 3h6v5H9Z M3 16h6v5H3Z M15 16h6v5h-6Z M12 8v4 M6 16v-4h12v4',
    'users' => 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M13 4a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0',
    'boxes' => 'm12 3 8 4.5v9L12 21l-8-4.5v-9L12 3 M4 7.5l8 4.5 8-4.5 M12 12v9 M8 5.2l8 4.6',
    'pin' => 'M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    'database' => 'M20 6c0 2-3.6 3-8 3S4 8 4 6s3.6-3 8-3 8 1 8 3Z M4 6v12c0 2 3.6 3 8 3s8-1 8-3V6 M4 12c0 2 3.6 3 8 3s8-1 8-3',
    'settings' => 'M4 6h16 M4 12h16 M4 18h16 M8 3v6 M16 9v6 M10 15v6',
    'key' => 'M15 3a6 6 0 0 0-5.5 8.5L3 18v3h3v-3h3v-3l2.5-2.5A6 6 0 1 0 15 3Z M17 7h.01',
    'arrow' => 'M5 12h14 M14 7l5 5-5 5',
    'mount' => 'M4 5h16v14H4Z M8 9h8 M8 13h5',
];
@endphp
<svg class="vinus-admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="{{ $vinusIconPaths[$name] ?? $vinusIconPaths['boxes'] }}"/></svg>
