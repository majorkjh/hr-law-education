/**
 * Pure JavaScript ZIP archive generator (STORE uncompressed mode with CRC32)
 * and reader using native browser DecompressionStream('deflate-raw').
 * Zero external dependencies.
 */

// CRC32 table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[i] = c >>> 0;
}

export function calculateCrc32(bytes: Uint8Array): number {
  let crc = 0 ^ (-1);
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ bytes[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

export interface ZipEntryInput {
  name: string;
  data: Uint8Array | string;
}

/**
 * Creates a standard ZIP file with uncompressed (STORE) entries.
 * The first entry (e.g. mimetype) has no extra headers.
 */
export function createZip(entries: ZipEntryInput[]): Uint8Array {
  const textEncoder = new TextEncoder();
  const processedEntries: Array<{
    nameBytes: Uint8Array;
    dataBytes: Uint8Array;
    crc: number;
    localHeaderOffset: number;
  }> = [];

  let totalSize = 0;

  // 1. Calculate local headers + file data size
  for (const entry of entries) {
    const nameBytes = textEncoder.encode(entry.name);
    const dataBytes = typeof entry.data === 'string' ? textEncoder.encode(entry.data) : entry.data;
    const crc = calculateCrc32(dataBytes);

    // 30 bytes fixed local header + filename length + data length
    const localHeaderSize = 30 + nameBytes.length;
    processedEntries.push({
      nameBytes,
      dataBytes,
      crc,
      localHeaderOffset: totalSize,
    });

    totalSize += localHeaderSize + dataBytes.length;
  }

  const centralDirStartOffset = totalSize;

  // 2. Calculate central directory size
  for (const entry of processedEntries) {
    // 46 bytes fixed central dir header + filename length
    totalSize += 46 + entry.nameBytes.length;
  }

  // 3. Add End of Central Directory Record (22 bytes)
  totalSize += 22;

  // 4. Allocate buffer and write
  const buffer = new Uint8Array(totalSize);
  const view = new DataView(buffer.buffer);
  let pos = 0;

  // DOS Time & Date: 2026-01-01 10:00:00
  // Time: (10 << 11) | (0 << 5) | (0 / 2) = 0x5000
  // Date: ((2026 - 1980) << 9) | (1 << 5) | 1 = (46 << 9) | 32 | 1 = 0x5C21
  const dosTime = 0x5000;
  const dosDate = 0x5C21;

  // Write Local Headers + Data
  for (const entry of processedEntries) {
    const headerPos = pos;
    // Signature: 0x04034b50
    view.setUint32(headerPos, 0x04034b50, true);
    // Version needed: 20 (2.0)
    view.setUint16(headerPos + 4, 20, true);
    // General purpose bit flag: 0x0800 (UTF-8 filename)
    view.setUint16(headerPos + 6, 0x0800, true);
    // Compression: 0 (STORE)
    view.setUint16(headerPos + 8, 0, true);
    // Mod time & date
    view.setUint16(headerPos + 10, dosTime, true);
    view.setUint16(headerPos + 12, dosDate, true);
    // CRC-32
    view.setUint32(headerPos + 14, entry.crc, true);
    // Compressed size
    view.setUint32(headerPos + 18, entry.dataBytes.length, true);
    // Uncompressed size
    view.setUint32(headerPos + 22, entry.dataBytes.length, true);
    // File name length
    view.setUint16(headerPos + 26, entry.nameBytes.length, true);
    // Extra field length
    view.setUint16(headerPos + 28, 0, true);

    pos += 30;

    // File name
    buffer.set(entry.nameBytes, pos);
    pos += entry.nameBytes.length;

    // File data
    buffer.set(entry.dataBytes, pos);
    pos += entry.dataBytes.length;
  }

  // Write Central Directory Headers
  for (const entry of processedEntries) {
    const cdPos = pos;
    // Signature: 0x02014b50
    view.setUint32(cdPos, 0x02014b50, true);
    // Version made by: 20
    view.setUint16(cdPos + 4, 20, true);
    // Version needed: 20
    view.setUint16(cdPos + 6, 20, true);
    // General purpose bit flag: 0x0800
    view.setUint16(cdPos + 8, 0x0800, true);
    // Compression: 0
    view.setUint16(cdPos + 10, 0, true);
    // Mod time & date
    view.setUint16(cdPos + 12, dosTime, true);
    view.setUint16(cdPos + 14, dosDate, true);
    // CRC-32
    view.setUint32(cdPos + 16, entry.crc, true);
    // Compressed size
    view.setUint32(cdPos + 20, entry.dataBytes.length, true);
    // Uncompressed size
    view.setUint32(cdPos + 24, entry.dataBytes.length, true);
    // File name length
    view.setUint16(cdPos + 28, entry.nameBytes.length, true);
    // Extra field length
    view.setUint16(cdPos + 30, 0, true);
    // File comment length
    view.setUint16(cdPos + 32, 0, true);
    // Disk number start
    view.setUint16(cdPos + 34, 0, true);
    // Internal file attributes
    view.setUint16(cdPos + 36, 0, true);
    // External file attributes
    view.setUint32(cdPos + 38, 0, true);
    // Relative offset of local header
    view.setUint32(cdPos + 42, entry.localHeaderOffset, true);

    pos += 46;

    // File name
    buffer.set(entry.nameBytes, pos);
    pos += entry.nameBytes.length;
  }

  const centralDirSize = pos - centralDirStartOffset;

  // Write End of Central Directory Record (22 bytes)
  const eocdPos = pos;
  // Signature: 0x06054b50
  view.setUint32(eocdPos, 0x06054b50, true);
  // Number of this disk
  view.setUint16(eocdPos + 4, 0, true);
  // Disk with start of CD
  view.setUint16(eocdPos + 6, 0, true);
  // Total entries on this disk
  view.setUint16(eocdPos + 8, processedEntries.length, true);
  // Total entries in CD
  view.setUint16(eocdPos + 10, processedEntries.length, true);
  // Size of CD
  view.setUint32(eocdPos + 12, centralDirSize, true);
  // Offset of start of CD
  view.setUint32(eocdPos + 16, centralDirStartOffset, true);
  // ZIP comment length
  view.setUint16(eocdPos + 20, 0, true);

  return buffer;
}

/**
 * Decompresses raw DEFLATE bytes using browser native DecompressionStream.
 */
async function decompressRaw(bytes: Uint8Array): Promise<Uint8Array> {
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  writer.write(bytes as unknown as BufferSource);
  writer.close();

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let totalLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      totalLength += value.length;
    }
  }

  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

/**
 * Reads a ZIP archive from ArrayBuffer without external libraries.
 * Handles both STORE (0) and DEFLATE (8).
 */
export async function readZip(arrayBuffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const view = new DataView(arrayBuffer);
  const totalLength = arrayBuffer.byteLength;
  const files = new Map<string, Uint8Array>();

  // 1. Find EOCD signature (0x06054b50) searching backward
  let eocdOffset = -1;
  const searchLimit = Math.max(0, totalLength - 65557);
  for (let i = totalLength - 22; i >= searchLimit; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    throw new Error('유효한 ZIP(HWPX) 파일 구조를 찾을 수 없습니다.');
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  const textDecoder = new TextDecoder('utf-8');
  let cdPos = centralDirOffset;

  for (let i = 0; i < totalEntries; i++) {
    if (cdPos + 46 > totalLength) break;
    const sig = view.getUint32(cdPos, true);
    if (sig !== 0x02014b50) break;

    const compressionMethod = view.getUint16(cdPos + 10, true);
    const compressedSize = view.getUint32(cdPos + 20, true);
    const fileNameLen = view.getUint16(cdPos + 28, true);
    const extraLen = view.getUint16(cdPos + 30, true);
    const commentLen = view.getUint16(cdPos + 32, true);
    const localHeaderOffset = view.getUint32(cdPos + 42, true);

    const nameBytes = new Uint8Array(arrayBuffer, cdPos + 46, fileNameLen);
    const fileName = textDecoder.decode(nameBytes);

    // Read local header to get accurate data offset
    if (localHeaderOffset + 30 <= totalLength) {
      const localSig = view.getUint32(localHeaderOffset, true);
      if (localSig === 0x04034b50) {
        const localFileNameLen = view.getUint16(localHeaderOffset + 26, true);
        const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
        const dataOffset = localHeaderOffset + 30 + localFileNameLen + localExtraLen;

        if (dataOffset + compressedSize <= totalLength) {
          const rawBytes = new Uint8Array(arrayBuffer, dataOffset, compressedSize);

          if (compressionMethod === 0) {
            // STORE
            files.set(fileName, rawBytes);
          } else if (compressionMethod === 8) {
            // DEFLATE
            try {
              const decompressed = await decompressRaw(rawBytes);
              files.set(fileName, decompressed);
            } catch (err) {
              console.warn(`Failed to decompress ${fileName} with deflate-raw:`, err);
            }
          }
        }
      }
    }

    cdPos += 46 + fileNameLen + extraLen + commentLen;
  }

  return files;
}
