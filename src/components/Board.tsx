import React, { useEffect, useRef } from 'react';
import type { GameState } from '../lib/types';
import BoltView from './BoltView';

export type AnimMove = {
    move: { toBoltId: string };
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

        for (let i = 0; i < preRects.length; i++) {
            const pr = preRects[i];
            const tgtBolt = state.bolts.find((b) => b.id === move.toBoltId);
            if (!tgtBolt) continue;
            const targetIndex = tgtBolt.nuts.length - preRects.length + i;
            const targetSelector = `[data-bolt="${move.toBoltId}"] [data-nut-index="${targetIndex}"]`;
            const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
            if (!targetEl) continue;
            const targetRect = targetEl.getBoundingClientRect();

            const clone = document.createElement('div');
            clone.style.position = 'fixed';
            clone.style.left = `${pr.left}px`;
            clone.style.top = `${pr.top}px`;
            clone.style.width = `${pr.width}px`;
            clone.style.height = `${pr.height}px`;
            clone.style.zIndex = '9999';
            clone.style.pointerEvents = 'none';
            clone.style.transition = 'transform 360ms ease, opacity 260ms ease';

            const SVG_NS = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(SVG_NS, 'svg');
            svg.setAttribute('width', String(pr.width));
            svg.setAttribute('height', String(pr.height));
            svg.setAttribute('viewBox', '0 0 66 20');

            const rect = document.createElementNS(SVG_NS, 'rect');
            rect.setAttribute('x', '0');
            rect.setAttribute('y', '0');
            rect.setAttribute('width', '66');
            rect.setAttribute('height', '20');
            rect.setAttribute('rx', '2');
            rect.setAttribute('fill', pr.color);
            rect.setAttribute('stroke', 'rgba(0,0,0,0.35)');
            rect.setAttribute('stroke-width', '0.8');
            svg.appendChild(rect);

            const line1 = document.createElementNS(SVG_NS, 'line');
            line1.setAttribute('x1', '0');
            line1.setAttribute('y1', '0');
            line1.setAttribute('x2', '8');
            line1.setAttribute('y2', '20');
            line1.setAttribute('stroke', 'rgba(0,0,0,0.15)');
            line1.setAttribute('stroke-width', '0.8');
            svg.appendChild(line1);

            const line2 = document.createElementNS(SVG_NS, 'line');
            line2.setAttribute('x1', '66');
            line2.setAttribute('y1', '0');
            line2.setAttribute('x2', '58');
            line2.setAttribute('y2', '20');
            line2.setAttribute('stroke', 'rgba(0,0,0,0.15)');
            line2.setAttribute('stroke-width', '0.8');
            svg.appendChild(line2);

            const shine = document.createElementNS(SVG_NS, 'rect');
            shine.setAttribute('x', '3');
            shine.setAttribute('y', '2');
            shine.setAttribute('width', '60');
            shine.setAttribute('height', '2');
            shine.setAttribute('rx', '1');
            shine.setAttribute('fill', 'rgba(255,255,255,0.28)');
            svg.appendChild(shine);

            clone.appendChild(svg);
            document.body.appendChild(clone);
            clones.push(clone);

            const dx = targetRect.left - pr.left;
            const dy = targetRect.top - pr.top;

            requestAnimationFrame(() => {
                clone.style.transform = `translate(${dx}px, ${dy}px)`;
                clone.style.opacity = '1';
            });

            const onEnd = () => {
                clone.removeEventListener('transitionend', onEnd);
                clone.remove();
                const idx = clones.indexOf(clone);
                if (idx >= 0) clones.splice(idx, 1);
                if (clones.length === 0) onAnimDone?.();
            };
            clone.addEventListener('transitionend', onEnd);
        }

        const t = setTimeout(() => {
            clones.forEach((c) => c.remove());
            clones.length = 0;
            onAnimDone?.();
        }, 800);
        return () => {
            clearTimeout(t);
            clones.forEach((c) => c.remove());
            clones.length = 0;
        };
    }, [animMove, state, onAnimDone]);

    return (
        <div className="board-container" ref={containerRef}>
            <div className="board-row">
                {state.bolts.map((b) => (
                    <div key={b.id} className="board-item">
                        <BoltView
                            bolt={b}
                            paletteId={paletteId}
                            showDebug={showDebug}
                            selected={selectedBoltId === b.id}
                            invalid={invalidBoltId === b.id}
                            hiddenNuts={Boolean(state.hiddenNuts)}
                            onClick={onBoltClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
