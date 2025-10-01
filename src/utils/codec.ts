export interface FileHeader {
    magic: string;
    version: number;
}

const MAGIC = new TextEncoder().encode("BKV1");
const VERSION = 1;
const HEADER_SIZE = 8;

export function encodeHeader(): Uint8Array {
    const buffer = new Uint8Array(HEADER_SIZE);
    buffer.set(MAGIC, 0);
    const view = new DataView(buffer.buffer);
    view.setUint32(4, VERSION, true);
    return buffer;
}

export function decodeHeader(buffer: Uint8Array): {magic: string, version: number} {
    if (buffer.length < HEADER_SIZE) {
        throw new Error("Invalid Header: too short");        
    }

    const magic = new TextDecoder().decode(buffer.slice(0, 4));
    const view = new DataView(buffer.buffer);
    const version = view.getUint16(4, true);

    if (magic !== "BKV1") {
        throw new Error(`Invalid file format: excepted ${MAGIC}, got ${magic}`);
    }
    if (version !== VERSION) {
        throw new Error(`Unsupported DB version: ${version}`);
        
    }

    return { magic, version }
}

export const HEADER_BYTES = HEADER_SIZE;