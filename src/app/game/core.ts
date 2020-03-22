import WorldMap from './worldMap';
import { assert } from '../common/utils';
import SceneRenderer from './sceneRenderer';
import * as Debugger from '../debugger';

export default class Core {
  private animId = 0;

  private map: WorldMap | null = null;
  private readonly renderer: SceneRenderer;

  private readonly wheelListener = this.onWheel.bind(this);
  private readonly keyDownListener = this.onKeyDown.bind(this);
  private readonly keyUpListener = this.onKeyUp.bind(this);

  constructor(renderer: SceneRenderer) {
    this.renderer = renderer;
  }

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

    Debugger.clear();
    this.map.update(delta);
    this.renderer.render(this.map);
    Debugger.apply();
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
    };

    tick(0);
  }

  init() {
    const randX = Math.random() * (1 << 16);
    const randY = Math.random() * (1 << 16);
    this.map = new WorldMap(randX, randY);
    this.map.spawnPlayer(randX, randY);

    this.startUpdateLoop();
    this.initControls();
  }
}
