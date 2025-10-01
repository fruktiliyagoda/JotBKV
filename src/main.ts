import { BKVDatabase } from "./storage/db.ts";

async function main() {
    const args = Deno.args;

    if (args.includes('--help')) {
        console.log(`BKVDatabase\n\nUsage:\n    --help              Show this help message\n    --version           Show the version\n    set <key> <value>   Add/change new record\n    get <key>           Get record value by key\n    delete <key>        Delete record\n    list                Show list of record keys`);
        Deno.exit(0);
    }

    if (args.includes('--version')) {
        console.log('v1.0.0');
        Deno.exit(0)
    }

    const fileIndex = args.indexOf("--path");

    if (fileIndex < 0 || !args[fileIndex + 1]) {
        console.error("Error: --path <path> is required");
        console.log("Usage: --path <path> init | set <key> <value> | get <key> | delete <key> | list");
        
    }
    const filepath = args[fileIndex + 1];
    args.splice(fileIndex, 2);

    const [cmd, ...cmdArgs] = args;
    const db = new BKVDatabase(filepath);

    switch (cmd) {
        case "init": {
            await db.open();
            console.log(`Initialized database at ${filepath}`);
            await db.close();
            break;
        }

        case "set": {
            const [key, value] = cmdArgs;
            if (!key || !value) {
                console.error("Usage: set <key> <value>");
                return;
            }
            await db.open();
            await db.set(key, new TextEncoder().encode(value));
            console.log(`Set ${key} => ${value}`);
            await db.close();
            break;
        }

        case "get": {
            const [key] = cmdArgs;
            if (!key) {
                console.error("Usage: get <key>");
                return;
            }
            await db.open();
            const val = await db.get(key);
            if (val) {
                console.log(`${key} => ${new TextDecoder().decode(val)}`);
            } else {
                console.log(`Key not found: ${key}`);
            }
            await db.close();
            break;
        }

        case "delete": {
            const [key] = cmdArgs;
            if (!key) {
                console.error("Usage: delete <key>");
                return;
            }
            await db.open();
            await db.delete(key);
            console.log(`Deleted" ${key}`);
            await db.close();
            break;
        }

        case "list": {
            await db.open()
            console.log("Keys in database:");
            for (const key of db["index"].keys()) {
                console.log("- " + key);
            }
            await db.close();
            break;
        }

        default:
            console.log("Usage: --path <path> init | set <key> <value> | get <key> | delete <key> | list");            
    }
}

if (import.meta.main) {
    main();
}