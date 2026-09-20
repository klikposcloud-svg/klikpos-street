declare module 'next-pwa' {
  declare const register: () => void;
  declare const unregister: () => void;
}

declare module 'next-pwa/register' {
  export default function register(): void;
}

declare module 'next-pwa/runtime' {
  export function predefineRouting(): void;
  export function cleanupOutdatedCaches(): void;
}
