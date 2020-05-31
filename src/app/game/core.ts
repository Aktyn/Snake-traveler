import WorldMap from './worldMap';
import { assert, shortAngleDist } from '../common/utils';
import SceneRenderer from './sceneRenderer';
import * as Debugger from '../debugger';
import { Settings, SteeringType } from '../game/userSettings';
import { WorldSchema } from '../common/schemas';
import EnemySpawner from './objects/enemySpawner';
import { AppContextSchema } from '../main/App';

export default class Core {
  private animId = 0;

  private map: WorldMap | null = null;
  private readonly renderer: SceneRenderer;

  private paused = false;
  private readonly cursorPos = { x: 0, y: 0 };

  //time durations are given in seconds
  private readonly gameConfig = {
    firstEnemySpawnerDelay: 10,
    enemySpawnerFrequency: 1,
    maxEnemySpawners: 16
  };

  private enemySpawnerTimer = this.gameConfig.firstEnemySpawnerDelay;

  private readonly keyDownListener = this.onKeyDown.bind(this);
  private readonly keyUpListener = this.onKeyUp.bind(this);
  private readonly mouseDownListener = this.onMouseDown.bind(this);
  private readonly mouseUpListener = this.onMouseUp.bind(this);
  private readonly mouseMoveListener = this.onMouseMove.bind(this);
  private readonly mouseWheelListener = this.onMouseWheel.bind(this);

  constructor(renderer: SceneRenderer) {
    this.renderer = renderer;
  }

  private initControls() {
    window.addEventListener('keydown', this.keyDownListener);
    window.addEventListener('keyup', this.keyUpListener);

    window.addEventListener('mousedown', this.mouseDownListener);
    window.addEventListener('mouseup', this.mouseUpListener);
    window.addEventListener('mousemove', this.mouseMoveListener);

    window.addEventListener('mousewheel', this.mouseWheelListener);
    window.addEventListener('DOMMouseScroll', this.mouseWheelListener);
  }

  private unloadControls() {
    window.removeEventListener('keydown', this.keyDownListener);
    window.removeEventListener('keyup', this.keyUpListener);

    window.removeEventListener('mousedown', this.mouseDownListener);
    window.removeEventListener('mouseup', this.mouseUpListener);
    window.removeEventListener('mousemove', this.mouseMoveListener);

    window.removeEventListener('mousewheel', this.mouseWheelListener);
    window.removeEventListener('DOMMouseScroll', this.mouseWheelListener);
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

  private onMouseWheel(event: Event) {
    this.map?.zoom((event as MouseWheelEvent).deltaY / 53);

    const e = window.event || event;
    //@ts-ignore
    const delta = Math.max(-1, Math.min(1, e.wheelDelta || -e.detail));
    this.map?.camera.zoom(delta);
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

    if (
      EnemySpawner.instances < this.gameConfig.maxEnemySpawners &&
      (this.enemySpawnerTimer += delta) > this.gameConfig.enemySpawnerFrequency
    ) {
      this.enemySpawnerTimer = 0;

      const spot = this.map.getRandomSpot();
      this.map.addObject(new EnemySpawner(spot.x, spot.y, this.map));
    }

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

  private loadMap(world: WorldSchema, context: AppContextSchema, onMapFullyLoaded?: Function) {
    return new WorldMap(world, context, (map: WorldMap) => {
      map.spawnPlayer(world.data.playerX, world.data.playerY, world.data.playerRot);
      onMapFullyLoaded?.();
    });
  }

  getMap() {
    return this.map;
  }

  init(world: WorldSchema, context: AppContextSchema, onMapFullyLoaded?: Function) {
    if (this.map) {
      //core has been already initialized - just reload map with different world
      this.map.destroy();
      this.map = this.loadMap(world, context, onMapFullyLoaded);
      return;
    }

    this.map = this.loadMap(world, context, onMapFullyLoaded);

    this.startUpdateLoop();
    this.initControls();
  }

  unload() {
    this.unloadControls();
    if (this.map) {
      this.map.destroy();
      this.map = null;
    }
    this.animId++;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }
}
