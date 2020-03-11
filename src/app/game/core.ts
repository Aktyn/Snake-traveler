import scene from '../graphics/scene';

class Core {
  private animId = 0;

  constructor() {
    console.log('Core');
  }

  init() {
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
      //console.log(delta);

      scene.render();
    };

    tick(0);
  }
}

const core = new Core();
export default core;
