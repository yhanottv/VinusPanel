<?php

namespace Pterodactyl\Listeners;

use Pterodactyl\Events\Server\Updated;

final class VinusPlayerCompanion
{
    public function handle(Updated $event): void
    {
        $server = $event->server;
        // The installation notification event can be disabled. Follow the actual successful state update instead.
        if (!$server->wasChanged('installed_at') || !$server->installed_at || $server->status !== null) return;
        $class = \Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\PlayerCompanion::class;
        // Let Wings finish its installation callback before querying its state or uploading files.
        try { if (class_exists($class)) \Pterodactyl\Jobs\InstallVinusPlayerCompanion::dispatch($server->id)->delay(10)->afterCommit(); }
        catch (\Throwable $error) { report($error); }
    }
}
