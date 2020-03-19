import renderer from '../graphics/sceneRenderer';
import WorldMap from './worldMap';
import { assert } from '../common/utils';

class Core {
  private animId = 0;
  private debugger: ((debugInfo: string[]) => void) | null = null;
  private debuggerContent: string[] = [];
  private map: WorldMap | null = null;

  private readonly wheelListener = this.onWheel.bind(this);
  private readonly keyDownListener = this.onKeyDown.bind(this);
  private readonly keyUpListener = this.onKeyUp.bind(this);

  private initControls() {
    window.addEventListener('mousewheel', this.wheelListener);
    window.addEventListener('keydown', this.keyDownListener);
    window.addEventListener('keyup', this.keyUpListener);
  }

  private onWheel(event: Event) {
    this.map?.zoom((event as MouseWheelEvent).deltaY / 53);
  }

  private onKeyDown(event: KeyboardEvent) {
    this.onKey(event.key.toUpperCase(), true);
  }

  private onKeyUp(event: KeyboardEvent) {
    this.onKey(event.key.toUpperCase(), false);
  }

  private onKey(key: string, pressed: boolean) {
    switch (key) {
      case 'A':
      case 'ARROWLEFT':
        (this.map?.getTargetPlayer()?.steering || ({} as any)).left = pressed;
        break;
      case 'D':
      case 'ARROWRIGHT':
        (this.map?.getTargetPlayer()?.steering || ({} as any)).right = pressed;
        break;
    }
  }

  private update(delta: number) {
    assert(this.map !== null, 'World map does not exists');

    this.map.update(delta);
  }

  private startUpdateLoop() {
    const animId = ++this.animId;

    let lastTime = 0;
    let delta = 0;

    const tick = (time: number) => {
      if (animId !== this.animId) {
        console.info('Animation loop has been break');
        return;
      }

      requestAnimationFrame(tick);
      delta = Math.min(1000, time - lastTime);
      lastTime = time;

      this.update(delta / 1000.0);
      renderer.render();

      if (this.debugger) {
        this.debugger(this.debuggerContent);
        this.debuggerContent = [];
      }
    };

    tick(0);
  }

  init() {
    const randX = 0; //(Math.random() * (1 << 30)) | 0;
    const randY = 0; //(Math.random() * (1 << 30)) | 0;
    this.map = new WorldMap(randX, randY);
    this.map.spawnPlayer(randX, randY);

    this.startUpdateLoop();
    this.initControls();
  }

  registerDebugger(func: (debugInfo: string[]) => void) {
    this.debugger = func;
  }

  debug(content: string) {
    this.debuggerContent.push(content);
  }
}

const core = new Core();
export default core;
