import React, { useEffect, useRef } from 'react';
import type { GameState } from '../lib/types';
import BoltView from './BoltView';

type AnimMove = {
    move: any;
    preRects: Array<{ left: number; top: number; width: number; height: number; color: string }>;
};

type Props = {
    state: GameState;
    paletteId: number;
    showDebug?: boolean;
    selectedBoltId?: string | null;
    invalidBoltId?: string | null;
    onBoltClick: (id: string) => void;
    animMove?: AnimMove | null;
    onAnimDone?: () => void;
};

export default function Board({ state, paletteId, showDebug = false, selectedBoltId, invalidBoltId, onBoltClick, animMove, onAnimDone }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!animMove || !containerRef.current) return;
        const { move, preRects } = animMove;
        const clones: HTMLElement[] = [];

        // For each moved nut, find its target DOM node and animate a clone
        for (let i = 0; i < preRects.length; i++) {
            const pr = preRects[i];
            // target index after move: take last N nuts
            const tgtBolt = state.bolts.find((b) => b.id === move.toBoltId);
            if (!tgtBolt) continue;
            const targetIndex = tgtBolt.nuts.length - preRects.length + i;
            const targetSelector = `[data-bolt="${move.toBoltId}"] [data-nut-index="${targetIndex}"]`;
            const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
            if (!targetEl) continue;
            const targetRect = targetEl.getBoundingClientRect();

            // create clone
            const clone = document.createElement('div');
            clone.style.position = 'fixed';
            clone.style.left = `${pr.left}px`;
            clone.style.top = `${pr.top}px`;
            clone.style.width = `${pr.width}px`;
            clone.style.height = `${pr.height}px`;
            clone.style.zIndex = '9999';
            clone.style.pointerEvents = 'none';
            clone.style.transition = 'transform 360ms ease, opacity 260ms ease';
            // Side-view nut clone (66×20 viewBox matches BoltView NUT_W×NUT_H)
            // include data-nut-id text so clones mirror BoltView labels
            const cid = pr.colorLabel || '';
            clone.innerHTML = `<svg width="${pr.width}" height="${pr.height}" viewBox="0 0 66 20" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="66" height="20" rx="2" fill="${pr.color}" stroke="rgba(0,0,0,0.35)" stroke-width="0.8"/><line x1="0" y1="0" x2="8" y2="20" stroke="rgba(0,0,0,0.15)" stroke-width="0.8"/><line x1="66" y1="0" x2="58" y2="20" stroke="rgba(0,0,0,0.15)" stroke-width="0.8"/><rect x="3" y="2" width="60" height="2" rx="1" fill="rgba(255,255,255,0.28)"/>` + (cid ? `<text x="33" y="14" text-anchor="middle" font-size="8" fill="#fff" data-nut-id="${cid}">${cid}</text>` : '') + `</svg>`;
            document.body.appendChild(clone);
            clones.push(clone);

            // compute delta
            const dx = targetRect.left - pr.left;
            const dy = targetRect.top - pr.top;

            // trigger animation
            requestAnimationFrame(() => {
                clone.style.transform = `translate(${dx}px, ${dy}px)`;
                clone.style.opacity = '1';
            });

            // cleanup after transition
            const onEnd = () => {
                clone.removeEventListener('transitionend', onEnd);
                clone.remove();
                const idx = clones.indexOf(clone);
                if (idx >= 0) clones.splice(idx, 1);
                if (clones.length === 0) {
                    onAnimDone?.();
                }
            };
            clone.addEventListener('transitionend', onEnd);
        }
        // safety: clear clones after timeout
        const t = setTimeout(() => {
            clones.forEach((c) => c.remove());
            onAnimDone?.();
        }, 800);
        return () => clearTimeout(t);
    }, [animMove, state, onAnimDone]);

    // Render bolts in a wrapping flex container so as many bolts as fit are
    // shown per row and the remaining bolts wrap to the next line.
    return (
        <div style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: 'calc(100vh - 220px)' }} ref={containerRef}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, padding: 8, alignItems: 'flex-start' }}>
                {state.bolts.map((b) => (
                    <div key={b.id} style={{ flex: '0 0 auto', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                        <BoltView
                            bolt={b}
                            paletteId={paletteId}
                            showDebug={showDebug}
                            selected={selectedBoltId === b.id}
                            invalid={invalidBoltId === b.id}
                            onClick={onBoltClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
