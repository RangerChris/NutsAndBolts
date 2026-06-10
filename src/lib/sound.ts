import pop3 from '../assets/sound/pop3.wav';
import pop4 from '../assets/sound/pop4.wav';
import cancel from '../assets/sound/PM_SD_UI_MAGIC_CONFIRM_7.wav';
import menuSelect from '../assets/sound/MENU A_Select.wav';
import accept from '../assets/sound/Accept.mp3';

const VOLUME = 0.35;

// Lazily-built Audio objects so we don't decode until first play.
// We re-clone the node on each play to allow rapid, overlapping pops.
let pickAudio: HTMLAudioElement | null = null;
let dropAudio: HTMLAudioElement | null = null;

function play(src: string): void {
    if (typeof window === 'undefined') return;
    try {
        const a = new Audio(src);
        a.volume = VOLUME;
        // Fire-and-forget; promise rejection (autoplay etc.) is harmless here.
        void a.play().catch(() => {});
    } catch {
        // ignore — sound is best-effort
    }
}

export function playPick(): void {
    if (!pickAudio) {
        try { pickAudio = new Audio(pop3); } catch { return; }
        pickAudio.volume = VOLUME;
    }
    play(pop3);
}

export function playDrop(): void {
    if (!dropAudio) {
        try { dropAudio = new Audio(pop4); } catch { return; }
        dropAudio.volume = VOLUME;
    }
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
