/**
 * Generate simple PWA icons for biyo.
 * Run: node scripts/generate-icons.mjs
 */

import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { deflateSync } from 'node:zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuf]);
}

function createPNG(width, height) {
  const rawData = [];
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.4;

  for (let y = 0; y < height; y++) {
    rawData.push(0); // filter byte: None
    for (let x = 0; x < width; x++) {
      // Background: warm cream #FFF8F0
      let pr = 0xff,
        pg = 0xf8,
        pb = 0xf0,
        pa = 0xff;

      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        // Gradient from pink (#FF6680) to purple (#CF63CF)
        const t = x / width;
        pr = Math.round(0xff * (1 - t) + 0xcf * t);
        pg = Math.round(0x66 * (1 - t) + 0x63 * t);
        pb = Math.round(0x80 * (1 - t) + 0xcf * t);

        // Smooth antialiased edge
        const edgeDist = radius - dist;
        if (edgeDist < 2) {
          const alpha = edgeDist / 2;
          pr = Math.round(pr * alpha + 0xff * (1 - alpha));
          pg = Math.round(pg * alpha + 0xf8 * (1 - alpha));
          pb = Math.round(pb * alpha + 0xf0 * (1 - alpha));
        }
      }

      rawData.push(pr, pg, pb, pa);
    }
  }

  const compressed = deflateSync(Buffer.from(rawData));
  const chunks = [];

  // PNG signature
  chunks.push(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdr));

  // IDAT
  chunks.push(makeChunk('IDAT', compressed));

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  return Buffer.concat(chunks);
}

const publicDir = join(__dirname, '..', 'public');

console.log('Generating icon-192.png...');
writeFileSync(join(publicDir, 'icon-192.png'), createPNG(192, 192));

console.log('Generating icon-512.png...');
writeFileSync(join(publicDir, 'icon-512.png'), createPNG(512, 512));

console.log('Done! Icons written to public/');
