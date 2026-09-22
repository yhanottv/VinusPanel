<?php

use Illuminate\Support\Facades\Route;
use Pterodactyl\Http\Middleware\Activity\ServerSubject;
use Pterodactyl\Http\Middleware\Api\Client\Server\AuthenticateServerAccess;
use Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogController;

Route::prefix('/servers/{server}')->middleware([\Pterodactyl\BlueprintFramework\Extensions\vinuscatalog\CatalogErrors::class, ServerSubject::class, AuthenticateServerAccess::class, 'throttle:30,1'])->group(function () {
    Route::get('/profile', [CatalogController::class, 'profile']);
    Route::get('/search', [CatalogController::class, 'search']);
    Route::post('/plan', [CatalogController::class, 'plan']);
    Route::post('/install', [CatalogController::class, 'install'])->middleware('throttle:5,1');
});
