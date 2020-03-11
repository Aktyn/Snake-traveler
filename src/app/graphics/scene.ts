import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

const blockMesh = require('../../assets/meshes/block.obj');
console.log(blockMesh);

class Scene {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.Camera;

  private static loader = new OBJLoader();

  constructor() {
    this.camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20);
    this.camera.position.z = 10;
    this.scene = new THREE.Scene();
    //const geometry = new THREE.BoxGeometry(1, 1, 1);
    //const material = new THREE.MeshNormalMaterial();
    //const mesh = new THREE.Mesh(geometry, material);
    //this.scene.add(mesh);
    Scene.loader.load(
      blockMesh,
      group => {
        group.children.forEach(_obj => {
          //@ts-ignore
          // obj.material = material;

          for (let x = -10; x <= 10; x++) {
            for (let y = -10; y <= 10; y++) {
              const obj = _obj.clone();
              obj.receiveShadow = true;
              obj.castShadow = true;
              obj.position.set(x, y, (Math.sqrt(x ** 2 + y ** 2) / 3) | 0);
              this.scene.add(obj);
            }
          }
        });
      },
      progress => console.log(progress)
    );
    // this.scene.add(block);

    const light = new THREE.PointLight(0xffffff, 1, 50);
    light.castShadow = true;
    light.position.set(8, 0, 4);
    light.shadow.mapSize.width = 256; // default
    light.shadow.mapSize.height = 256; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 20; // default
    this.scene.add(light);

    const light2 = new THREE.PointLight(0xff5555, 1, 50);
    light2.castShadow = true;
    light2.position.set(-4, 0, 3);
    light2.shadow.mapSize.width = 256; // default
    light2.shadow.mapSize.height = 256; // default
    light2.shadow.camera.near = 0.5; // default
    light2.shadow.camera.far = 20; // default
    this.scene.add(light2);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
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

  initDisplay(targetElement: HTMLElement) {
    targetElement.appendChild(this.renderer.domElement);
  }

  render() {
    /*this.scene.children.forEach(child => {
      //TEMP
      child.rotation.x += 0.01;
      child.rotation.y += 0.02;
    });*/

    this.renderer.render(this.scene, this.camera);
  }
}

const scene = new Scene();
export default scene;
