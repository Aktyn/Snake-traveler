import DynamicObject from './objects/dynamicObject';
import Chunk from './chunk';
import Vec2 from '../common/math/vec2';
import { getChunkAtPosition } from './common';

//common variables
let coords: number[][],
  obj1_i = 0,
  obj2_i = 0,
  c_i = 0,
  r_i = 0,
  r_s = 0,
  pX = 0.0,
  pY = 0.0,
  rr = 0.0,
  b_dx = 0.0,
  b_dy = 0.0,
  s = 0.0,
  c = 0.0,
  xx = 0.0,
  yy = 0.0,
  alpha = 0,
  safety = 0,
  b_product = 0.0,
  b_radius = 0.0,
  b_angle = 0.0,
  dot = 0.0,
  found = false;
const bounceVec = new Vec2(),
  currentVec = new Vec2();

//PARAMETERS
const PUSH_STEPS = 4;
const RAY_STEPS = 3;
const RAYS = 32;
const ANGLE_SHIFT = (Math.PI * 2.0) / RAYS;
const COLLISION_PUSH_FACTOR = 0.002;

function getBounceVec(object: DynamicObject, chunks: Chunk[][], centerChunkPos: Vec2, outVec?: Vec2) {
  b_radius = object.width;
  b_angle = 0;

  found = false;

  for (r_i = 0; r_i < RAYS; r_i++) {
    for (r_s = RAY_STEPS; r_s > 0; r_s--) {
      rr = b_radius * (r_s / RAY_STEPS);
      b_dx = Math.cos(b_angle) * rr;
      b_dy = Math.sin(b_angle) * rr;

      const alpha = getPixelAlpha(object.x + b_dx, object.y + b_dy, chunks, centerChunkPos);

      if (alpha === 255) {
        //this condition can be upgraded to bounce only specific color
        if (outVec) {
          outVec.sub(b_dx, b_dy);
        }

        found = true;
        break;
      }
    }

    b_angle += ANGLE_SHIFT;
  }
  return found;
}

function getPixelAlpha(x: number, y: number, chunks: Chunk[][], centerChunkPos: Vec2) {
  const chunk = getChunkAtPosition(x, y, chunks, centerChunkPos);

  if (!chunk || !chunk.isLoaded()) {
    return 255; //simulate collision behavior on chunk that is not loaded
  }

  pX = (x - (chunk.matrix.x - Chunk.SIZE)) / (Chunk.SIZE * 2);
  pY = 1 - (y - (chunk.matrix.y - Chunk.SIZE)) / (Chunk.SIZE * 2);

  return chunk.getForegroundPixelAlpha(pX, pY);
}

export default abstract class CollisionDetector {
  abstract onPainterCollision(object: DynamicObject, collisionX: number, collisionY: number): void;
  abstract onDynamicObjectsCollision(object1: DynamicObject, object2: DynamicObject): void;

  protected detectCollisions(dynamicObjects: DynamicObject[], chunks: Chunk[][], centerChunkPos: Vec2) {
    for (obj1_i = 0; obj1_i < dynamicObjects.length; obj1_i++) {
      this.detectSensorToPainterCollision(dynamicObjects[obj1_i], chunks, centerChunkPos);

      //detect collisions between dynamic objects
      for (obj2_i = obj1_i + 1; obj2_i < dynamicObjects.length; obj2_i++) {
        this.detectCircleToCircleCollision(dynamicObjects[obj1_i], dynamicObjects[obj2_i]);
      }
    }
  }

  private detectSensorToPainterCollision(object: DynamicObject, chunks: Chunk[][], centerChunkPos: Vec2) {
    coords = object.sensor.shape;

    for (c_i = 0; c_i < coords.length; c_i++) {
      s = Math.sin(-object.rot);
      c = Math.cos(-object.rot);

      xx = (coords[c_i][0] * c - coords[c_i][1] * s) * object.width + object.x;
      yy = (coords[c_i][0] * s + coords[c_i][1] * c) * object.height + object.y;

      alpha = getPixelAlpha(xx, yy, chunks, centerChunkPos);

      if (alpha === 255) {
        //onCollide.call(this, object, pixel_buffer);
        this.onPainterCollision(object, xx, yy);
      }
    }
  }

  private detectCircleToCircleCollision(obj1: DynamicObject, obj2: DynamicObject) {
    if (this.circleIntersectsCircle(obj1, obj2)) {
      this.onDynamicObjectsCollision(obj1, obj2);
    }
  }

  private circleIntersectsCircle(obj1: DynamicObject, obj2: DynamicObject) {
    const dstSquared = (obj2.x - obj1.x) ** 2 + (obj2.y - obj1.y) ** 2;
    const radiusSumSquared = (obj1.width + obj2.width) ** 2;

    return radiusSumSquared >= dstSquared;
  }

  protected bounceOutOfColor(object: DynamicObject, chunks: Chunk[][], centerChunkPos: Vec2) {
    bounceVec.set(0, 0);
    if (!getBounceVec(object, chunks, centerChunkPos, bounceVec)) {
      //no collision detected
      return null;
    }

    bounceVec.normalize();

    //to remove if (out_bounceVec != null) out_bounceVec.set(bounceVec.x, bounceVec.y);
    const outBounceVec = bounceVec.clone();

    //pushing object out of collision area
    safety = PUSH_STEPS;
    do {
      object.setPos(object.x + bounceVec.x * COLLISION_PUSH_FACTOR, object.y + bounceVec.y * COLLISION_PUSH_FACTOR);
    } while (getBounceVec(object, chunks, centerChunkPos) && --safety > 0);

    //no need to normalize
    currentVec.set(Math.cos(-object.rot + Math.PI / 2.0), Math.sin(-object.rot + Math.PI / 2.0));

    b_product = currentVec.dot(bounceVec);
    if (b_product > 0.0) return outBounceVec;

    bounceVec.x = currentVec.x - bounceVec.x * b_product * 2.0;
    bounceVec.y = currentVec.y - bounceVec.y * b_product * 2.0;

    object.rot = -Math.atan2(bounceVec.y, bounceVec.x) + Math.PI / 2.0;

    return outBounceVec;
  }

  protected bounceDynamicObjects(obj1: DynamicObject, obj2: DynamicObject) {
    currentVec.set(Math.cos(-obj1.rot + Math.PI / 2.0), Math.sin(-obj1.rot + Math.PI / 2.0)).normalize();
    bounceVec.set(obj1.x - obj2.x, obj1.y - obj2.y).normalize();

    safety = 16;
    do {
      obj1.setPos(obj1.x + bounceVec.x * COLLISION_PUSH_FACTOR, obj1.y + bounceVec.y * COLLISION_PUSH_FACTOR);
    } while (this.circleIntersectsCircle(obj1, obj2) && --safety > 0);

    dot = currentVec.dot(bounceVec);

    if (dot > 0.0) return true;

    bounceVec.x = currentVec.x - bounceVec.x * dot * 2.0;
    bounceVec.y = currentVec.y - bounceVec.y * dot * 2.0;

    obj1.rot = -Math.atan2(bounceVec.y, bounceVec.x) + Math.PI / 2.0;
    return false;
  }
}
