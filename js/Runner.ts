import { EventEmitter } from 'eventemitter3';
import { MelbaType } from 'melba-toast';

export type RunnerMessage = {
    type: 'run';
    code: number[];
    args: string;
    input: string;
  } | {
    type: 'output';
    output: string | undefined;
    error: string | undefined;
  } | {
    type: 'done';
    exitCode: number;
  };

export type RunnerError = {
  'error': Error
};

export type RunnerEventHandler = (message: RunnerMessage | RunnerError) => unknown;

export abstract class Runner extends EventEmitter<{
  error: RunnerError;
  message: RunnerMessage;
  done: {
    exitCode: number | undefined;
  };
  output: {
    output: string | undefined;
    error: string | undefined;
  };
  toast: {
    message: string;
    type: MelbaType | undefined;
  }
}> {
  protected constructor() {
    super();

    this.on('message', (message: RunnerMessage) => {
      if (message.type === 'run') {
        return this.init(message.code, message.input, message.args);
      }

      if (message.type === 'output') {
        return this.emit('output', {
          output: message.output,
          error: message.error,
        });
      }

      if (message.type === 'done') {
        this.emit('done', {
          exitCode: message.exitCode,
        });

        return this.terminate();
      }

      console.warn('Unhandled message', message);
    });
  }

  abstract init(code: number[], input: string, args: string): Promise<void>;
  abstract terminate(): void;
}

export default Runner;
