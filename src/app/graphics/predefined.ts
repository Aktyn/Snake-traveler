import * as THREE from 'three';
import Assets, { onAssetsLoaded } from './assets';
import { assert } from '../common/utils';

export enum BlockTypes {
  METAL_CRATE,
  GRASS
}

const predefinedBlocks = ((data: { [index in BlockTypes]: THREE.Object3D }) => {
  const prepareMaterials = () => ({
    crateMaterial: new THREE.MeshPhongMaterial({
      //color: new THREE.Color('#fff'),
      map: Assets.textures.crate,
      specularMap: Assets.textures.crateLM,
      specular: new THREE.Color('#fff'),
      normalMap: Assets.textures.crateNM,
      //normalScale: new THREE.Vector2(0.75, 0.75),
      transparent: false
    }),
    grass: new THREE.MeshPhongMaterial({
      map: Assets.textures.grass,
      specularMap: Assets.textures.grassLM,
      specular: new THREE.Color('#fff')
    })
  });

  const makeObject = (mesh: THREE.Object3D, material?: THREE.Material) => {
    //@ts-ignore
    mesh.material = material;
    return mesh;
  };

  onAssetsLoaded(() => {
    const materials = prepareMaterials();

    assert(Assets.meshes.block1.mesh !== null, 'Mesh not loaded');
    //data[BlockTypes.METAL_CRATE] = makeObject(Assets.meshes.block1.mesh, materials.crateMaterial);

    Object.assign(data, {
      [BlockTypes.METAL_CRATE]: makeObject(Assets.meshes.block1.mesh.clone(), materials.crateMaterial),
      [BlockTypes.GRASS]: makeObject(Assets.meshes.block1.mesh.clone(), materials.grass)
    } as { [index in BlockTypes]: THREE.Object3D });
  });
  return data;
})({} as never);

export default predefinedBlocks;
