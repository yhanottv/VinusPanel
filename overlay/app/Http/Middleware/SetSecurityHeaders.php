<?php

namespace Pterodactyl\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

/** Same-origin embedding is limited to authenticated administrators previewing the theme. */
class SetSecurityHeaders
{
    public function handle(Request $request, Closure $next): mixed
    {
        $response = $next($request);
        $path = $request->path();
        $allowed = $path === '/' || $path === 'design/preview/login' || preg_match('~^server/[a-f0-9-]+(?:/overview)?$~i', $path);
        if ($request->isMethod('GET') && $request->query('vinus-preview') === '1'
            && $request->user()?->root_admin && $allowed && $response->isSuccessful()
            && str_contains($response->headers->get('Content-Type', ''), 'text/html')
            && !$response->headers->has('X-Frame-Options')) {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
            $existing = $response->headers->get('Content-Security-Policy', '');
            if (!str_contains(strtolower($existing), 'frame-ancestors')) {
                $response->headers->set('Content-Security-Policy', $existing . ($existing ? '; ' : '') . "frame-ancestors 'self'");
            }
        }
        foreach (['X-Frame-Options' => 'DENY', 'X-Content-Type-Options' => 'nosniff', 'X-XSS-Protection' => '1; mode=block', 'Referrer-Policy' => 'no-referrer-when-downgrade'] as $key => $value) {
            if (!$response->headers->has($key)) $response->headers->set($key, $value);
        }
        return $response;
    }
}
