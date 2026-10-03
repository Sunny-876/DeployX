declare module 'unzipper' {
  import { Writable } from 'stream';

  export interface ExtractOptions {
    path: string;
  }

  export function Extract(options: ExtractOptions): Writable & {
    promise(): Promise<void>;
  };

  const unzipper: any;
  export default unzipper;
}
