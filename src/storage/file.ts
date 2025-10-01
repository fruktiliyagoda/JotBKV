export interface FileHandle {
    file: Deno.FsFile;
    path: string;

    lockFile?: Deno.FsFile | null;
    lockedWithLockFile?: boolean
}

export async function openFile(path: string): Promise<FileHandle> {
    const file = await Deno.open(path, { read: true, write: true, create: true });
    const lockPath = path + ".lock";

    try {
        const lockFile = await Deno.open(lockPath, { write: true, createNew: true });
        try {
            await lockFile.write(new TextEncoder().encode(String(Deno.pid)));
        } catch {}
        return { file, path, lockFile, lockedWithLockFile: true }
    } catch (err) {
        file.close();
        if (err instanceof Deno.errors.AlreadyExists) {
            throw new Error(`Database is locked by another process (lock file exists: ${lockPath}`);                
        }
        throw err;
    }
}

export async function closeFile(handle: FileHandle): Promise<void> {
    if (handle.lockedWithLockFile && handle.lockFile) {
        const lockPath = handle.path + ".lock";
        try {
            handle.lockFile.close();
            await Deno.remove(lockPath);
        } catch {}
    }
    
    try {
        handle.file.close();
    } catch {}
}

export async function readBlock(
    handle: FileHandle,
    offset: number,
    length: number
): Promise<Uint8Array> {
    if (length === 0) return new Uint8Array(0);

    await handle.file.seek(offset, Deno.SeekMode.Start);
    const buffer = new Uint8Array(length);
    let read = 0;

    while (read < length) {
        const chunk = await handle.file.read(buffer.subarray(read));
        if (chunk === null) {
            throw new Error(`Unexpected EOF while reading block at offset=${offset}, expected ${length} bytes, got ${read}`);
        }
        read += chunk;
    }
    return buffer;
}

export async function appendBlock(
    handle: FileHandle,
    data: Uint8Array
): Promise<number> {
    const offset = (await handle.file.seek(0, Deno.SeekMode.End));

    let written = 0;
    while (written < data.length) {
        const w = await handle.file.write(data.subarray(written));
        if (w === 0) throw new Error("write returned 0 bytes written");
        written += w;
    }

    syncFile(handle);
    return offset;
}

export async function syncFile(handle: FileHandle): Promise<void> {
    try {
        await handle.file.sync();
    } catch (err) {
        console.warn("Warning: file.sync() failed:", err);        
    }
}