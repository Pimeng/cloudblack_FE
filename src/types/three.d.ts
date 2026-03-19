declare module 'three' {
  export class WebGLRenderer {
    constructor(options?: { 
      antialias?: boolean; 
      alpha?: boolean;
      powerPreference?: string;
    });
    setSize(width: number, height: number): void;
    setPixelRatio(ratio: number): void;
    render(scene: Scene, camera: Camera): void;
    dispose(): void;
    domElement: HTMLCanvasElement;
  }

  export class Scene {
    add(object: Object3D): void;
    remove(object: Object3D): void;
  }

  export class OrthographicCamera extends Camera {
    constructor(left: number, right: number, top: number, bottom: number, near: number, far: number);
    position: Vector3;
  }

  export class Camera extends Object3D {}

  export class Object3D {
    position: Vector3;
  }

  export class Vector3 {
    x: number;
    y: number;
    z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z?: number): void;
  }

  export class Vector2 {
    x: number;
    y: number;
    constructor(x?: number, y?: number);
    set(x: number, y: number): void;
  }

  export class Mesh extends Object3D {
    constructor(geometry: BufferGeometry, material: Material);
  }

  export class BufferGeometry {
    setAttribute(name: string, attribute: BufferAttribute): void;
    dispose(): void;
  }

  export class BufferAttribute {
    constructor(array: Float32Array, itemSize: number);
  }

  export class PlaneGeometry extends BufferGeometry {
    constructor(width: number, height: number);
    dispose(): void;
  }

  export class Material {
    dispose(): void;
  }

  export class ShaderMaterial extends Material {
    constructor(options: {
      vertexShader: string;
      fragmentShader: string;
      uniforms?: Record<string, { value: any }>;
      transparent?: boolean;
    });
    uniforms: Record<string, { value: any }>;
    dispose(): void;
  }
}
