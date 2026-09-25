@include('blueprint.dashboard.dashboard')
<!DOCTYPE html>
@php
    $vinusDesign = \Pterodactyl\Services\VinusDesign::read();
    if (!Auth::check()) {
        $vinusDesign['servers'] = [];
    } elseif (!Auth::user()->root_admin) {
        $accessible = Auth::user()->accessibleServers()->pluck('servers.uuid')->all();
        $vinusDesign['servers'] = array_intersect_key($vinusDesign['servers'], array_flip($accessible));
    }
    $accentRgb = implode(', ', array_map('hexdec', str_split(substr($vinusDesign['accent'], 1), 2)));
@endphp
<html lang="fr" style="--vinus-accent: {{ $vinusDesign['accent'] }}; --vinus-accent-rgb: {{ $accentRgb }}; --vinus-bg: {{ $vinusDesign['background'] }}; --vinus-glass: {{ $vinusDesign['surface'] }}; --vinus-surface: {{ $vinusDesign['surface'] }}; --vinus-server-card: {{ $vinusDesign['server_card'] }}; --vinus-text: {{ $vinusDesign['text'] }}; --vinus-background-image: {{ $vinusDesign['background_image'] ? 'url(' . $vinusDesign['background_image'] . ')' : 'none' }};">
    <head>
        <title>{{ $vinusDesign['brand_name'] }}</title>

        @section('meta')
            <meta charset="utf-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <meta content="width=device-width, initial-scale=1" name="viewport">
            <meta name="csrf-token" content="{{ csrf_token() }}">
            <meta name="robots" content="noindex">
            <meta name="description" content="{{ $vinusDesign['options']['description'] ?? '' }}">
            @if(!empty($vinusDesign['options']['social_image']))<meta property="og:image" content="{{ $vinusDesign['options']['social_image'] }}">@endif
            <link rel="apple-touch-icon" href="{{ $vinusDesign['logo'] }}">
            <link rel="icon" href="{{ $vinusDesign['options']['favicon'] ?: $vinusDesign['logo'] }}">
            <link rel="manifest" href="/favicons/manifest.json">
            <link rel="mask-icon" href="/favicons/safari-pinned-tab.svg" color="#bc6e3c">
            <link rel="shortcut icon" href="/favicons/favicon.ico">
            <meta name="msapplication-config" content="/favicons/browserconfig.xml">
            <meta name="theme-color" content="#111315">
        @show

        @section('user-data')
            <script>window.VinusDesign = @json($vinusDesign, JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT);</script>
            @if(!is_null(Auth::user()))
                <script>
                    window.PterodactylUser = {!! json_encode(Auth::user()->toVueObject()) !!};
                </script>
            @endif
            @if(!empty($siteConfiguration))
                <script>
                    window.SiteConfiguration = {!! json_encode($siteConfiguration) !!};
                </script>
            @endif
        @show

        @yield('assets')
        @yield('blueprint.lib')

        @include('layouts.scripts')
    </head>
    <body class="{{ $css['body'] ?? 'bg-neutral-50' }}">
        @section('content')
            @yield('above-container')
            @yield('container')
            @yield('below-container')
            @yield('blueprint.wrappers')
        @show
        @section('scripts')
            {!! $asset->js('main.js') !!}
        @show
    </body>
</html>
