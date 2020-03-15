import scene from '../graphics/scene';
import WorldMap from './worldMap';
import { assert } from '../common/utils';
import Player from './player';

class Core {
  private animId = 0;
  private debugger: ((debugInfo: string) => void) | null = null;
  private debuggerContent = '';
  private map: WorldMap | null = null;
  private player: Player | null = null;

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
    //console.log(key, pressed);
    switch (key) {
      case 'A':
      case 'ARROWLEFT':
        this.player && (this.player.steering.left = pressed);
        break;
      case 'D':
      case 'ARROWRIGHT':
        this.player && (this.player.steering.right = pressed);
        break;
    }
  }

  private update(delta: number) {
    assert(this.map !== null, 'World map does not exists');
    assert(this.player !== null, 'Player does not exists');

    this.map.getCamera().setPos(this.player.x, this.player.y);
    this.map.getCamera().setRotation(this.player.getAngle() - Math.PI / 2);
    this.map.update(delta);

    //THIS IS TEMPORTARY CAMERA MOVING CODE
    // if (this.steering.left) {
    //   this.map.getCamera().move(-delta * 100, 0);
    // }
    // if (this.steering.right) {
    //   this.map.getCamera().move(delta * 100, 0);
    // }
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
      scene.render();

      if (this.debugger) {
        this.debugger(this.debuggerContent);
        this.debuggerContent = '';
      }
    };

    tick(0);
  }

  init() {
    // this.map = new WorldMap((Math.random() * (1 << 30)) | 0, (Math.random() * (1 << 30)) | 0);
    this.map = new WorldMap(0, 0);

    this.player = new Player(0, 0, 1);
    this.map.addObject(this.player);

    this.startUpdateLoop();
    this.initControls();
  }

  registerDebugger(func: (debugInfo: string) => void) {
    this.debugger = func;
  }

  debug(content: string) {
    this.debuggerContent += content + '\n';
  }
}

const core = new Core();
export default core;
