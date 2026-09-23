<?php

namespace Pterodactyl\BlueprintFramework\Extensions\vinuscatalog;

/** Bounded NBT reader for world metadata; does not deserialize game objects. */
final class WorldMetadata
{
    private int $offset = 0;
    private array $found = [];
    private int $tags = 0;
    private function __construct(private string $bytes) {}

    private function take(int $length): string
    {
        abort_unless($length >= 0 && $this->offset + $length <= strlen($this->bytes), 422, 'Métadonnées du monde tronquées.');
        $value = substr($this->bytes, $this->offset, $length); $this->offset += $length; return $value;
    }
    private function byte(): int { return ord($this->take(1)); }
    private function string(): string { return $this->take(unpack('n', $this->take(2))[1]); }
    private function count(): int { $size = unpack('N', $this->take(4))[1]; abort_unless($size <= 1000000, 422, 'Liste de métadonnées trop volumineuse.'); return $size; }
    private function tag(int $type, string $path, int $depth): void
    {
        abort_unless($depth <= 32 && ++$this->tags <= 250000, 422, 'Métadonnées du monde trop complexes.');
        $size = [1=>1,2=>2,3=>4,4=>8,5=>4,6=>8][$type] ?? null;
        if ($size) {
            $value = $this->take($size);
            if ($type === 3 && $path === 'Data/DataVersion') $this->found['data_version'] = unpack('N',$value)[1];
        } elseif ($type === 8) {
            $value = mb_convert_encoding($this->string(), 'UTF-8', 'UTF-8');
            if ($path === 'Data/LevelName') $this->found['name'] = $value;
            if ($path === 'Data/Version/Name') $this->found['minecraft'] = $value;
        } elseif (in_array($type,[7,11,12],true)) $this->take($this->count() * [7=>1,11=>4,12=>8][$type]);
        elseif ($type === 9) {
            $child = $this->byte(); $count = $this->count();
            abort_unless($child <= 12 && ($child !== 0 || $count === 0), 422, 'Liste NBT invalide.');
            for ($i=0;$i<$count;$i++) $this->tag($child,$path.'[]',$depth+1);
        } elseif ($type === 10) {
            while (($child=$this->byte()) !== 0) { $name=$this->string(); $this->tag($child, $path === '' ? $name : $path.'/'.$name, $depth+1); }
        } else abort(422, 'Type de métadonnées du monde non reconnu.');
    }
    public static function read(string $compressed): array
    {
        abort_unless(strlen($compressed) <= 2097152, 422, 'Fichier level.dat trop volumineux.');
        $bytes = @gzdecode($compressed,16777216);
        abort_unless(is_string($bytes) && strlen($bytes) >= 4, 422, 'Le fichier level.dat n’est pas un monde Minecraft Java lisible.');
        $reader = new self($bytes); abort_unless($reader->byte() === 10,422,'Racine NBT invalide.'); $reader->string(); $reader->tag(10,'',0);
        abort_unless(isset($reader->found['data_version']) || isset($reader->found['name']),422,'Les données du monde sont absentes de level.dat.');
        return $reader->found;
    }
    public static function compatible(array $metadata, ?string $current): void
    {
        $world = $metadata['minecraft'] ?? '';
        if (preg_match('/^\d+\.\d+(?:\.\d+)?$/D',$world) && preg_match('/^\d+\.\d+(?:\.\d+)?$/D',$current ?? ''))
            abort_unless(version_compare($world,$current,'<='),422,'Ce monde vient de Minecraft '.$world.', plus récent que le serveur '.$current.'. Mettez le serveur à jour avant de l’importer.');
    }
}
