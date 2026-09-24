<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogController;

Route::prefix('/servers/{server}/players')->middleware([\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogErrors::class,ServerSubject::class,AuthenticateServerAccess::class,'throttle:120,1,vinusplayers:'])->controller(\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\PlayerController::class)->group(function () {
    Route::get('/','index');
    Route::get('/companion','companion');
    Route::post('/companion','installCompanion')->middleware('throttle:3,1,vinusplayers-install:');
    Route::post('/actions','action')->middleware('throttle:20,1,vinusplayers-action:');
    Route::get('/actions/{id}','result');
    Route::get('/{uuid}/skin','skin');
});

// Map-only capabilities are issued by the fully authenticated session endpoint below.
// The iframe is sandboxed to an opaque origin, so it cannot use panel cookies.
Route::get('/map/{token}/{path}', [\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\BlueMapController::class, 'asset'])
    ->where('token','[a-zA-Z0-9]{64}')->where('path','.+')
    ->withoutMiddleware(['blueprint/api','blueprint/client-api',\Pterodactyl\Http\Middleware\RequireTwoFactorAuthentication::class,'throttle:api.client'])
    ->middleware('throttle:2400,1,vinusbluemap-assets:');

// Numeric throttles share a user key unless they have distinct prefixes. Keep
// browsing the catalog separate from the stricter install limit.
Route::prefix('/servers/{server}')->middleware([\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogErrors::class, ServerSubject::class, AuthenticateServerAccess::class, 'throttle:30,1,vinuscatalog:'])->group(function () {
    Route::get('/profile', [CatalogController::class, 'profile']);
    Route::get('/search', [CatalogController::class, 'search']);
    Route::get('/versions', [CatalogController::class, 'versions']);
    Route::post('/plan', [CatalogController::class, 'plan']);
    Route::post('/install', [CatalogController::class, 'install'])->middleware('throttle:5,1,vinuscatalog-install:');
    Route::prefix('/bluemap')->controller(\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\BlueMapController::class)->group(function () {
        Route::get('/profile','profile');
        Route::post('/plan','plan')->middleware('throttle:6,1,vinusbluemap-plan:');
        Route::post('/install','install')->middleware('throttle:3,1,vinusbluemap-install:');
        Route::post('/resources','resources')->middleware('throttle:3,1,vinusbluemap-resources:');
        Route::post('/session','session');
        Route::delete('/session','revoke');
    });
    Route::prefix('/worlds')->controller(\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\WorldController::class)->group(function () {
        Route::get('/profile', 'profile');
        Route::get('/search', 'search');
        Route::get('/categories', 'categories');
        Route::get('/versions', 'versions');
        Route::post('/plan', 'plan')->middleware('throttle:6,1,vinusworld-plan:');
        Route::post('/install', 'install')->middleware('throttle:3,1,vinusworld-install:');
    });
    Route::prefix('/modpacks')->controller(\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\ModpackController::class)->group(function () {
        Route::get('/search', 'search');
        Route::get('/versions', 'versions');
        Route::post('/plan', 'plan')->middleware('throttle:6,1,vinusmodpack-plan:');
        Route::post('/install', 'install')->middleware('throttle:3,1,vinusmodpack-install:');
    });
    Route::prefix('/software')->controller(\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\SoftwareController::class)->group(function () {
        Route::get('/types', 'types');
        Route::get('/versions', 'versions');
        Route::get('/builds', 'builds');
        Route::post('/plan', 'plan');
        Route::post('/install', 'install')->middleware('throttle:3,1,vinussoftware-install:');
    });
});
