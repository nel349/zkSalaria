import { Buffer } from 'buffer';
import process from 'process';

// Provide Buffer polyfill for browser envs
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Buffer = Buffer;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).process = process;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).global = window;


