import html2canvas from 'html2canvas';

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
 * Tailwind 4 uses OKLCH and color-mix. html2canvas cannot parse modern CSS
 * colors, so snapshot each computed color through the browser's own Canvas2D
 * implementation and replace it with legacy RGBA inside the export clone.
 * The on-screen live preview is never changed.
 */
const normaliseCloneColors = (doc: Document) => {
  const ctx = doc.createElement('canvas').getContext('2d', { willReadFrequently: true });
  if (!ctx) return;
  const toRgba = (value: string) => {
    if (!value || value === 'none') return value;
    try {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = '#000000';
      ctx.fillStyle = value;
      ctx.fillRect(0, 0, 1, 1);
      const data = ctx.getImageData(0, 0, 1, 1).data;
      return `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${(data[3] / 255).toFixed(4)})`;
    } catch { return '#000000'; }
  };
  const colorProperties = [
    'color', 'background-color', 'border-top-color', 'border-right-color',
    'border-bottom-color', 'border-left-color', 'outline-color',
    'text-decoration-color', 'fill', 'stroke'
  ];
  // Also normalize ancestors because html2canvas copies inherited styles.
  for (const element of doc.querySelectorAll('*')) {
    if (!(element instanceof doc.defaultView!.HTMLElement) && !(element instanceof doc.defaultView!.SVGElement)) continue;
    const styles = doc.defaultView!.getComputedStyle(element);
    const inline = (element as HTMLElement).style;
    for (const name of colorProperties) {
      const current = styles.getPropertyValue(name);
      if (current && current !== 'none' && current !== 'currentcolor') {
        inline.setProperty(name, toRgba(current), 'important');
      }
    }
    inline.setProperty('box-shadow', 'none', 'important');
    inline.setProperty('text-shadow', 'none', 'important');
    inline.setProperty('filter', 'none', 'important');
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
  const sourceWidth = node.getBoundingClientRect().width;
  const canvas = await html2canvas(node, {
    backgroundColor: '#ffffff',
    useCORS: true,
    allowTaint: false,
    imageTimeout: 15000,
    logging: false,
    onclone: normaliseCloneColors,
    scale: size.width / sourceWidth,
    width: sourceWidth,
    height: sourceWidth * size.height / size.width
  });
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
