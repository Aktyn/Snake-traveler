import scene from '../graphics/scene';
import WorldMap from './worldMap';

class Core {
  private animId = 0;
  private map: WorldMap | null = null;

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
      delta = time - lastTime;
      lastTime = time;

      scene.render();
    };

    tick(0);
  }

  init() {
    this.map = new WorldMap((Math.random() * (1 << 30)) | 0, (Math.random() * (1 << 30)) | 0);
    this.startUpdateLoop();
  }
}

const core = new Core();
export default core;
