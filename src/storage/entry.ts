export enum RecordType {
    Put = 1,
    Delete = 2
}; 

export interface Entry {
    type: RecordType;
    key: string;
    value?: Uint8Array;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

// Encode: Object --> Bytes
export function encodeEntry(entry: Entry): Uint8Array {
    const keyBytes = encoder.encode(entry.key);
    const keyLength = keyBytes.length;
    const valueLength = entry.value?.length ?? 0;

    const buffer = new Uint8Array(
        1 + 4 + 4 + keyLength + valueLength
    );
    const view = new DataView(buffer.buffer);

    let offset = 0;
    view.setUint8(offset, entry.type); offset += 1;
    view.setUint32(offset, keyLength); offset += 4;
    view.setUint32(offset, valueLength); offset += 4;

    buffer.set(keyBytes, offset); offset += keyLength;
    if (entry.value) buffer.set(entry.value, offset);

    return buffer;
}

// Decode: Bytes --> object
export function decodeEntry(data: Uint8Array): {entry: Entry, bytesRead: number} {
    const view = new DataView(data.buffer, data.byteOffset, data.byteLength);

    let offset = 0;
    const type = view.getUint8(offset); offset += 1;
    const keyLength = view.getUint32(offset); offset += 4;
    const valueLength = view.getUint32(offset); offset += 4;

    const keyBytes = data.slice(offset, offset + keyLength);
    offset += keyLength;

    let value: Uint8Array | undefined;
    if (valueLength > 0) {
        value = data.slice(offset, offset + valueLength);
        offset += valueLength;
    }

    const entry: Entry = {
        type,
        key: decoder.decode(keyBytes),
        value
    };

    return { entry, bytesRead: offset };
}