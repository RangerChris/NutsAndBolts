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

function createPreviewClone(sourceRect: DOMRect, fill: string, className = 'hint-preview-clone') {
    const clone = document.createElement('div');
    clone.className = className;
    clone.style.position = 'fixed';
    clone.style.left = `${sourceRect.left}px`;
    clone.style.top = `${sourceRect.top}px`;
    clone.style.width = `${sourceRect.width}px`;
    clone.style.height = `${sourceRect.height}px`;
    clone.style.zIndex = '9999';
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

        const fromBoltEl = document.querySelector(`[data-bolt="${move.fromBoltId}"]`) as HTMLElement | null;
        const toBoltEl = document.querySelector(`[data-bolt="${move.toBoltId}"]`) as HTMLElement | null;
        const fromBoltRect = fromBoltEl?.getBoundingClientRect();
        const toBoltRect = toBoltEl?.getBoundingClientRect();
        const liftTop = Math.min(fromBoltRect ? fromBoltRect.top - 18 : Number.POSITIVE_INFINITY, toBoltRect ? toBoltRect.top - 18 : Number.POSITIVE_INFINITY);
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

            const clone = createPreviewClone(
                {
                    left: pr.left,
                    top: pr.top,
                    width: pr.width,
                    height: pr.height,
                } as DOMRect,
                pr.color,
                'move-preview-clone'
            );
            clones.push(clone);

            const transitionTo = (left: number, top: number, duration: number, easing: string) => {
                clone.style.transition = `transform ${duration}ms ${easing}`;
                clone.style.transform = `translate(${left - pr.left}px, ${top - pr.top}px)`;
            };

            const liftY = safeLiftTop - i * 3;
            const hoverLeft = targetRect.left;
            const hoverTop = safeLiftTop - i * 3;

            requestAnimationFrame(() => {
                transitionTo(pr.left, liftY, 180, 'cubic-bezier(0.22, 1, 0.36, 1)');
            });
            timers.push(window.setTimeout(() => {
                transitionTo(hoverLeft, hoverTop, 220, 'ease-in-out');
            }, 210));
            timers.push(window.setTimeout(() => {
                transitionTo(targetRect.left, targetRect.top, 220, 'cubic-bezier(0.2, 0.9, 0.2, 1)');
            }, 470));
        }

        const t = window.setTimeout(() => {
            clones.forEach((c) => c.remove());
            clones.length = 0;
            onAnimDone?.();
        }, 760);
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

        const fromBoltEl = document.querySelector(`[data-bolt="${hintPreview.fromBoltId}"]`) as HTMLElement | null;
        const toBoltEl = document.querySelector(`[data-bolt="${hintPreview.toBoltId}"]`) as HTMLElement | null;
        const fromBoltRect = fromBoltEl?.getBoundingClientRect();
        const toBoltRect = toBoltEl?.getBoundingClientRect();
        if (!fromBoltRect) {
            onHintDone?.();
            return;
        }

        const liftTop = Math.min(fromBoltRect.top - 18, toBoltRect ? toBoltRect.top - 18 : fromBoltRect.top - 18);
        const liftNudgeX = hintPreview.allowed ? 0 : 10;
        const clones: HTMLElement[] = [];
        const timers: number[] = [];

        sourceRects.forEach((sourceEl, index) => {
            const sourceRect = sourceEl.getBoundingClientRect();
            const fill = sourceEl.getAttribute('data-preview-fill') || '#bdbdbd';
            const clone = createPreviewClone(sourceRect, fill);
            clones.push(clone);

            const liftX = sourceRect.left + liftNudgeX;
            const liftY = liftTop - index * 3;
            const stageOneDx = liftX - sourceRect.left;
            const stageOneDy = liftY - sourceRect.top;

            const transitionTo = (left: number, top: number, duration: number, easing: string) => {
                clone.style.transition = `transform ${duration}ms ${easing}`;
                clone.style.transform = `translate(${left - sourceRect.left}px, ${top - sourceRect.top}px)`;
            };

            requestAnimationFrame(() => {
                transitionTo(liftX, liftY, 180, 'cubic-bezier(0.22, 1, 0.36, 1)');
            });

            if (!hintPreview.allowed) {
                timers.push(window.setTimeout(() => {
                    transitionTo(sourceRect.left, sourceRect.top, 180, 'ease-in-out');
                }, 210));
                return;
            }

            const targetRect = targetRects[index].getBoundingClientRect();
            const hoverLeft = targetRect.left;
            const hoverTop = liftTop - index * 3;

            timers.push(window.setTimeout(() => {
                transitionTo(hoverLeft, hoverTop, 220, 'ease-in-out');
            }, 210));
            timers.push(window.setTimeout(() => {
                transitionTo(targetRect.left, targetRect.top, 220, 'cubic-bezier(0.2, 0.9, 0.2, 1)');
            }, 470));
        });

        const totalDuration = hintPreview.allowed ? 760 : 440;
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
