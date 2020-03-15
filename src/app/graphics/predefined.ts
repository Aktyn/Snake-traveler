import * as THREE from 'three';
import Assets, { onAssetsLoaded } from './assets';
import { assert } from '../common/utils';

export enum ObjectType {
  METAL_CRATE,
  GRASS_BLOCK,
  LAVA_BLOCK,
  SNAKE_SEGMENT
}

const prepareMaterials = () => ({
  crate: new THREE.MeshPhongMaterial({
    //color: new THREE.Color('#fff'),
    map: Assets.textures.crate,
    specularMap: Assets.textures.crateLM,
    specular: new THREE.Color('#fff'),
    normalMap: Assets.textures.crateNM
    //normalScale: new THREE.Vector2(0.75, 0.75),
  }),
  grass: new THREE.MeshPhongMaterial({
    map: Assets.textures.grass,
    specularMap: Assets.textures.grassLM,
    specular: new THREE.Color('#fff')
  }),
  lava: new THREE.MeshPhongMaterial({
    map: Assets.textures.lava,
    specularMap: Assets.textures.lavaLM,
    specular: new THREE.Color('#555'),
    normalMap: Assets.textures.rockNM,
    normalScale: new THREE.Vector2(0.5)
  }),

  playerSegment: new THREE.MeshPhongMaterial({
    color: new THREE.Color('#f55'),
    specularMap: Assets.textures.rustLM,
    specular: new THREE.Color('#fff')
  })
});

const predefinedObjects = ((data: { [index in ObjectType]: THREE.Object3D }) => {
  const makeObject = (mesh: THREE.Object3D, material?: THREE.Material) => {
    //@ts-ignore
    material && (mesh.material = material);
    return mesh;
  };

  onAssetsLoaded(() => {
    const materials = prepareMaterials();

    assert(Assets.meshes.block1.mesh !== null, 'Mesh block1 is not loaded');
    assert(Assets.meshes.snakeSegment.mesh !== null, 'Mesh snakeSegment is not loaded');

    Object.assign(data, {
      [ObjectType.METAL_CRATE]: makeObject(Assets.meshes.block1.mesh.clone(), materials.crate),
      [ObjectType.GRASS_BLOCK]: makeObject(Assets.meshes.block1.mesh.clone(), materials.grass),
      [ObjectType.LAVA_BLOCK]: makeObject(Assets.meshes.block1.mesh.clone(), materials.lava),
      [ObjectType.SNAKE_SEGMENT]: makeObject(Assets.meshes.snakeSegment.mesh.clone(), materials.playerSegment)
    } as { [index in ObjectType]: THREE.Object3D });
  });
  return data;
})({} as never);

export default predefinedObjects;
