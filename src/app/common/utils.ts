export function assert(condition: any, msg?: string): asserts condition {
  if (!condition) {
    throw new Error(msg);
  }
}

export function isWebGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

export function mix(v1: number, v2: number, factor: number) {
  return v1 * (1.0 - factor) + v2 * factor;
}

function shortAngleDist(angle: number, targetAngle: number) {
  const fullAngle = Math.PI * 2;
  const angleDifference = (targetAngle - angle) % fullAngle;
  return ((2 * angleDifference) % fullAngle) - angleDifference;
}

export function angleLerp(angle: number, tangleAngle: number, t: number) {
  return angle + shortAngleDist(angle, tangleAngle) * t;
}
