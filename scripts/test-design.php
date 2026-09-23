<?php
/** Run against a Pterodactyl installation: php scripts/test-design.php /var/www/pterodactyl */
$panel = rtrim($argv[1] ?? '', '/');
if (!$panel || !is_file($panel . '/vendor/autoload.php')) throw new RuntimeException('Pass the Pterodactyl installation path.');
require $panel . '/vendor/autoload.php';
require __DIR__ . '/../overlay/app/Services/VinusDesign.php';
require __DIR__ . '/../overlay/app/Http/Middleware/SetSecurityHeaders.php';
$app = require $panel . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Pterodactyl\Services\VinusDesign;
$checks = 0;
$expect = function ($condition, $message) use (&$checks) { if (!$condition) throw new RuntimeException($message); $checks++; };
$base = ['options'=>VinusDesign::optionDefaults(),'links'=>[],'cards'=>[],'css_rules'=>[],'navigation'=>[],'console_rules'=>[]];
$valid = VinusDesign::validateStudio($base);
$expect($valid['options']['content_width'] === 'full', 'Full-width default must remain intact.');
$expect($valid['options']['blur_address'] === true, 'Existing address privacy must remain intact.');
$reject = function ($input) use ($expect) { try { VinusDesign::validateStudio($input); } catch (Illuminate\Validation\ValidationException $e) { $expect(true, 'Validation rejected unsafe input.'); return; } throw new RuntimeException('Unsafe input was accepted.'); };
foreach ([['radius',-1],['radius',999],['sidebar_style','unknown'],['logo_light','javascript:alert(1)'],['favicon','//example.com/file.png'],['unknown_option',true]] as [$key,$value]) { $input=$base;$input['options'][$key]=$value;$reject($input); }
foreach (['background:url(https://example.com)','color:red;</style>','@import test','behavior:test','color:red\\3b','a{color:red}'] as $css) { $input=$base;$input['css_rules']=[['selector'=>'.app-shell h1','declarations'=>$css,'enabled'=>true]];$reject($input); }
$input=$base;$input['links']=[['label'=>'Unsafe','url'=>'data:text/html,test','description'=>'','featured'=>false,'visible'=>true]];$reject($input);
$input=$base;$input['css_rules']=[['selector'=>'.app-shell h1','declarations'=>'letter-spacing: -.03em; color: #f0f0f0;','enabled'=>true]];VinusDesign::validateStudio($input);$expect(true,'Valid CSS supported.');
$middleware = new Pterodactyl\Http\Middleware\SetSecurityHeaders();
foreach ([['/',false,'DENY'],['/?vinus-preview=1',false,'DENY'],['/',true,'DENY'],['/admin?vinus-preview=1',true,'DENY'],['/api/client?vinus-preview=1',true,'DENY'],['/?vinus-preview=1',true,'SAMEORIGIN'],['/server/abcdef12/overview?vinus-preview=1',true,'SAMEORIGIN'],['/design/preview/login?vinus-preview=1',true,'SAMEORIGIN']] as [$url,$admin,$header]) {
    $request=Illuminate\Http\Request::create($url,'GET');$request->setUserResolver(fn()=> $admin ? (object)['root_admin'=>true] : null);
    $response=$middleware->handle($request,fn()=>new Illuminate\Http\Response('',200,['Content-Type'=>'text/html']));
    $expect($response->headers->get('X-Frame-Options')===$header,'Incorrect frame policy for '.$url);
    if($header==='SAMEORIGIN')$expect($response->headers->get('Content-Security-Policy')==="frame-ancestors 'self'",'External embedding must stay blocked.');
}
$request=Illuminate\Http\Request::create('/?vinus-preview=1','GET');$request->setUserResolver(fn()=>(object)['root_admin'=>true]);
$response=$middleware->handle($request,fn()=>new Illuminate\Http\Response('',200,['Content-Type'=>'text/html','X-Frame-Options'=>'DENY']));
$expect($response->headers->get('X-Frame-Options')==='DENY','An explicit frame policy must not be overwritten.');
echo "Design validation: {$checks} checks passed.\n";
