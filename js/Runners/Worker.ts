import Runner, { RunnerEventHandler, RunnerMessage } from '../Runner';

export class WorkerRunner extends Runner {
  worker: Worker;

  constructor(workerURL: string | URL) {
    super();

    this.worker = new Worker(workerURL);

    this.worker.addEventListener('error', (error) =>
      this.emit('error', error),
    );

    this.worker.addEventListener('message', ({ data }) =>
      this.emit('message', data),
    );
  }

  async init(code: number[], input: string, args: string) {
    this.postMessage({
      type: 'run',
      code,
      args,
      input,
    });
  }

  postMessage(message: any, options?: StructuredSerializeOptions): void {
    return this.worker.postMessage(message, options);
  }

  terminate(): void {
    return this.worker.terminate();
  }
}

export default WorkerRunner;
