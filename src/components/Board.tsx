import React, { useEffect, useRef } from 'react';
import type { GameState } from '../lib/types';
import BoltView from './BoltView';

export type AnimMove = {
    move: { fromBoltId: string; toBoltId: string; count: number };
    preRects: Array<{ left: number; top: number; width: number; height: number; color: string }>;
};

export type HintPreview = {
    fromBoltId: string;
    toBoltId: string;
    count: number;
    allowed: boolean;
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
    hintPreview?: HintPreview | null;
    onHintDone?: () => void;
};

const EASE_LIFT = 'cubic-bezier(0.22, 1, 0.36, 1)';
const EASE_MOVE = 'cubic-bezier(0.2, 0.9, 0.2, 1)';
const EASE_SOFT = 'ease-in-out';
const LIFT_OFFSET = 18;
const LIFT_NUDGE_DENIED = 10;
const LIFT_STAGGER = 3;
const HOVER_DELAY_MS = 210;
const DROP_DELAY_MS = 470;
const LIFT_DURATION_MS = 180;
const HOVER_DURATION_MS = 220;
const ANIM_TOTAL_MS = 760;
const HINT_DENIED_TOTAL_MS = 440;
const HINT_CLONE_Z = 9999;

function boltEl(id: string): HTMLElement | null {
    return document.querySelector(`[data-bolt="${id}"]`) as HTMLElement | null;
}

function boltRect(id: string): DOMRect | undefined {
    return boltEl(id)?.getBoundingClientRect();
}

function transitionClone(clone: HTMLElement, origin: DOMRect, left: number, top: number, duration: number, easing: string) {
    clone.style.transition = `transform ${duration}ms ${easing}`;
    clone.style.transform = `translate(${left - origin.left}px, ${top - origin.top}px)`;
}

function createPreviewClone(sourceRect: DOMRect, fill: string, className = 'hint-preview-clone') {
    const clone = document.createElement('div');
    clone.className = className;
    clone.style.position = 'fixed';
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.zIndex = String(HINT_CLONE_Z);
    clone.style.pointerEvents = 'none';
    clone.style.opacity = '0.98';

    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('width', String(sourceRect.width));
    svg.setAttribute('height', String(sourceRect.height));
    svg.setAttribute('viewBox', `0 0 ${sourceRect.width} ${sourceRect.height}`);

    const nut = document.createElementNS(svgNs, 'rect');
    nut.setAttribute('x', '0');
    nut.setAttribute('y', '0');
    nut.setAttribute('width', String(sourceRect.width));
    nut.setAttribute('height', String(sourceRect.height));
    nut.setAttribute('rx', String(sourceRect.height / 2));
    nut.setAttribute('fill', fill);
    nut.setAttribute('stroke', 'rgba(0,0,0,0.35)');
    nut.setAttribute('stroke-width', '0.8');
    svg.appendChild(nut);

    const shine = document.createElementNS(svgNs, 'rect');
    shine.setAttribute('x', String(Math.max(2, sourceRect.width * 0.12)));
    shine.setAttribute('y', String(Math.max(2, sourceRect.height * 0.12)));
    shine.setAttribute('width', String(Math.max(10, sourceRect.width * 0.76)));
    shine.setAttribute('height', String(Math.max(3, sourceRect.height * 0.16)));
    shine.setAttribute('rx', '2');
    shine.setAttribute('fill', 'rgba(255,255,255,0.24)');
    svg.appendChild(shine);

    clone.appendChild(svg);
    document.body.appendChild(clone);
    return clone;
}

export default function Board({ state, paletteId, showDebug = false, selectedBoltId, invalidBoltId, onBoltClick, animMove, onAnimDone, hintPreview, onHintDone }: Props) {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!animMove || !containerRef.current) return;
        const { move, preRects } = animMove;
        if (preRects.length === 0) {
            onAnimDone?.();
            return;
        }
        const clones: HTMLElement[] = [];
        const timers: number[] = [];

        const fromBoltRect = boltRect(move.fromBoltId);
        const toBoltRect = boltRect(move.toBoltId);
        const liftTop = Math.min(
            fromBoltRect ? fromBoltRect.top - LIFT_OFFSET : Number.POSITIVE_INFINITY,
            toBoltRect ? toBoltRect.top - LIFT_OFFSET : Number.POSITIVE_INFINITY
        );
        const safeLiftTop = Number.isFinite(liftTop) ? liftTop : 0;

        for (let i = 0; i < preRects.length; i++) {
            const pr = preRects[i];
            const tgtBolt = state.bolts.find((b) => b.id === move.toBoltId);
            if (!tgtBolt) continue;
            const targetIndex = tgtBolt.nuts.length - preRects.length + i;
            const targetSelector = `[data-bolt="${move.toBoltId}"] [data-nut-index="${targetIndex}"]`;
            const targetEl = document.querySelector(targetSelector) as HTMLElement | null;
            if (!targetEl) continue;
            const targetRect = targetEl.getBoundingClientRect();
            const prRect = { left: pr.left, top: pr.top, width: pr.width, height: pr.height } as DOMRect;

            const clone = createPreviewClone(prRect, pr.color, 'move-preview-clone');
            clones.push(clone);

            const liftY = safeLiftTop - i * LIFT_STAGGER;
            const hoverTop = safeLiftTop - i * LIFT_STAGGER;

            requestAnimationFrame(() => {
                transitionClone(clone, prRect, pr.left, liftY, LIFT_DURATION_MS, EASE_LIFT);
            });
            timers.push(window.setTimeout(() => {
                transitionClone(clone, prRect, targetRect.left, hoverTop, HOVER_DURATION_MS, EASE_SOFT);
            }, HOVER_DELAY_MS));
            timers.push(window.setTimeout(() => {
                transitionClone(clone, prRect, targetRect.left, targetRect.top, HOVER_DURATION_MS, EASE_MOVE);
            }, DROP_DELAY_MS));
        }

        const t = window.setTimeout(() => {
            clones.forEach((c) => c.remove());
            clones.length = 0;
            onAnimDone?.();
        }, ANIM_TOTAL_MS);
        return () => {
            clearTimeout(t);
            timers.forEach((timer) => clearTimeout(timer));
            clones.forEach((c) => c.remove());
            clones.length = 0;
        };
    }, [animMove, state, onAnimDone]);

    useEffect(() => {
        if (!hintPreview || !containerRef.current) return;
        if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
            onHintDone?.();
            return;
        }

        const fromBolt = state.bolts.find((bolt) => bolt.id === hintPreview.fromBoltId);
        const toBolt = state.bolts.find((bolt) => bolt.id === hintPreview.toBoltId);
        if (!fromBolt || !toBolt || hintPreview.count <= 0) {
            onHintDone?.();
            return;
        }

        const sourceRects = Array.from({ length: hintPreview.count }, (_, offset) => {
            const slotIndex = fromBolt.nuts.length - hintPreview.count + offset;
            const selector = `[data-bolt="${hintPreview.fromBoltId}"] [data-nut-index="${slotIndex}"] [data-preview-fill]`;
            return document.querySelector(selector) as SVGGraphicsElement | null;
        }).filter(Boolean) as SVGGraphicsElement[];

        if (sourceRects.length !== hintPreview.count) {
            onHintDone?.();
            return;
        }

        const targetRects = hintPreview.allowed
            ? Array.from({ length: hintPreview.count }, (_, offset) => {
                const slotIndex = toBolt.nuts.length + offset;
                const selector = `[data-bolt="${hintPreview.toBoltId}"] [data-slot-index="${slotIndex}"]`;
                return document.querySelector(selector) as SVGGraphicsElement | null;
            }).filter(Boolean) as SVGGraphicsElement[]
            : [];

        if (hintPreview.allowed && targetRects.length !== hintPreview.count) {
            onHintDone?.();
            return;
        }

        const fromBoltRect = boltRect(hintPreview.fromBoltId);
        const toBoltRect = boltRect(hintPreview.toBoltId);
        if (!fromBoltRect) {
            onHintDone?.();
            return;
        }

        const liftTop = Math.min(
            fromBoltRect.top - LIFT_OFFSET,
            toBoltRect ? toBoltRect.top - LIFT_OFFSET : fromBoltRect.top - LIFT_OFFSET
        );
        const liftNudgeX = hintPreview.allowed ? 0 : LIFT_NUDGE_DENIED;
        const clones: HTMLElement[] = [];
        const timers: number[] = [];

        sourceRects.forEach((sourceEl, index) => {
            const sourceRect = sourceEl.getBoundingClientRect();
            const fill = sourceEl.getAttribute('data-preview-fill') || '#bdbdbd';
            const clone = createPreviewClone(sourceRect, fill);
            clones.push(clone);

            const liftX = sourceRect.left + liftNudgeX;
            const liftY = liftTop - index * LIFT_STAGGER;

            requestAnimationFrame(() => {
                transitionClone(clone, sourceRect, liftX, liftY, LIFT_DURATION_MS, EASE_LIFT);
            });

            if (!hintPreview.allowed) {
                timers.push(window.setTimeout(() => {
                    transitionClone(clone, sourceRect, sourceRect.left, sourceRect.top, LIFT_DURATION_MS, EASE_SOFT);
                }, HOVER_DELAY_MS));
                return;
            }

            const targetRect = targetRects[index].getBoundingClientRect();
            const hoverLeft = targetRect.left;
            const hoverTop = liftTop - index * LIFT_STAGGER;

            timers.push(window.setTimeout(() => {
                transitionClone(clone, sourceRect, hoverLeft, hoverTop, HOVER_DURATION_MS, EASE_SOFT);
            }, HOVER_DELAY_MS));
            timers.push(window.setTimeout(() => {
                transitionClone(clone, sourceRect, targetRect.left, targetRect.top, HOVER_DURATION_MS, EASE_MOVE);
            }, DROP_DELAY_MS));
        });

        const totalDuration = hintPreview.allowed ? ANIM_TOTAL_MS : HINT_DENIED_TOTAL_MS;
        timers.push(window.setTimeout(() => {
            clones.forEach((clone) => clone.remove());
            onHintDone?.();
        }, totalDuration));

        return () => {
            timers.forEach((timer) => clearTimeout(timer));
            clones.forEach((clone) => clone.remove());
        };
    }, [hintPreview, onHintDone, state]);

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
                            movePreview={animMove ? { toBoltId: animMove.move.toBoltId, count: animMove.move.count } : null}
                            hintPreview={hintPreview ? { fromBoltId: hintPreview.fromBoltId, count: hintPreview.count } : null}
                            onClick={onBoltClick}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
