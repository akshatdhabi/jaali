export type Mode = 'dark' | 'light';
export interface ThemeInfo { name: string; label: string }

export const $: (selector: string, root?: ParentNode) => Element | null;
export const $$: (selector: string, root?: ParentNode) => Element[];
export const EASE: string;
export function reduced(): boolean;
export function indexKids(el: Element): void;

export function themes(): ThemeInfo[];
export function getTheme(): string;
export function getMode(): Mode;
export function setTheme(name: string, options?: { quiet?: boolean; persist?: boolean }): void;
export function setMode(mode: Mode, options?: { persist?: boolean }): void;
export function toggleMode(): void;
export function initTheme(): void;
export function themePicker(list: HTMLElement, options?: { toggle?: HTMLElement; panel?: HTMLElement }): { repaint(): void };
export const THEMES: Record<string, { label: string; dark: Record<string, string>; light: Record<string, string> }>;
export const DEFAULT_THEME: string;

export function flipWords(root?: ParentNode, options?: { interval?: number }): () => void;
export function pivot(box: Element, onPick?: (button: HTMLButtonElement, index: number) => void): { select(index: number): void };
export function turnstile(el: HTMLElement, render: () => void): void;
export function tilt(el: HTMLElement): void;
export function tiltAll(root?: ParentNode): void;
export function glow(): () => void;
export function jaaliField(canvas: HTMLCanvasElement, options?: { cell?: number }): () => void;
export function reveal(root?: ParentNode): () => void;
export function countUp(el: HTMLElement, options?: { duration?: number; delay?: number }): void;
export function liveTiles(hub: HTMLElement, options?: { interval?: number; hold?: number }): { stop(): void; place(): void };
export function placeTiles(hub: HTMLElement): void;
export function toast(title: string, sub?: string, options?: { ms?: number }): void;
export function range(box: HTMLElement, onInput?: (value: number) => void): { value(): number; paint(): void };
export function sheet(el: HTMLElement): { open(from: HTMLElement | null, content: { org?: string; title?: string; html?: string }): void; close(): void };
export function scrollSpy(options?: { progress?: HTMLElement; links?: HTMLElement[]; sections?: string[] }): () => void;
export function motif(kind: 'ring' | 'arch' | 'rosette' | 'star' | 'well'): string;
export function motifs(): string[];
export function rosette(): string;
export function arch(): string;
export function mount(root?: ParentNode): () => void;
