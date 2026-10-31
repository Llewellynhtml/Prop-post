export type FlyerFormat = 'png' | 'jpeg' | 'pdf';
export type FlyerRatio = '1:1' | '4:5' | '9:16' | '1.91:1' | '16:9' | '1200x630';

const sizes: Record<FlyerRatio, { width: number; height: number }> = {
  '1:1': { width: 1080, height: 1080 },
  '4:5': { width: 1080, height: 1350 },
  '9:16': { width: 1080, height: 1920 },
  '1.91:1': { width: 1200, height: 630 },
  '16:9': { width: 1920, height: 1080 },
  '1200x630': { width: 1200, height: 630 }
};


/**
 * Render the SAME flyer DOM that powers the live preview. The browser's SVG
 * foreignObject renderer understands CSS Color 4 (Tailwind OKLCH).
 * Computed styles are copied inline so the exported image is independent of
 * stylesheets after it leaves the page.
 */
const makeSelfContainedClone = async (source: HTMLElement): Promise<HTMLElement> => {
  const cloned = source.cloneNode(true) as HTMLElement;
  const originals = [source, ...Array.from(source.querySelectorAll('*'))];
  const copies = [cloned, ...Array.from(cloned.querySelectorAll('*'))];
  originals.forEach((original, i) => {
    const target = copies[i] as HTMLElement | SVGElement;
    const styles = getComputedStyle(original);
    for (let n = 0; n < styles.length; n++) {
      const property = styles.item(n);
      target.style.setProperty(property, styles.getPropertyValue(property), 'important');
    }
    target.style.setProperty('animation', 'none', 'important');
    target.style.setProperty('transition', 'none', 'important');
    target.style.setProperty('filter', 'none', 'important');
  });

  // An SVG image cannot load external assets. Inline photos and logos in the
  // clone, and fail with a useful message if a server blocks CORS.
  const sourceImages = Array.from(source.querySelectorAll('img'));
  const cloneImages = Array.from(cloned.querySelectorAll('img'));
  await Promise.all(sourceImages.map(async (image, i) => {
    const url = image.currentSrc || image.src;
    if (!url) return;
    if (url.startsWith('data:')) {
      cloneImages[i].src = url;
      return;
    }
    let response: Response;
    try { response = await fetch(url, { mode: 'cors', credentials: 'same-origin' }); }
    catch { throw new Error('A property image or agency logo blocks cross-origin export. Host this image on an approved CORS-enabled origin.'); }
    if (!response.ok) throw new Error(`Cannot load flyer image (HTTP ${response.status}).`);
    const blob = await response.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error('Image could not be encoded for flyer export.'));
      reader.readAsDataURL(blob);
    });
    cloneImages[i].src = dataUrl;
  }));
  cloned.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  return cloned;
};

const renderPreviewCanvas = async (source: HTMLElement, width: number, height: number): Promise<HTMLCanvasElement> => {
  const rect = source.getBoundingClientRect();
  if (!rect.width || !rect.height) throw new Error('Flyer preview is not visible.');
  const cloned = await makeSelfContainedClone(source);
  const xml = new XMLSerializer().serializeToString(cloned);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}" viewBox="0 0 ${rect.width} ${rect.height}"><foreignObject x="0" y="0" width="100%" height="100%">${xml}</foreignObject></svg>`;
  const imageUrl = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  try {
    const image = new Image();
    image.src = imageUrl;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas rendering is unavailable in this browser.');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    return canvas;
  } catch {
    throw new Error('Browser SVG rendering failed. Check that all flyer assets can be embedded.');
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

const blobFromCanvas = (canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Unable to encode the flyer image.')), type, quality);
  });

const concat = (chunks: Uint8Array[]): Uint8Array => {
  const bytes = new Uint8Array(chunks.reduce((sum, value) => sum + value.length, 0));
  let cursor = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, cursor);
    cursor += chunk.length;
  }
  return bytes;
};

// Embed a single canvas-derived JPEG as a full-page image. No separate flyer renderer.
const pdfFromJpeg = async (jpg: Blob, width: number, height: number): Promise<Blob> => {
  const img = new Uint8Array(await jpg.arrayBuffer());
  const encoder = new TextEncoder();
  const pageW = (width * 0.75).toFixed(2);
  const pageH = (height * 0.75).toFixed(2);
  const stream = encoder.encode(`q ${pageW} 0 0 ${pageH} 0 0 cm /Im1 Do Q\n`);
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let offset = 0;
  const add = (part: Uint8Array) => { chunks.push(part); offset += part.length; };
  const addText = (value: string) => add(encoder.encode(value));
  const obj = (id: number, body: string | Uint8Array) => {
    offsets[id] = offset;
    addText(`${id} 0 obj\n`);
    if (typeof body === 'string') addText(body);
    else add(body);
    addText('\nendobj\n');
  };
  addText('%PDF-1.4\n');
  obj(1, '<< /Type /Catalog /Pages 2 0 R >>');
  obj(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  obj(3, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>`);
  offsets[4] = offset;
  addText(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.length} >>\nstream\n`);
  add(img);
  addText('\nendstream\nendobj\n');
  offsets[5] = offset;
  addText(`5 0 obj\n<< /Length ${stream.length} >>\nstream\n`);
  add(stream);
  addText('endstream\nendobj\n');
  const xref = offset;
  addText('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) addText(`${String(offsets[i]).padStart(10, '0')} 00000 n \n`);
  addText(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`);
  return new Blob([concat(chunks) as BlobPart], { type: 'application/pdf' });
};

export async function exportFlyer(node: HTMLElement, ratio: FlyerRatio, format: FlyerFormat, fileBase: string) {
  const size = sizes[ratio];
  if (!size) throw new Error('Unsupported flyer format.');
  if (!node.getBoundingClientRect().width) throw new Error('Flyer preview is not visible.');
  if ('fonts' in document) await document.fonts.ready;
  const images = [...node.querySelectorAll('img')];
  await Promise.all(images.map(img => img.decode().catch(() => {
    throw new Error('A flyer image could not load. Check its URL and cross-origin permissions.');
  })));
  const canvas = await renderPreviewCanvas(node, size.width, size.height);
  if (canvas.width !== size.width || Math.abs(canvas.height - size.height) > 2) {
    throw new Error('Rendered dimensions do not match the selected format.');
  }
  const blob = format === 'pdf'
    ? await pdfFromJpeg(await blobFromCanvas(canvas, 'image/jpeg', 0.93), canvas.width, canvas.height)
    : await blobFromCanvas(canvas, format === 'png' ? 'image/png' : 'image/jpeg', format === 'jpeg' ? 0.92 : undefined);
  const name = `${fileBase}.${format === 'jpeg' ? 'jpg' : format}`;
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30000);
  return { name, width: canvas.width, height: canvas.height, byteLength: blob.size };
}
