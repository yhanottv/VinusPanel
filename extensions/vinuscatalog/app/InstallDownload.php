<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

/** Streaming HTTPS downloads; DNS is pinned and checked again for every redirect. */
class InstallDownload
{
    public ?float $deadline = null;
    public ?string $curseforgeKey = null;
    public static function publicAddress(string $address): bool
    {
        if (!filter_var($address, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 | FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) return false;
        $ip = ip2long($address);
        foreach (['100.64.0.0/10', '192.0.0.0/24', '192.0.2.0/24', '198.18.0.0/15', '198.51.100.0/24', '203.0.113.0/24', '224.0.0.0/4'] as $range) {
            [$network, $bits] = explode('/', $range); $mask = -1 << (32 - (int) $bits);
            if (($ip & $mask) === (ip2long($network) & $mask)) return false;
        }
        return true;
    }

    public static function host(string $url): string
    {
        $parts = parse_url($url);
        abort_unless(!preg_match('/[\x00-\x20\\\\]/', $url) && is_array($parts) && ($parts['scheme'] ?? '') === 'https' && !isset($parts['user']) && !isset($parts['pass']) && !isset($parts['port']) && !isset($parts['fragment']) && preg_match('/^[a-z0-9][a-z0-9.-]+\.[a-z]{2,}$/iD', $parts['host'] ?? ''), 422, 'Adresse de téléchargement non valide.');
        return strtolower($parts['host']);
    }

    public function fetch(string $url, string $destination, int $size, ?string $sha512 = null): void
    {
        abort_unless($size > 0 && $size <= 1073741824, 422, 'Taille de téléchargement non valide.');
        for ($redirect = 0; $redirect < 6; $redirect++) {
            $remaining = $this->deadline === null ? 180 : (int) floor($this->deadline - microtime(true));
            abort_unless($remaining > 0, 422, 'La préparation a dépassé le délai autorisé. Aucun remplacement n’a été effectué.');
            $host = self::host($url);
            if ($this->curseforgeKey !== null) abort_unless(CatalogSources::trustedUrl($url, 'curseforge'), 422, 'Redirection CurseForge non autorisée.');
            $addresses = gethostbynamel($host) ?: [];
            abort_unless($addresses, 502, 'Impossible de joindre le fournisseur.');
            foreach ($addresses as $address) abort_unless(self::publicAddress($address), 422, 'Destination réseau non publique refusée.');
            $stream = fopen($destination, 'wb');
            abort_unless($stream, 500, 'Impossible de préparer le téléchargement.');
            $received = 0; $location = null; $curl = curl_init($url);
            curl_setopt_array($curl, [CURLOPT_FOLLOWLOCATION => false, CURLOPT_CONNECTTIMEOUT => min(10, $remaining), CURLOPT_TIMEOUT => min(180, $remaining),
                CURLOPT_PROTOCOLS => CURLPROTO_HTTPS, CURLOPT_RESOLVE => [$host.':443:'.$addresses[0]], CURLOPT_PROXY => '',
                CURLOPT_USERAGENT => 'VinusPanel/3 (github.com/yhanottv/VinusPanel)',
                CURLOPT_HTTPHEADER => $this->curseforgeKey !== null ? ['x-api-key: '.$this->curseforgeKey] : [],
                CURLOPT_HEADERFUNCTION => function ($curl, $header) use (&$location) {
                    if (stripos($header, 'Location:') === 0) $location = trim(substr($header, 9));
                    return strlen($header);
                },
                CURLOPT_WRITEFUNCTION => function ($curl, $data) use ($stream, $size, &$received) {
                    $received += strlen($data);
                    if ($received > $size) return 0;
                    return fwrite($stream, $data);
                },
            ]);
            try {
                $ok = curl_exec($curl);
                $code = curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
            } finally { curl_close($curl); fclose($stream); }
            if ($code >= 300 && $code < 400 && $location) {
                $url = (string) \GuzzleHttp\Psr7\UriResolver::resolve(new \GuzzleHttp\Psr7\Uri($url), new \GuzzleHttp\Psr7\Uri($location));
                continue;
            }
            abort_unless($ok && $code === 200 && $received === $size, 502, 'Le téléchargement est incomplet ou sa taille a changé. Préparez une nouvelle installation.');
            if ($sha512 !== null) abort_unless(hash_equals($sha512, hash_file('sha512', $destination)), 422, 'L’intégrité du téléchargement ne correspond pas.');
            return;
        }
        abort(502, 'Trop de redirections chez le fournisseur.');
    }
}
