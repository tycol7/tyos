declare module 'heic-convert' {
  export default function convert(options: {
    buffer: Buffer;
    format: string;
    quality?: number;
  }): Promise<Buffer>;
}
