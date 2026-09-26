# Upgrading to VinusPanel 3.2.0

Back up the panel, database, game-server files and local configuration before upgrading. Apply the theme with `install.sh`, then update the optional Vinus Catalog Blueprint package to **1.4.2**. The theme installer does not install the extension automatically.

## Local configuration

Keep `config/vinuscatalog.php`, environment variables, uploaded Design Studio images, saved design settings and server data on your own installation. The repository ships an empty configuration example only. Do not commit API keys, egg/server UUID mappings, panel URLs, backups or screenshots containing personal data.

CurseForge requires an administrator-supplied API key. Modrinth and supported free SpigotMC downloads work without it. Projects whose authors block third-party downloads cannot be installed automatically. The live CurseForge path has not been validated for this release; its parser and transaction tests use fixtures.

## Operations and recovery

Software, modpack and world installation require a stopped server and the permissions shown in the interface. Review the selected version, Java runtime, files and recovery plan before installation. Existing files are retained in operation-specific `vinus-*` directories. A failed rollback can keep the server suspended until the administrator restores the indicated recovery directory. Do not remove these directories until you have checked the new installation.

Software and modpack operations may take several minutes. Configure your reverse proxy and PHP request timeouts for synchronous long-running requests, according to your deployment. A browser timeout does not prove that the server-side operation stopped: check status before retrying.

BlueMap requires a compatible server, an explicit resource-download choice by its administrator, generated map files and sufficient disk/CPU resources. The viewer reads map assets through authenticated panel access; it does not require exposing BlueMap's web port. Its isolated iframe has a dedicated content policy; the panel page's policy is unchanged.

See [implementation and validation](IMPLEMENTATION.md) and [extension configuration](../../extensions/vinuscatalog/README.md).
