import { VM } from 'vm2';
import type { SandboxOptions } from '@frw/common';
import { SandboxError } from '@frw/common';

export class VMSandbox {
  private timeout: number;
  private sandbox: Record<string, unknown>;

  constructor(options: SandboxOptions = {}) {
    this.timeout = options.timeout || 5000;
    this.sandbox = options.sandbox || {};
  }

  run(code: string, context: Record<string, unknown> = {}): unknown {
    try {
      const vm = new VM({
        timeout: this.timeout,
        sandbox: { ...this.sandbox, ...context },
        eval: false,
        wasm: false,
        fixAsync: true
      });

      return vm.run(code);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SandboxError(`Sandbox execution failed: ${message}`);
    }
  }

  async runAsync(code: string, context: Record<string, unknown> = {}): Promise<unknown> {
    try {
      const vm = new VM({
        timeout: this.timeout,
        sandbox: { ...this.sandbox, ...context },
        eval: false,
        wasm: false,
        fixAsync: true
      });

      const wrappedCode = `(async () => { ${code} })()`;
      return await vm.run(wrappedCode);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new SandboxError(`Async sandbox execution failed: ${message}`);
    }
  }

  setContext(context: Record<string, unknown>): void {
    this.sandbox = { ...this.sandbox, ...context };
  }

  clearContext(): void {
    this.sandbox = {};
  }
}
