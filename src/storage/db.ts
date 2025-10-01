import { FileHandle, openFile, closeFile, readBlock, appendBlock } from './file.ts'
import { encodeEntry, decodeEntry, Entry, RecordType } from './entry.ts';
import { encodeHeader, decodeHeader, HEADER_BYTES } from '@utils/codec.ts';

export class BKVDatabase {
    private fileHandle: FileHandle | null = null;
    private index: Map<string, { offset: number; length: number }> = new Map();

    constructor(private filepath: string) {}

    async open() {
        this.fileHandle = await openFile(this.filepath);
        const stat = await Deno.stat(this.filepath);

        if (stat.size === 0) {
            const header = encodeHeader();
            await appendBlock(this.fileHandle, header);
        } else {
            const headerBytes = await readBlock(this.fileHandle, 0, HEADER_BYTES);
            const header = decodeHeader(headerBytes);
            console.log("Opened BKV file:", header);
        }

        await this.loadIndex();
    }

    async close() {
        if (!this.fileHandle) return;
        await closeFile(this.fileHandle);
        this.fileHandle = null;
    }

    private async loadIndex() {
        if (!this.fileHandle) return;

        const stat = await Deno.stat(this.filepath);
        if (stat.size <= HEADER_BYTES) return;

        let offset = HEADER_BYTES;

        while (offset < stat.size) {
            const buffer = await readBlock(this.fileHandle, offset, stat.size - offset);

            const { entry, bytesRead } = decodeEntry(buffer);

            if (entry.type === 2) {
                this.index.delete(entry.key);
            } else {
                this.index.set(entry.key, { offset, length: bytesRead });
            }

            offset += bytesRead;
        }
    }

    async set(key: string, value: Uint8Array) {
        if (!this.fileHandle) throw new Error("Database isn't open");

        const entry: Entry = { type: RecordType.Put, key, value };
        const encoded = encodeEntry(entry);

        const offset = await appendBlock(this.fileHandle, encoded);
        this.index.set(key, { offset, length: encoded.length });
    }

    async get(key: string): Promise<Uint8Array | undefined> {
        if (!this.fileHandle) throw new Error("Database isn't open");

        const meta = this.index.get(key);
        if (!meta) return undefined;

        const buffer = await readBlock(this.fileHandle, meta.offset, meta.length);
        const { entry } = decodeEntry(buffer);
        return entry.value;
    }

    async delete(key: string) {
        if (!this.fileHandle) throw new Error("Database isn't open");
        if (!this.index.has(key)) return;
        
        const entry: Entry = { type: RecordType.Delete, key };
        const encoded = encodeEntry(entry);

        await appendBlock(this.fileHandle, encoded);
        this.index.delete(key);
    }

    has(key: string): boolean {
        return this.index.has(key);
    }

    async compact() {
        if (!this.fileHandle) throw new Error("Database isn't open");

        const newPath = this.filepath + ".tmp";
        const newFileHandle = await openFile(newPath);

        const header = encodeHeader();
        await appendBlock(newFileHandle, header);

        for (const [key, { offset, length }] of this.index.entries()) {
            const data = await readBlock(this.fileHandle, offset, length);
            await appendBlock(newFileHandle, data);
        }

        await closeFile(newFileHandle);
        await this.close();

        await Deno.remove(this.filepath);
        await Deno.rename(newPath, this.filepath);

        this.fileHandle = await openFile(this.filepath);
    }
}