<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

/** Read-only, bounded NBT decoder. Never writes to a player's save. */
final class PlayerNbt
{
    private int $offset = 0;
    private int $nodes = 0;
    private function __construct(private string $bytes) {}
    private function take(int $size): string
    {
        abort_unless($size >= 0 && $this->offset + $size <= strlen($this->bytes), 422, 'Données du joueur tronquées.');
        $out = substr($this->bytes, $this->offset, $size); $this->offset += $size; return $out;
    }
    private function byte(): int { return ord($this->take(1)); }
    private function text(): string { return mb_convert_encoding($this->take(unpack('n', $this->take(2))[1]), 'UTF-8', 'UTF-8'); }
    private function count(): int { $n = unpack('N', $this->take(4))[1]; abort_unless($n <= 100000, 422, 'Données du joueur trop volumineuses.'); return $n; }
    private function value(int $type, int $depth = 0): mixed
    {
        abort_unless($depth <= 32 && ++$this->nodes <= 100000, 422, 'Données du joueur trop complexes.');
        switch ($type) {
            case 1: return unpack('c', $this->take(1))[1];
            case 2: $v=unpack('n',$this->take(2))[1]; return $v>32767?$v-65536:$v;
            case 3: $v=unpack('N',$this->take(4))[1]; return $v>2147483647?$v-4294967296:$v;
            case 4: $this->take(8); return null;
            case 5: return unpack('G',$this->take(4))[1];
            case 6: return unpack('E',$this->take(8))[1];
            case 8: return $this->text();
            case 7: case 11: case 12: $this->take($this->count()*[7=>1,11=>4,12=>8][$type]); return null;
            case 9:
                $child=$this->byte();$count=$this->count();$out=[];
                abort_unless($child<=12&&($child!==0||$count===0),422,'Liste NBT invalide.');
                for($i=0;$i<$count;$i++)$out[]=$this->value($child,$depth+1);return $out;
            case 10:
                $out=[];while(($child=$this->byte())!==0){$name=$this->text();$out[$name]=$this->value($child,$depth+1);}return $out;
            default: abort(422,'Type NBT inconnu.');
        }
    }
    public static function read(string $compressed): array
    {
        abort_unless(strlen($compressed)<=4194304,422,'Sauvegarde du joueur trop volumineuse.');
        $bytes=@gzdecode($compressed,16777216);abort_unless(is_string($bytes),422,'Sauvegarde du joueur illisible.');
        $reader=new self($bytes);abort_unless($reader->byte()===10,422,'Racine NBT invalide.');$reader->text();
        return $reader->value(10);
    }
    public static function label(mixed $value): ?string
    {
        if(!is_string($value))return null;
        $json=json_decode($value,true);
        if(is_string($json))$value=$json;
        elseif(is_array($json))$value=($json['text']??'').implode('',array_map(fn($p)=>is_string($p)?$p:($p['text']??''),$json['extra']??[]));
        return mb_substr(preg_replace('/§./u','',$value)??'',0,160)?:null;
    }
    public static function items(mixed $items): array
    {
        $out=[];foreach(array_slice(is_array($items)?$items:[],0,64) as $item){
            $id=$item['id']??'';$slot=$item['Slot']??null;
            if(!is_string($id)||!preg_match('/^[a-z0-9_.-]+:[a-z0-9_\/.-]+$/D',$id)||!is_int($slot))continue;
            $components=$item['components']??[];$tag=$item['tag']??[];
            $out[]=['slot'=>$slot===150?-106:$slot,'id'=>$id,'count'=>max(1,min(999,(int)($item['count']??$item['Count']??1))),
                'name'=>self::label($components['minecraft:custom_name']??$tag['display']['Name']??null),
                'enchanted'=>!empty($components['minecraft:enchantments']??$components['minecraft:stored_enchantments']??$tag['Enchantments']??$tag['StoredEnchantments']??[]),
                'damage'=>max(0,(int)($components['minecraft:damage']??$tag['Damage']??0))];
        }return $out;
    }
    /** Server files are editable by their owner: normalize every snapshot before returning it. */
    public static function snapshot(array $data): array
    {
        $out=[];
        foreach(['health'=>1000000,'max_health'=>1000000,'food'=>20,'armor'=>1000000,'level'=>2147483647,'xp_progress'=>1,'xp_total'=>PHP_INT_MAX,'updated_at'=>PHP_INT_MAX] as $key=>$max){
            $v=$data[$key]??null;$out[$key]=(is_int($v)||is_float($v))&&is_finite((float)$v)?max(0,min($max,$v)):null;
        }
        $out['game_mode']=in_array($data['game_mode']??null,['survival','creative','adventure','spectator'],true)?$data['game_mode']:null;
        $out['dimension']=is_string($data['dimension']??null)?mb_substr($data['dimension'],0,100):null;
        foreach(['inventory','ender_chest'] as $key){
            $out[$key]=[];
            foreach(array_slice(is_array($data[$key]??null)?$data[$key]:[],0,64) as $item){
                if(!is_array($item)||!is_string($item['id']??null)||!preg_match('/^[a-z0-9_.-]+:[a-z0-9_\/.-]+$/D',$item['id'])||!is_int($item['slot']??null))continue;
                $out[$key][]=['id'=>substr($item['id'],0,160),'slot'=>$item['slot'],'count'=>is_int($item['count']??null)?max(1,min(999,$item['count'])):1,
                    'name'=>self::label($item['name']??null),'enchanted'=>($item['enchanted']??false)===true,'damage'=>is_int($item['damage']??null)?max(0,$item['damage']):0];
            }
        }
        return $out;
    }
    public static function profile(array $data): array
    {
        $number=fn($key,$default=null)=>isset($data[$key])&&is_numeric($data[$key])&&is_finite((float)$data[$key])?(float)$data[$key]:$default;
        return ['health'=>$number('Health'),'max_health'=>null,'food'=>$number('foodLevel'),'level'=>$number('XpLevel'),
            'xp_progress'=>$number('XpP'),'xp_total'=>$number('XpTotal'),'armor'=>null,
            'game_mode'=>[0=>'survival',1=>'creative',2=>'adventure',3=>'spectator'][(int)($data['playerGameType']??-1)]??null,
            'dimension'=>is_string($data['Dimension']??null)?mb_substr($data['Dimension'],0,100):null,
            'inventory'=>self::items($data['Inventory']??[]),'ender_chest'=>self::items($data['EnderItems']??[])];
    }
}
