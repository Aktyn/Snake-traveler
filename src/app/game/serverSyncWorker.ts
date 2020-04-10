declare type Chunk = object;

interface ChunkToSave {
  chunk: Chunk;
  saveBackground?: boolean;
}

export function run(iterations: number, multiplier: number) {
  console.log('wut');
  /*while (true) {
    const primes = [];
    for (let i = 0; i < iterations; i++) {
      const candidate = (i * (multiplier * Math.random())) | 0;
      let isPrime = true;

      for (var c = 2; c <= Math.sqrt(candidate); ++c) {
        if (candidate % c === 0) {
          // not prime
          isPrime = false;
          break;
        }
      }
      if (isPrime) {
        primes.push(candidate);
      }
    }
    postMessage(primes);
  }*/
  return 5;
}

export function registerChunkToSave(chunkToSave: ChunkToSave) {
  console.log('registered chunk:', chunkToSave);
}
