@extends('layouts.admin')

@section('title', 'Administration')

@section('content-header')
    <h1><span data-vinus-en="Administration" data-vinus-fr="Administration">Administration</span><small data-vinus-en="Your servers, infrastructure and access in one place." data-vinus-fr="Vos serveurs, votre infrastructure et vos accès au même endroit.">Your servers, infrastructure and access in one place.</small></h1>
@endsection

@section('content')
<div class="vinus-admin-actions">
    <a class="vinus-admin-action" href="{{ route('admin.servers') }}"><i class="fa fa-server" aria-hidden="true"></i><span><strong data-vinus-en="Servers" data-vinus-fr="Serveurs">Servers</strong><small data-vinus-en="Create instances and manage their resources." data-vinus-fr="Créez des instances et gérez leurs ressources.">Create instances and manage their resources.</small></span></a>
    <a class="vinus-admin-action" href="{{ route('admin.nodes') }}"><i class="fa fa-sitemap" aria-hidden="true"></i><span><strong data-vinus-en="Nodes" data-vinus-fr="Nodes">Nodes</strong><small data-vinus-en="Manage machines, capacity and allocations." data-vinus-fr="Gérez les machines, la capacité et les allocations.">Manage machines, capacity and allocations.</small></span></a>
    <a class="vinus-admin-action" href="{{ route('admin.users') }}"><i class="fa fa-users" aria-hidden="true"></i><span><strong data-vinus-en="Users" data-vinus-fr="Utilisateurs">Users</strong><small data-vinus-en="Find accounts and manage their access." data-vinus-fr="Retrouvez les comptes et gérez leurs accès.">Find accounts and manage their access.</small></span></a>
</div>
<div class="box">
    <div class="box-header with-border"><h2 class="box-title" data-vinus-en="Panel status" data-vinus-fr="État du panel">Panel status</h2></div>
    <div class="box-body">
        <p><strong>Pterodactyl</strong> <code>{{ config('app.version') }}</code></p>
        @if ($version->isLatestPanel())
            <p class="text-muted" data-vinus-en="Your panel is up to date." data-vinus-fr="Votre panel est à jour.">Your panel is up to date.</p>
        @else
            <div class="alert alert-warning"><span data-vinus-en="An update is available:" data-vinus-fr="Une mise à jour est disponible :">An update is available:</span> <a href="https://github.com/Pterodactyl/Panel/releases/v{{ $version->getPanel() }}" target="_blank" rel="noopener noreferrer">{{ $version->getPanel() }}</a>. <a href="https://pterodactyl.io/panel/1.0/updating.html" target="_blank" rel="noopener noreferrer" data-vinus-en="Read the update instructions" data-vinus-fr="Consulter la procédure de mise à jour">Read the update instructions</a></div>
        @endif
    </div>
</div>
<div class="box">
    <div class="box-header with-border"><h2 class="box-title" data-vinus-en="Configuration" data-vinus-fr="Configuration">Configuration</h2></div>
    <div class="box-body vinus-admin-links">
        <a href="{{ route('admin.nests') }}" data-vinus-en="Nests & eggs" data-vinus-fr="Nests et eggs">Nests & eggs</a>
        <a href="{{ route('admin.locations') }}" data-vinus-en="Locations" data-vinus-fr="Emplacements">Locations</a>
        <a href="{{ route('admin.databases') }}" data-vinus-en="Database hosts" data-vinus-fr="Hôtes de bases de données">Database hosts</a>
        <a href="{{ route('admin.settings') }}" data-vinus-en="Panel settings" data-vinus-fr="Paramètres du panel">Panel settings</a>
    </div>
</div>
<div class="vinus-admin-links">
    <a href="https://pterodactyl.io" target="_blank" rel="noopener noreferrer">Documentation</a>
    <a href="{{ $version->getDiscord() }}" target="_blank" rel="noopener noreferrer" data-vinus-en="Community support" data-vinus-fr="Assistance communautaire">Community support</a>
    <a href="https://github.com/pterodactyl/panel" target="_blank" rel="noopener noreferrer">GitHub</a>
    <a href="{{ $version->getDonations() }}" target="_blank" rel="noopener noreferrer" data-vinus-en="Support Pterodactyl" data-vinus-fr="Soutenir Pterodactyl">Support Pterodactyl</a>
</div>
@endsection
