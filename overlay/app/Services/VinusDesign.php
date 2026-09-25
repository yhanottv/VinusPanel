<?php

namespace Pterodactyl\Services;

use Illuminate\Support\Facades\File;

class VinusDesign
{
    public const DEFAULTS = [
        'brand_name' => 'VinusPanel',
        'accent' => '#ff9b52',
        'background' => '#0b0d12',
        'surface' => '#101319',
        'server_card' => '#101319',
        'text' => '#e2e8f0',
        'logo' => '/assets/images/vinus/eagle.png',
        'background_image' => '',
        'servers' => [], 'links' => [], 'cards' => [], 'css_rules' => [], 'options' => [], 'navigation' => [], 'console_rules' => [],
    ];

    public static function optionSchema(): array
    {
        return json_decode(file_get_contents(__DIR__ . '/vinus-design-options.json'), true, 512, JSON_THROW_ON_ERROR);
    }

    public static function optionDefaults(): array
    {
        return array_map(fn ($field) => $field['default'], self::optionSchema());
    }

    public static function validUrl(string $value): bool
    {
        return $value === '' || (bool) preg_match('~^(?:https://[^\s<>"\\\\]+|/(?!/)[^\s<>"\\\\]*)$~i', $value);
    }

    public static function validateStudio(array $value): array
    {
        $rules = ['options' => ['required', 'array:' . implode(',', array_keys(self::optionSchema()))], 'links' => ['present', 'array', 'max:20'], 'cards' => ['present', 'array', 'max:12'], 'css_rules' => ['present', 'array', 'max:30']];
        $rules['navigation'] = ['present','array','max:50'];
        $rules['navigation.*'] = ['array:path,label,visible,order'];
        $rules['navigation.*.path'] = ['required','string','max:100','regex:~^/(?:[a-zA-Z0-9_:/-]*)$~'];
        $rules['navigation.*.label'] = ['present','nullable','string','max:80'];
        $rules['navigation.*.visible'] = ['required','boolean'];
        $rules['navigation.*.order'] = ['required','integer','min:0','max:100'];
        $rules['console_rules'] = ['present','array','max:20'];
        $rules['console_rules.*'] = ['array:search,replacement'];
        $rules['console_rules.*.search'] = ['required','string','min:1','max:200'];
        $rules['console_rules.*.replacement'] = ['present','nullable','string','max:1000'];
        foreach (self::optionSchema() as $key => $field) {
            $rule = ['present'];
            if ($field['kind'] === 'toggle') $rule[] = 'boolean';
            elseif ($field['kind'] === 'range') $rule = array_merge($rule, ['integer', 'min:' . $field['min'], 'max:' . $field['max']]);
            else {
                $rule = array_merge($rule, ['nullable', 'string', 'max:2000']);
                if ($field['kind'] === 'color') $rule[] = 'regex:/^#[0-9a-fA-F]{6}$/';
                if (isset($field['choices'])) $rule[] = \Illuminate\Validation\Rule::in(array_column($field['choices'], 'value'));
                if ($field['kind'] === 'image') $rule[] = function ($attribute, $input, $fail) { if (!self::validUrl($input)) $fail('Use an HTTPS URL or a local absolute path.'); };
            }
            $rules['options.' . $key] = $rule;
        }
        foreach (['links','cards'] as $list) {
            $rules[$list . '.*'] = ['array:label,url,description,featured,visible'];
            $rules[$list . '.*.label'] = ['required','string','max:80'];
            $rules[$list . '.*.url'] = ['required','string','max:2000',function ($attribute, $input, $fail) { if (!self::validUrl($input)) $fail('Use an HTTPS URL or a local absolute path.'); }];
            $rules[$list . '.*.description'] = ['present','nullable','string','max:300'];
            $rules[$list . '.*.featured'] = ['required','boolean'];
            $rules[$list . '.*.visible'] = ['required','boolean'];
        }
        $rules['css_rules.*'] = ['array:selector,declarations,enabled'];
        $rules['css_rules.*.selector'] = ['required','string','max:300','not_regex:/[{}<>@\\\\]/'];
        $rules['css_rules.*.declarations'] = ['present','nullable','string','max:2000','not_regex:/[{}<>@\\\\]|url\s*\(|expression\s*\(|behavior\s*:|-moz-binding|javascript:/i'];
        $rules['css_rules.*.enabled'] = ['required','boolean'];
        $valid = validator($value, $rules)->validate();
        foreach ($valid['options'] as $key => $item) if ($item === null) $valid['options'][$key] = '';
        foreach (['links','cards','navigation','console_rules','css_rules'] as $list) {
            foreach ($valid[$list] as &$item) foreach ($item as &$field) if ($field === null) $field = '';
            unset($item, $field);
        }
        return $valid;
    }

    public static function path(): string
    {
        return storage_path('app/vinuspanel/design.json');
    }

    public static function read(): array
    {
        $path = self::path();
        if (!is_file($path)) {
            return array_replace(self::DEFAULTS, ['options' => self::optionDefaults()]);
        }

        $decoded = json_decode((string) file_get_contents($path), true);
        if (!is_array($decoded)) {
            return array_replace(self::DEFAULTS, ['options' => self::optionDefaults()]);
        }

        $result = array_replace(self::DEFAULTS, $decoded);
        $result['options'] = array_replace(self::optionDefaults(), is_array($result['options']) ? $result['options'] : []);
        return $result;
    }

    public static function write(array $data): void
    {
        $path = self::path();
        File::ensureDirectoryExists(dirname($path));
        $temporary = tempnam(dirname($path), 'design-');
        if ($temporary === false) {
            throw new \RuntimeException('Unable to create a temporary design file.');
        }

        try {
            $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
            if (file_put_contents($temporary, $json . "\n", LOCK_EX) === false) {
                throw new \RuntimeException('Unable to write design settings.');
            }
            chmod($temporary, 0640);
            if (!rename($temporary, $path)) {
                throw new \RuntimeException('Unable to save design settings.');
            }
        } finally {
            if (is_file($temporary)) {
                unlink($temporary);
            }
        }
    }
}
