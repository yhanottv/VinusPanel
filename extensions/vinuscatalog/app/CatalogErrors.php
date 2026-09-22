<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\HttpException;

final class CatalogErrors
{
    public function handle(Request $request, Closure $next)
    {
        try { return $next($request); }
        catch (\Illuminate\Validation\ValidationException $error) { throw $error; }
        catch (\Throwable $error) {
            $reference = (string) Str::uuid();
            // Only our explicit HttpException messages are safe for the client.
            $controlled = get_class($error) === HttpException::class;
            $status = $error instanceof HttpException ? $error->getStatusCode() : 500;
            $origin = $error instanceof \Illuminate\Http\Client\ConnectionException ? 'Modrinth'
                : ($error instanceof \Pterodactyl\Exceptions\Http\Connection\DaemonConnectionException ? 'Connexion au serveur (Wings)' : 'Catalogue');
            $detail = $controlled && $error->getMessage() ? $error->getMessage()
                : $origin.' : la demande n’a pas pu aboutir. Contactez un administrateur avec cette référence. Vérifiez les fichiers avant de relancer une installation interrompue.';
            if ($status >= 500) Log::error('Vinus Catalog failure', ['reference' => $reference, 'exception' => $error]);
            return new \Illuminate\Http\JsonResponse(['code' => 'VINUS_CATALOG', 'reference' => $reference, 'errors' => [['detail' => $detail]]], $status);
        }
    }
}
