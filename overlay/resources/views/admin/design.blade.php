@extends('layouts.admin')

@section('title', 'Design')

@section('content-header')
    <h1>Design <small>Customize your VinusPanel without rebuilding the frontend.</small></h1>
    <ol class="breadcrumb"><li><a href="{{ route('admin.index') }}">Admin</a></li><li class="active">Design</li></ol>
@endsection

@section('content')
    <style>.vinus-server-form[hidden] { display: none !important; }</style>
    @if (session('success'))
        <div class="alert alert-success" role="status">{{ session('success') }}</div>
    @endif

    <form action="{{ route('admin.vinus-design.update') }}" method="POST" enctype="multipart/form-data">
        @csrf
        <div class="box box-primary">
            <div class="box-header with-border"><h2 class="box-title">Panel appearance</h2></div>
            <div class="box-body">
                <p class="text-muted">Changes are visible after refreshing the client panel. Uploaded images stay on this VPS when the theme is upgraded.</p>
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="brand_name">Panel name</label>
                        <input class="form-control" id="brand_name" name="brand_name" maxlength="40" required value="{{ old('brand_name', $design['brand_name']) }}">
                    </div>
                </div>
                <div class="row">
                    @foreach (['accent' => 'Accent color', 'background' => 'Background color', 'surface' => 'Panel surface', 'server_card' => 'Default server card', 'text' => 'Text color'] as $key => $label)
                        <div class="form-group col-sm-6 col-md-4">
                            <label for="{{ $key }}">{{ $label }}</label>
                            <div class="input-group">
                                <input class="form-control" type="color" id="{{ $key }}" name="{{ $key }}" value="{{ old($key, $design[$key]) }}" aria-label="{{ $label }}">
                                <span class="input-group-addon">{{ $design[$key] }}</span>
                            </div>
                        </div>
                    @endforeach
                </div>
                <div class="row">
                    <div class="form-group col-md-6">
                        <label for="logo_file">Panel logo</label>
                        <input type="file" id="logo_file" name="logo_file" accept="image/png,image/jpeg,image/webp">
                        <p class="help-block">PNG, JPEG or WebP, up to 4 MB. Square transparent images work best.</p>
                        <img src="{{ $design['logo'] }}" alt="Current logo" style="max-width:72px;max-height:72px;object-fit:contain">
                        <div class="checkbox"><label><input type="checkbox" name="remove_logo" value="1"> Restore original logo</label></div>
                    </div>
                    <div class="form-group col-md-6">
                        <label for="background_file">Background image</label>
                        <input type="file" id="background_file" name="background_file" accept="image/png,image/jpeg,image/webp">
                        <p class="help-block">PNG, JPEG or WebP, up to 8 MB. A dark, low contrast image keeps text readable.</p>
                        @if ($design['background_image'])
                            <img src="{{ $design['background_image'] }}" alt="Current background" style="max-width:220px;max-height:100px;object-fit:cover">
                        @endif
                        <div class="checkbox"><label><input type="checkbox" name="remove_background" value="1"> Remove background image</label></div>
                    </div>
                </div>
            </div>
            <div class="box-footer"><button class="btn btn-primary pull-right" type="submit">Save panel design</button></div>
        </div>
    </form>

    <div class="box box-primary">
        <div class="box-header with-border"><h2 class="box-title">Individual servers</h2></div>
        <div class="box-body">
            <p class="text-muted">Set an accent color and banner for each server. Only administrators can change these settings; owners and subusers see the result.</p>
            @if ($servers->isEmpty())
                <p>No servers are available yet.</p>
            @else
                <div class="form-group">
                    <label for="vinus-server-select">Choose a server</label>
                    <select class="form-control" id="vinus-server-select">
                        @foreach ($servers as $server)
                            <option value="{{ $server->uuid }}">{{ $server->name }}</option>
                        @endforeach
                    </select>
                </div>
                @foreach ($servers as $server)
                    @php $serverDesign = $design['servers'][$server->uuid] ?? []; @endphp
                    <form class="vinus-server-form" data-server="{{ $server->uuid }}" action="{{ route('admin.vinus-design.server', ['server' => $server->uuid]) }}" method="POST" enctype="multipart/form-data" @if (!$loop->first) hidden @endif>
                        @csrf
                        <div class="row">
                            <div class="form-group col-md-4">
                                <label for="color-{{ $server->uuid }}">Server color</label>
                                <input type="color" class="form-control" id="color-{{ $server->uuid }}" name="color" value="{{ !empty($serverDesign['color']) ? $serverDesign['color'] : $design['accent'] }}">
                                <p class="help-block">Color used on the server card and server header.</p>
                                <div class="checkbox"><label><input type="checkbox" name="remove_color" value="1"> Use default colors</label></div>
                            </div>
                            <div class="form-group col-md-8">
                                <label for="banner-{{ $server->uuid }}">Server banner</label>
                                <input type="file" id="banner-{{ $server->uuid }}" name="banner_file" accept="image/png,image/jpeg,image/webp">
                                <p class="help-block">PNG, JPEG or WebP, up to 8 MB. Recommended ratio: 3:1.</p>
                                @if (!empty($serverDesign['banner']))
                                    <img src="{{ $serverDesign['banner'] }}" alt="Current server banner" style="max-width:320px;max-height:110px;object-fit:cover">
                                @endif
                                <div class="checkbox"><label><input type="checkbox" name="remove_banner" value="1"> Remove banner</label></div>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Save server design</button>
                    </form>
                @endforeach
            @endif
        </div>
    </div>
@endsection

@section('footer-scripts')
    @parent
    <script>
        (function () {
            var select = document.getElementById('vinus-server-select');
            if (!select) return;
            select.addEventListener('change', function () {
                document.querySelectorAll('.vinus-server-form').forEach(function (form) {
                    form.hidden = form.getAttribute('data-server') !== select.value;
                });
            });
        }());
    </script>
@endsection
