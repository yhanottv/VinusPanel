<?php

namespace Pterodactyl\Http\Controllers\Admin;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\View\View;
use Pterodactyl\Http\Controllers\Controller;
use Pterodactyl\Models\Server;
use Pterodactyl\Services\VinusDesign;

class VinusDesignController extends Controller
{
    public function index(): View
    {
        return view('admin.design', [
            'design' => VinusDesign::read(),
            'servers' => Server::query()->orderBy('name')->get(['uuid', 'name']),
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        $input = $request->validate([
            'brand_name' => ['required', 'string', 'max:40'],
            'accent' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'background' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'surface' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'server_card' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'text' => ['required', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'logo_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:4096'],
            'background_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
            'remove_logo' => ['nullable', 'boolean'],
            'remove_background' => ['nullable', 'boolean'],
        ]);

        $design = VinusDesign::read();
        foreach (['brand_name', 'accent', 'background', 'surface', 'server_card', 'text'] as $key) {
            $design[$key] = trim($input[$key]);
        }

        if ($request->boolean('remove_logo')) {
            $design['logo'] = VinusDesign::DEFAULTS['logo'];
        }
        if ($request->boolean('remove_background')) {
            $design['background_image'] = '';
        }
        if ($request->hasFile('logo_file')) {
            $design['logo'] = $this->saveImage($request->file('logo_file'));
        }
        if ($request->hasFile('background_file')) {
            $design['background_image'] = $this->saveImage($request->file('background_file'));
        }

        VinusDesign::write($design);
        return redirect()->route('admin.vinus-design')->with('success', 'Design settings saved. Refresh the client panel to see your changes.');
    }

    public function updateServer(Request $request, Server $server): RedirectResponse
    {
        $input = $request->validate([
            'color' => ['nullable', 'regex:/^#[0-9a-fA-F]{6}$/'],
            'remove_color' => ['nullable', 'boolean'],
            'banner_file' => ['nullable', 'file', 'mimes:png,jpg,jpeg,webp', 'max:8192'],
            'remove_banner' => ['nullable', 'boolean'],
        ]);

        $design = VinusDesign::read();
        $entry = $design['servers'][$server->uuid] ?? [];
        $entry['color'] = $request->boolean('remove_color') ? '' : ($input['color'] ?? '');
        if ($request->boolean('remove_banner')) {
            $entry['banner'] = '';
        }
        if ($request->hasFile('banner_file')) {
            $entry['banner'] = $this->saveImage($request->file('banner_file'));
        }
        $design['servers'][$server->uuid] = $entry;
        VinusDesign::write($design);

        return redirect()->route('admin.vinus-design')->with('success', 'Server design saved.');
    }

    private function saveImage(UploadedFile $file): string
    {
        $directory = public_path('assets/vinus/custom');
        File::ensureDirectoryExists($directory);
        $extension = $file->extension();
        $name = bin2hex(random_bytes(16)) . '.' . $extension;
        $file->move($directory, $name);

        return '/assets/vinus/custom/' . $name;
    }
}
