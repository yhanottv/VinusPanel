<?php

namespace Pterodactyl\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Http\Middleware\HandleCors;

/** Map capabilities have their own credential-free CORS policy; panel API rules remain unchanged. */
class VinusMapCors extends HandleCors
{
    public static function isMapAsset(Request $request): bool
    {
        return in_array($request->method(), ['GET','HEAD'], true)
            && preg_match('~^api/client/extensions/vinuscatalog/map/[a-zA-Z0-9]{64}/.+$~D', $request->path()) === 1;
    }

    protected function hasMatchingPath(Request $request): bool
    {
        // Do not let the panel's global, credentialed CORS handler overwrite the
        // read-only asset response. The asset controller still validates its capability.
        return !self::isMapAsset($request) && parent::hasMatchingPath($request);
    }
}
