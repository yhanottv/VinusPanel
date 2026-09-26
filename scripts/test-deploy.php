<?php
/** Run against a Pterodactyl installation: php scripts/test-deploy.php /var/www/pterodactyl */
$panel = rtrim($argv[1] ?? '', '/');
if (!$panel || !is_file($panel . '/vendor/autoload.php')) throw new RuntimeException('Pass the Pterodactyl installation path.');
require $panel . '/vendor/autoload.php';

$class = 'Pterodactyl\Http\Controllers\Admin\VinusDeployController';
if (!class_exists($class)) require __DIR__ . '/../overlay/app/Http/Controllers/Admin/VinusDeployController.php';

$count = 0;
$check = function ($condition, $label) use (&$count) { if (!$condition) throw new RuntimeException($label); $count++; };

// cgroup v2 "cpu.max": "<quota|max> <period>".
$check($class::coresFromCpuMax('max 100000') === null, 'Unlimited cgroup must fall back to the host core count, not 1 core');
$check($class::coresFromCpuMax("max 100000\n") === null, 'Trailing newline on unlimited cgroup');
$check($class::coresFromCpuMax('max') === null, 'Bare max is unlimited');
$check($class::coresFromCpuMax('') === null, 'Empty line is unlimited');
$check($class::coresFromCpuMax('200000 100000') === 2, 'Two full cores');
$check($class::coresFromCpuMax("400000 100000\n") === 4, 'Four cores with newline');
$check($class::coresFromCpuMax('150000 100000') === 2, 'Fractional quota rounds up');
$check($class::coresFromCpuMax('50000 100000') === 1, 'Sub-core quota is at least one core');
$check($class::coresFromCpuMax('100000') === 1, 'Missing period defaults to 100000');
$check($class::coresFromCpuMax('0 100000') === null, 'Zero quota is ignored');
$check($class::coresFromCpuMax('100000 0') === null, 'Zero period is ignored');

echo 'Deploy helpers: ' . $count . " checks passed.\n";
