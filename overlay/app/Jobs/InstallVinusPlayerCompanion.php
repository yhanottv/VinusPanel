<?php

namespace Pterodactyl\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Pterodactyl\Models\Server;

final class InstallVinusPlayerCompanion implements ShouldQueue
{
    use Dispatchable, Queueable;

    public int $timeout = 120;

    public function __construct(public int $serverId) {}

    public function handle(): void
    {
        $server = Server::find($this->serverId);
        $class = \Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\PlayerCompanion::class;
        if ($server && $server->status === null && $server->installed_at && class_exists($class)) {
            app($class)->automatic($server);
        }
    }
}
