<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/** An invitation only: this never installs files or changes server power. */
final class CompanionReminder
{
    private static function key(int $user, string $server): string
    {
        return 'vinusplayers:followup:'.$user.':'.$server;
    }

    public static function queue(int $user, string $server): string
    {
        $key = self::key($user, $server);
        return Cache::lock($key.':lock', 5)->block(3, function () use ($key) {
            $token = (string) floor(microtime(true) * 1000).':'.Str::random(32);
            Cache::put($key, $token, 7 * 86400);
            return $token;
        });
    }

    public static function pending(int $user, string $server): ?string
    {
        return Cache::get(self::key($user, $server));
    }

    public static function dismiss(int $user, string $server, string $expected): void
    {
        $key = self::key($user, $server);
        Cache::lock($key.':lock', 5)->block(3, function () use ($key, $expected) {
            if (Cache::get($key) === $expected) Cache::forget($key);
        });
    }
}
