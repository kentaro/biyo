declare module 'mimium-web' {
  export class Context {
    // biome-ignore lint/suspicious/noMisleadingInstantiator: `new()` is the wasm-bindgen convention for Rust constructors
    static new(): Context;
    compile(code: string): void;
    process(output: Float32Array): void;
    get_samplerate(): number;
    set_samplerate(rate: number): void;
  }
}
