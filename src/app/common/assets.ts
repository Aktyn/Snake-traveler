const SHADERS_PATH = require.context('../../assets/shaders');
const TEXTURES_PATH = require.context('../../assets/textures');

let loaded = false;
const loadListeners: Function[] = [];

const emptyShader = { vertex: '', fragment: '' };

const Assets = {
  shaders: {
    post: emptyShader,
    main: emptyShader
  },
  textures: {
    'player.png': null,
    'player_segment.png': null,
    'double_gun.png': null,
    'bullet.png': null,
    'enemy_spawner.png': null,
    'spiky_enemy.png': null,
    'pixel.png': null
  } as { [_: string]: HTMLImageElement | null },
  emptyTexture: new Image()
};

export type Assets = typeof Assets;

function loadImage(path: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img');
    img.onload = function() {
      img.onload = null;
      resolve(img);
    };
    img.onerror = reject;

    if (!path.startsWith('./')) path = './' + path;
    img.src = TEXTURES_PATH(path);
  });
}

async function loadShaderSource(vertex_file_path: string, fragment_file_path: string) {
  if (!vertex_file_path.startsWith('./')) vertex_file_path = './' + vertex_file_path;
  if (!fragment_file_path.startsWith('./')) fragment_file_path = './' + fragment_file_path;

  const vertex = await fetch(SHADERS_PATH(vertex_file_path)).then(res => res.text());
  if (!vertex) throw new Error('Cannot load file (' + vertex + ')');

  const fragment = await fetch(SHADERS_PATH(fragment_file_path)).then(res => res.text());
  if (!fragment) throw new Error('Cannot load file (' + fragment + ')');

  return {
    vertex,
    fragment
  };
}

async function load() {
  Assets.shaders.post = await loadShaderSource('post_game.vs', 'post_game_long.fs');
  Assets.shaders.main = await loadShaderSource('main.vs', 'main.fs');
  for (const texture of Object.keys(Assets.textures)) {
    Assets.textures[texture] = await loadImage(texture);
  }

  loadListeners.forEach(listener => listener(Assets));
  loadListeners.length = 0;
  loaded = true;
}

load().catch(console.error);

export function onAssetsLoaded(callback: (assets: Assets) => void) {
  if (loaded) {
    callback(Assets);
  } else {
    loadListeners.push(callback);
  }
}

export default Assets;
