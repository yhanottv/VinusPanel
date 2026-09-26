<?php

require ($argv[1] ?? '/var/www/pterodactyl').'/vendor/autoload.php';

use Illuminate\Cache\ArrayStore;
use Illuminate\Cache\RateLimiter;
use Illuminate\Cache\Repository;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Http\Request;
use Illuminate\Routing\Middleware\ThrottleRequests;
use Symfony\Component\HttpFoundation\Response;

$routes = file_get_contents(__DIR__.'/../routes/client.php');
// Only the catalog browsing and install limits matter here; other routes (players, BlueMap, worlds…) have their own prefixes.
$matches = [];
foreach (['vinuscatalog:', 'vinuscatalog-install:'] as $prefix) {
    if (!preg_match("/throttle:(\d+),(\d+),(".preg_quote($prefix, '/').")'/", $routes, $found)) throw new RuntimeException('Expected separate catalog and install rate limits.');
    $matches[] = $found;
}
if ($matches[0][3] === $matches[1][3]) throw new RuntimeException('Catalog and install limits must not share a counter.');

$middleware = new ThrottleRequests(new RateLimiter(new Repository(new ArrayStore())));
$request = Request::create('/catalog', 'POST');
$request->setUserResolver(fn () => new class { public function getAuthIdentifier() { return 123; } });
$next = fn () => new Response('ok', 200);
$browse = fn ($next) => $middleware->handle($request, $next, (int) $matches[0][1], (int) $matches[0][2], $matches[0][3]);
$install = fn () => $browse(fn () => $middleware->handle($request, $next, (int) $matches[1][1], (int) $matches[1][2], $matches[1][3]));

for ($i = 0; $i < 8; $i++) $browse($next);
for ($i = 0; $i < 5; $i++) $install();

try {
    $install();
    throw new RuntimeException('Sixth install was not rate limited.');
} catch (ThrottleRequestsException $exception) {
    echo "Catalog browsing does not exhaust the install limit; sixth install is blocked.\n";
}
