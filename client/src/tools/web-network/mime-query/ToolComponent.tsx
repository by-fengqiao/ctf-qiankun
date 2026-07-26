import SimpleTool from '../../_shared/SimpleTool';
import type { ToolProps } from '../../types';

const EXT_TO_MIME: Record<string, string[]> = {
  txt: ['text/plain'],
  html: ['text/html'],
  htm: ['text/html'],
  css: ['text/css'],
  js: ['application/javascript', 'text/javascript'],
  json: ['application/json'],
  xml: ['application/xml', 'text/xml'],
  csv: ['text/csv'],
  md: ['text/markdown'],
  pdf: ['application/pdf'],
  zip: ['application/zip'],
  gz: ['application/gzip'],
  tar: ['application/x-tar'],
  '7z': ['application/x-7z-compressed'],
  rar: ['application/vnd.rar'],
  png: ['image/png'],
  jpg: ['image/jpeg'],
  jpeg: ['image/jpeg'],
  gif: ['image/gif'],
  svg: ['image/svg+xml'],
  webp: ['image/webp'],
  ico: ['image/x-icon'],
  bmp: ['image/bmp'],
  mp3: ['audio/mpeg'],
  wav: ['audio/wav'],
  ogg: ['audio/ogg'],
  mp4: ['video/mp4'],
  webm: ['video/webm'],
  avi: ['video/x-msvideo'],
  mkv: ['video/x-matroska'],
  doc: ['application/msword'],
  docx: ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  xls: ['application/vnd.ms-excel'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
  ppt: ['application/vnd.ms-powerpoint'],
  pptx: ['application/vnd.openxmlformats-officedocument.presentationml.presentation'],
  wasm: ['application/wasm'],
  woff: ['font/woff'],
  woff2: ['font/woff2'],
  ttf: ['font/ttf'],
  otf: ['font/otf'],
  eot: ['application/vnd.ms-fontobject'],
};

const MIME_TO_EXT: Record<string, string[]> = {};
for (const [ext, mimes] of Object.entries(EXT_TO_MIME)) {
  for (const m of mimes) {
    if (!MIME_TO_EXT[m]) MIME_TO_EXT[m] = [];
    MIME_TO_EXT[m].push(ext);
  }
}

const ToolComponent = (props: ToolProps) => (
  <SimpleTool
    {...props}
    execute={(input: string) => {
      const trimmed = input.trim().toLowerCase().replace(/^\./, '');
      const byExt = EXT_TO_MIME[trimmed];
      if (byExt) {
        return [
          `扩展名: .${trimmed}`,
          `MIME 类型: ${byExt.join(', ')}`,
        ].join('\n');
      }
      const byMime = MIME_TO_EXT[trimmed];
      if (byMime) {
        return [
          `MIME 类型: ${trimmed}`,
          `扩展名: ${byMime.map((e) => '.' + e).join(', ')}`,
        ].join('\n');
      }
      throw new Error(`未找到 ".${trimmed}" 对应的 MIME 类型`);
    }}
  />
);

export default ToolComponent;
