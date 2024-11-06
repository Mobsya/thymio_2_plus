declare module 'react-native-static-server' {
    export default class StaticServer {
      constructor(port: number, path: string, options?: object);
      start(): Promise<string>;
      stop(): Promise<void>;
      addStateListener(listener: (state: number) => void): void;
    }
  }
