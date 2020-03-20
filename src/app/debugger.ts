let _debugger: ((debugInfo: string[]) => void) | null = null;
let debuggerContent: string[] = [];

export function registerDebugger(func: (debugInfo: string[]) => void) {
  _debugger = func;
}

export function debugLine(content: string) {
  debuggerContent.push(content);
}

export function clear() {
  debuggerContent = [];
}

export function apply() {
  if (!_debugger) {
    return;
  }
  _debugger(debuggerContent);
}
