import * as THREE from 'three';

import Vec2 from '../common/math/vec2';

class Scene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 50);
    // this.camera.position.z = 10;
    this.scene = new THREE.Scene();

    // const texture = new THREE.TextureLoader().load(crateTexture);
    // texture.wrapS = THREE.ClampToEdgeWrapping;
    // texture.wrapT = THREE.ClampToEdgeWrapping;

    // const texture2 = new THREE.TextureLoader().load(blockCrateLM);
    // texture2.wrapS = THREE.ClampToEdgeWrapping;
    // texture2.wrapT = THREE.ClampToEdgeWrapping;

    // const texture3 = new THREE.TextureLoader().load(nmTexture);
    // texture2.wrapS = THREE.ClampToEdgeWrapping;
    // texture2.wrapT = THREE.ClampToEdgeWrapping;

    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshNormalMaterial();

    // material.emissive.setRGB(0.5, 1, 1);
    //const mesh = new THREE.Mesh(geometry, material);
    //this.scene.add(mesh);

    // this.scene.add(block);

    //const light = new THREE.AmbientLight(0x050a0f);
    const light = new THREE.AmbientLight(0x202020);
    this.scene.add(light);

    // const light = new THREE.PointLight(0xffffff, 1, 100);
    // light.castShadow = true;
    // light.position.set(4, 4, 8);
    // light.shadow.mapSize.width = 256; // default
    // light.shadow.mapSize.height = 256; // default
    // light.shadow.camera.near = 0.5; // default
    // light.shadow.camera.far = 40; // default
    // this.scene.add(light);

    // const light2 = new THREE.PointLight(0xff5555, 1, 100);
    // light2.castShadow = true;
    // light2.position.set(-4, 0, 3);
    // light2.shadow.mapSize.width = 256; // default
    // light2.shadow.mapSize.height = 256; // default
    // light2.shadow.camera.near = 0.5; // default
    // light2.shadow.camera.far = 40; // default
    // this.scene.add(light2);

    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { alpha: false, antialias: true }) as WebGLRenderingContext;
    this.renderer = new THREE.WebGLRenderer({ canvas, context });
    // this.renderer.setClearColor(new THREE.Color('#009688'));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.resize();

    this.initListeners();
  }

  private resize() {
    //@ts-ignore
    this.camera.aspect = window.innerWidth / window.innerHeight;
    //@ts-ignore
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  private initListeners() {
    window.addEventListener('resize', event => {
      this.resize();
    });
  }

  setCameraPos(pos: Vec2, height = this.camera.position.z) {
    this.camera.position.set(pos.x, pos.y, height);
  }

  addObject(object: THREE.Object3D) {
    this.scene.add(object);
  }

  removeObject(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  addLight(x: number, y: number, z: number, color: number) {
    const light = new THREE.PointLight(color, 1, 100);
    light.castShadow = true;
    light.position.set(x, y, z);
    light.shadow.mapSize.width = 256; // default
    light.shadow.mapSize.height = 256; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 40; // default
    this.scene.add(light);
    return light;
  }

  removeLight(light: THREE.PointLight) {
    this.scene.remove(light);
  }

  initDisplay(targetElement: HTMLElement) {
    targetElement.appendChild(this.renderer.domElement);
  }

  render() {
    // this.scene.children.forEach((child, index) => {
    //   //TEMP
    //   child.rotation.x += 0.01 * (1 + (index % 3));
    //   child.rotation.y += 0.005 * (1 + (index % 3));
    // });

    this.renderer.render(this.scene, this.camera);
  }
}

const scene = new Scene();
export default scene;
