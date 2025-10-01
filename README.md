# JotBKV

**JotBKV** (Jot down Binary Key-Value) is a lightweight, append-only key-value store written in TypeScript for [Deno](https://deno.land/).
It is designed to be simple, minimal and easy to embed into projects that need presistent storage without the complexity of a full database engine.

---

## Features

- Append-only log structure (no in-place updates).
- Simple key-value interface (`put`, `get`, `delete`, `list`).
- Pluggable storage codecs for diffrent file formats.
- Cross-platform file locking (Works on Linux, MacOS and Windows).
- CLI tool for direct interaction.

---

## Installing

1. Go to [Releases]() section on GitHub.
2. Download a binary for your system (ubuntu, windows, mac-os).
3. Make it avaible in PATH. For example:
- **Linux/MacOS:**
    ```bash
    chmod +x bkv-ubuntu
    sudo mv bkv-ubuntu /usr/local/bin/bkv
    ```
- **Windows**

    Just put the bkv-windows.exe in the folder that is in the PATH, or run it directly 

## Usage

### CLI

```bash
bkv init --path <file>                  #create storage
bkv set --path <file> <key> <value>     #Insert or update a key
bkv get --path <file> <key>             #get a value
bkv delete --path <file> <key>          #delete a key
bkv list --path <file>                  #get all keys
```

### Falgs

- `--file` <path> - Path to the database file (required).
- `--help` - Show usage help.
- `--version` - Print version.

## License

MIT License - see a [LICENSE]() for details