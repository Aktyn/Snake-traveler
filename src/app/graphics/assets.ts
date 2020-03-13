import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { Object3D } from 'three';

const loader = new OBJLoader();

let loaded = false;
const loadListeners: Function[] = [];

const Assets = {
  meshes: {
    block1: {
      mesh: null as Object3D | null,
      path: require('../../assets/meshes/block_solid.obj')
    }
  }
};

function loadMesh(path: string) {
  return new Promise<Object3D>((resolve, reject) => {
    loader.load(
      path,
      group => {
        if (group.children.length < 0) {
          reject(new Error('Cannot load mesh'));
        } else {
          resolve(group.children[0]);
        }
        //group.children.forEach(_obj => {
        //@ts-ignore
        // obj.material = material;

        /*for (let x = -10; x <= 10; x++) {
          for (let y = -10; y <= 10; y++) {
            const obj = _obj.clone();
            //@ts-ignore
            obj.material = material;
            obj.receiveShadow = true;
            obj.castShadow = true;
            obj.position.set(x, y, (Math.sqrt(x ** 2 + y ** 2) / 3) | 0);
            this.scene.add(obj);
          }
        }*/
        //});
      },
      () => {}, //ignore progress
      reject
    );
  });
}

async function load() {
  for (const meshData of Object.values(Assets.meshes)) {
    meshData.mesh = await loadMesh(meshData.path);
  }

  loadListeners.forEach(listener => listener());
  loadListeners.length = 0;
  loaded = true;
}

load().catch(console.error);

export function onAssetsLoaded(callback: Function) {
  if (loaded) {
    callback();
  } else {
    loadListeners.push(callback);
  }
}

export default Assets;
