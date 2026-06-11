import pop3 from '../assets/sound/pop3.wav';
import pop4 from '../assets/sound/pop4.wav';
import cancel from '../assets/sound/PM_SD_UI_MAGIC_CONFIRM_7.wav';
import menuSelect from '../assets/sound/MENU A_Select.wav';
import accept from '../assets/sound/Accept.mp3';

const VOLUME = 0.35;

// Lazily-built, cached Audio objects so we don't re-fetch / re-decode on every play.
// We clone the cached node for each play to allow rapid, overlapping pops.
const cache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement | null {
    let a = cache.get(src);
    if (!a) {
        try {
            a = new Audio(src);
            a.volume = VOLUME;
            a.preload = 'auto';
            cache.set(src, a);
        } catch {
            return null;
        }
    }
    return a;
}

function play(src: string): void {
    if (typeof window === 'undefined') return;
    const base = getAudio(src);
    if (!base) return;
    try {
        const clone = base.cloneNode(true) as HTMLAudioElement;
        clone.volume = VOLUME;
        // Fire-and-forget; promise rejection (autoplay etc.) is harmless here.
        void clone.play().catch(() => {});
    } catch {
        // ignore — sound is best-effort
    }
}

export function playPick(): void {
    play(pop3);
}

export function playDrop(): void {
    play(pop4);
}

export function playCancel(): void {
    play(cancel);
}

export function playMenuSelect(): void {
    play(menuSelect);
}

export function playStart(): void {
    play(accept);
}
