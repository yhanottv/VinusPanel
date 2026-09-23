<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Pterodactyl\Repositories\Wings\DaemonFileRepository;
use Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException;
use GuzzleHttp\Exception\TransferException;

class InstallFiles extends DaemonFileRepository
{
    public function download(string $path, string $local, int $size): void
    {
        abort_unless($size > 0 && $size <= 536870912, 422, 'L’archive doit mesurer au plus 512 Mio.');
        try {
            $this->getHttpClient()->get('/api/servers/'.$this->server->uuid.'/files/contents', [
                'query' => ['file' => $path], 'sink' => $local, 'timeout' => 180,
                'progress' => function ($total, $received) use ($size) { abort_unless(max($total, $received) <= $size, 422, 'L’archive a changé pendant sa lecture.'); },
            ]);
            abort_unless(filesize($local) === $size, 422, 'La lecture de l’archive est incomplète.');
        } catch (TransferException $exception) { throw new DaemonConnectionException($exception); }
    }

    public function upload(string $path, string $local): void
    {
        $stream = fopen($local, 'rb');
        try {
            $this->getHttpClient()->post('/api/servers/'.$this->server->uuid.'/files/write', [
                'query' => ['file' => $path], 'body' => $stream, 'timeout' => 180,
            ]);
        } catch (TransferException $exception) { throw new DaemonConnectionException($exception); }
        finally { if (is_resource($stream)) fclose($stream); }
    }
}
