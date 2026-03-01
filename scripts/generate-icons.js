const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let j = 0; j < 8; j++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  crcTable[i] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeB = Buffer.from(type, 'ascii');
  const combined = Buffer.concat([typeB, data]);
  const crcVal = Buffer.alloc(4);
  crcVal.writeUInt32BE(crc32(combined));
  return Buffer.concat([len, typeB, data, crcVal]);
}

function createIcon(size, outputPath) {
  // Gradient: violet #7c3aed (top) -> indigo #4f46e5 (bottom)
  const r1 = 124, g1 = 58, b1 = 237;
  const r2 = 79, g2 = 70, b2 = 229;

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  // Image data
  const rowSize = 1 + size * 4; // filter byte + RGBA
  const raw = Buffer.alloc(rowSize * size);
  const cx = size / 2;
  const cy = size / 2;
  const cornerR = size * 0.18;

  for (let y = 0; y < size; y++) {
    raw[y * rowSize] = 0; // filter: none
    const t = y / (size - 1);

    for (let x = 0; x < size; x++) {
      const offset = y * rowSize + 1 + x * 4;

      // Rounded rectangle check
      const inRect = isInRoundedRect(x, y, size, size, cornerR);

      if (!inRect) {
        raw[offset] = 0;
        raw[offset + 1] = 0;
        raw[offset + 2] = 0;
        raw[offset + 3] = 0; // transparent
        continue;
      }

      // Background gradient
      let r = Math.round(r1 + (r2 - r1) * t);
      let g = Math.round(g1 + (g2 - g1) * t);
      let b = Math.round(b1 + (b2 - b1) * t);
      let a = 255;

      // Draw a white rupee symbol "₹" approximation
      const relX = (x - cx) / (size * 0.5);
      const relY = (y - cy) / (size * 0.5);
      const lineW = 0.08;

      // Top horizontal line
      if (relY > -0.35 && relY < -0.35 + lineW && relX > -0.25 && relX < 0.25) {
        r = 255; g = 255; b = 255;
      }
      // Second horizontal line
      if (relY > -0.18 && relY < -0.18 + lineW && relX > -0.25 && relX < 0.25) {
        r = 255; g = 255; b = 255;
      }
      // Vertical stroke (left side)
      if (relX > -0.25 && relX < -0.25 + lineW && relY > -0.35 && relY < 0.0) {
        r = 255; g = 255; b = 255;
      }
      // Curve from top-right down
      const curveDistTop = Math.sqrt((relX - 0.0) ** 2 + (relY - (-0.35)) ** 2);
      if (curveDistTop > 0.18 && curveDistTop < 0.18 + lineW && relX > -0.05 && relY > -0.38 && relY < -0.15) {
        r = 255; g = 255; b = 255;
      }
      // Diagonal slash down-right
      const diagY = relY - 0.05;
      const diagX = relX + 0.05;
      if (Math.abs(diagY - diagX * 1.2) < lineW * 0.7 && relY > -0.05 && relY < 0.45 && relX > -0.15 && relX < 0.30) {
        r = 255; g = 255; b = 255;
      }

      raw[offset] = r;
      raw[offset + 1] = g;
      raw[offset + 2] = b;
      raw[offset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(raw);

  const png = Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    createChunk('IHDR', ihdr),
    createChunk('IDAT', compressed),
    createChunk('IEND', Buffer.alloc(0)),
  ]);

  fs.writeFileSync(outputPath, png);
  console.log(`Created: ${outputPath} (${size}x${size}, ${png.length} bytes)`);
}

function isInRoundedRect(x, y, w, h, r) {
  // Check corners
  if (x < r && y < r) return Math.sqrt((x - r) ** 2 + (y - r) ** 2) <= r;
  if (x > w - r && y < r) return Math.sqrt((x - (w - r)) ** 2 + (y - r) ** 2) <= r;
  if (x < r && y > h - r) return Math.sqrt((x - r) ** 2 + (y - (h - r)) ** 2) <= r;
  if (x > w - r && y > h - r) return Math.sqrt((x - (w - r)) ** 2 + (y - (h - r)) ** 2) <= r;
  return true;
}

// Generate icons
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(iconsDir, { recursive: true });

createIcon(192, path.join(iconsDir, 'icon-192x192.png'));
createIcon(512, path.join(iconsDir, 'icon-512x512.png'));

console.log('\nPWA icons generated successfully!');
