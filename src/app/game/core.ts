import WorldMap from './worldMap';
import { assert, shortAngleDist } from '../common/utils';
import SceneRenderer from './sceneRenderer';
import * as Debugger from '../debugger';
import { Settings, SteeringType } from '../game/userSettings';
import { WorldSchema } from '../common/schemas';

export default class Core {
  private animId = 0;

  private map: WorldMap | null = null;
  private readonly renderer: SceneRenderer;

  private paused = false;
  private readonly cursorPos = { x: 0, y: 0 };

  private readonly wheelListener = this.onWheel.bind(this);
  private readonly keyDownListener = this.onKeyDown.bind(this);
  private readonly keyUpListener = this.onKeyUp.bind(this);
  private readonly mouseDownListener = this.onMouseDown.bind(this);
  private readonly mouseUpListener = this.onMouseUp.bind(this);
  private readonly mouseMoveListener = this.onMouseMove.bind(this);

  constructor(renderer: SceneRenderer) {
    this.renderer = renderer;
  }

  private initControls() {
    window.addEventListener('mousewheel', this.wheelListener);
    window.addEventListener('keydown', this.keyDownListener);
    window.addEventListener('keyup', this.keyUpListener);

    window.addEventListener('mousedown', this.mouseDownListener); //TODO: assign to renderer canvas
    window.addEventListener('mouseup', this.mouseUpListener);
    window.addEventListener('mousemove', this.mouseMoveListener);

    //TODO: change speed with mousewheel event and target speed property
  }

  private unloadControls() {
    window.removeEventListener('mousewheel', this.wheelListener);
    window.removeEventListener('keydown', this.keyDownListener);
    window.removeEventListener('keyup', this.keyUpListener);

    window.removeEventListener('mousedown', this.mouseDownListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);
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
    if (Settings.steering !== SteeringType.KEYBOARD) {
      return;
    }
    switch (key) {
      case 'A':
      case 'ARROWLEFT':
        (this.map?.getTargetPlayer()?.steering || ({} as any)).left = pressed;
        break;
      case 'D':
      case 'ARROWRIGHT':
        (this.map?.getTargetPlayer()?.steering || ({} as any)).right = pressed;
        break;
      case 'W':
      case 'ARROWUP':
        (this.map?.getTargetPlayer()?.steering || ({} as any)).up = pressed;
        break;
      case 'S':
      case 'ARROWDOWN':
        (this.map?.getTargetPlayer()?.steering || ({} as any)).down = pressed;
        break;
      case ' ': //spacebar
        (this.map?.getTargetPlayer()?.steering || ({} as any)).shooting = pressed;
        break;
    }
  }

  private onMouseDown(event: MouseEvent) {
    this.onMouse(event.button, true);
  }

  private onMouseUp(event: MouseEvent) {
    this.onMouse(event.button, false);
  }

  private onMouse(button: number, pressed: boolean) {
    if (Settings.steering !== SteeringType.MOUSE) {
      return;
    }
    if (button === 0) {
      (this.map?.getTargetPlayer()?.steering || ({} as any)).shooting = pressed;
    }
  }

  private onMouseMove(event: MouseEvent) {
    this.cursorPos.x = event.clientX;
    this.cursorPos.y = event.clientY;
  }

  private updateMouseSteering() {
    //make player follow the cursor
    const player = this.map?.getTargetPlayer();
    if (!player || !this.map) {
      return;
    }

    //convert cursor position to world coordinates assuming the canvas fills entire screen
    const mouseX = ((this.cursorPos.x - window.innerWidth / 2) * 2) / window.innerHeight;
    const mouseY = (this.cursorPos.y / window.innerHeight) * 2 - 1;

    const x = this.map.camera.visibleX + mouseX;
    const y = this.map.camera.visibleY - mouseY;

    const dst = (player.x - x) ** 2 + (player.y - y) ** 2;
    const targetAngle = Math.atan2(player.y - y, player.x - x);

    const angleDst = shortAngleDist(player.fixedRot, targetAngle);

    if (Math.PI - Math.abs(angleDst) < Math.PI * (1 / 60)) {
      player.steering.right = player.steering.left = false;
    } else {
      player.steering.right = angleDst > 0;
      player.steering.left = !player.steering.right;
    }

    player.steering.up = dst > player.width ** 2 * 4;
    player.steering.down = !player.steering.up;
  }

  private update(delta: number) {
    assert(this.map !== null, 'World map does not exists');

    if (this.paused) {
      return;
    }

    if (Settings.steering === SteeringType.MOUSE) {
      this.updateMouseSteering();
    }

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

  init(world: WorldSchema, onMapFullyLoaded?: Function) {
    this.map = new WorldMap(world, 0, 0, (map: WorldMap) => {
      map.spawnPlayer(map.getCenter());
      onMapFullyLoaded?.();
    });

    this.startUpdateLoop();
    this.initControls();
  }

  unload() {
    this.unloadControls();
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }
}
