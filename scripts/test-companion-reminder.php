<?php
/** Isolated in-memory reminder tests. No game files, power actions or persistent cache writes. */
$panel = rtrim($argv[1] ?? '', '/');
require $panel.'/vendor/autoload.php';
$app = require $panel.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
require ($argv[2] ?? dirname(__DIR__).'/extensions/vinuscatalog/app').'/CompanionReminder.php';
use Illuminate\Support\Facades\Cache;
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CompanionReminder;
Cache::swap(new Illuminate\Cache\Repository(new Illuminate\Cache\ArrayStore()));
$checks = 0;
function check($condition) { global $checks; if (!$condition) throw new RuntimeException('Reminder check failed: '.($checks+1)); $checks++; }
check(CompanionReminder::pending(1, 'server-a') === null);
$first = CompanionReminder::queue(1, 'server-a');
check(CompanionReminder::pending(1, 'server-a') === $first);
check(CompanionReminder::pending(2, 'server-a') === null);
check(CompanionReminder::pending(1, 'server-b') === null);
$second = CompanionReminder::queue(1, 'server-a');
check($first !== $second);
CompanionReminder::dismiss(1, 'server-a', $first);
check(CompanionReminder::pending(1, 'server-a') === $second);
CompanionReminder::dismiss(2, 'server-a', $second);
check(CompanionReminder::pending(1, 'server-a') === $second);
CompanionReminder::dismiss(1, 'server-a', $second);
check(CompanionReminder::pending(1, 'server-a') === null);
CompanionReminder::queue(1, 'server-a');
Illuminate\Support\Carbon::setTestNow(now()->addDays(8));
check(CompanionReminder::pending(1, 'server-a') === null);
Illuminate\Support\Carbon::setTestNow();
echo "Companion reminder: $checks checks passed.\n";
