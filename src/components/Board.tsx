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
    selectedBoltId?: string | null;
    invalidBoltId?: string | null;
    onBoltClick: (id: string) => void;
    animMove?: AnimMove | null;
    onAnimDone?: () => void;
};

export default function Board({ state, paletteId, selectedBoltId, invalidBoltId, onBoltClick, animMove, onAnimDone }: Props) {
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
            clone.innerHTML = `<svg width="${pr.width}" height="${pr.height}" viewBox="0 0 36 32" xmlns="http://www.w3.org/2000/svg"><polygon points="18,2 30,8 30,24 18,30 6,24 6,8" fill="${pr.color}" stroke="#6b7280" stroke-width="0.8"/><circle cx="18" cy="16" r="5" fill="#f3f4f6"/></svg>`;
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

    return (
        <div style={{ overflowX: 'auto' }} ref={containerRef}>
            <div style={{ display: 'flex', gap: 12, padding: 8 }}>
                {state.bolts.map((b) => (
                    <BoltView
                        key={b.id}
                        bolt={b}
                        paletteId={paletteId}
                        selected={selectedBoltId === b.id}
                        invalid={invalidBoltId === b.id}
                        onClick={onBoltClick}
                    />
                ))}
            </div>
        </div>
    );
}
