declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.mp3' {
    const src: string;
    export default src;
}
declare module '*.css';
declare module '*.wav' {
    const src: string;
    export default src;
}

declare const __APP_VERSION__: string;
