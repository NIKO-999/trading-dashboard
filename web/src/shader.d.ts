declare module '*/shader.js' {
  export function createAmbientField(canvas: HTMLCanvasElement): {
    frame: () => void;
    resize: () => void;
    setTheme: (name: string) => void;
    pointer: (x: number, y: number, moving: boolean) => void;
    ripple: (x: number, y: number, hueMix: number) => void;
    setBoost: (x: number, y: number, amp: number) => void;
  } | null;
}
