import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';

export function FluidBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.OrthographicCamera | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const rafRef = useRef<number>(0);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const [webglSupported, setWebglSupported] = useState(true);
  const [isLight, setIsLight] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLight(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uIsLight.value = isLight ? 1.0 : 0.0;
    }
  }, [isLight]);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) {
        setWebglSupported(false);
        return;
      }
    } catch {
      setWebglSupported(false);
      return;
    }

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    cameraRef.current = camera;

    // Renderer setup
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ 
        alpha: true, 
        antialias: true,
        powerPreference: 'high-performance'
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;
    } catch {
      setWebglSupported(false);
      return;
    }

    // Shader material
    const vertexShader = `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uIsLight;
      varying vec2 vUv;

      // Simplex noise function
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                           -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy));
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0))
                        + i.x + vec3(0.0, i1.x, 1.0));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy),
                               dot(x12.zw,x12.zw)), 0.0);
        m = m*m;
        m = m*m;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      void main() {
        vec2 uv = vUv;
        vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
        
        // Create flowing noise
        float time = uTime * 0.15;
        
        // Multiple layers of noise for fluid effect
        float noise1 = snoise(uv * 2.0 * aspect + time * 0.5);
        float noise2 = snoise(uv * 4.0 * aspect - time * 0.3 + 100.0);
        float noise3 = snoise(uv * 1.5 * aspect + time * 0.2 + 200.0);
        
        float combinedNoise = noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2;
        
        // Mouse influence
        vec2 mouseInfluence = (uMouse - 0.5) * 0.1;
        float mouseDist = length(uv - uMouse);
        float mouseEffect = smoothstep(0.5, 0.0, mouseDist) * 0.15;
        
        combinedNoise += mouseEffect;
        
        // Dark mode colors
        vec3 dark1 = vec3(0.06, 0.09, 0.16);
        vec3 dark2 = vec3(0.1, 0.15, 0.25);
        vec3 dark3 = vec3(0.15, 0.25, 0.45);
        vec3 dark4 = vec3(0.2, 0.35, 0.6);

        // Light mode colors
        vec3 light1 = vec3(0.94, 0.96, 1.0);
        vec3 light2 = vec3(0.88, 0.92, 0.98);
        vec3 light3 = vec3(0.80, 0.87, 0.97);
        vec3 light4 = vec3(0.70, 0.80, 0.95);

        vec3 color1 = mix(dark1, light1, uIsLight);
        vec3 color2 = mix(dark2, light2, uIsLight);
        vec3 color3 = mix(dark3, light3, uIsLight);
        vec3 color4 = mix(dark4, light4, uIsLight);
        
        // Mix colors based on noise
        vec3 finalColor = mix(color1, color2, smoothstep(-0.5, 0.5, combinedNoise));
        finalColor = mix(finalColor, color3, smoothstep(0.0, 0.5, combinedNoise));
        finalColor = mix(finalColor, color4, smoothstep(0.3, 0.8, combinedNoise) * 0.3);
        
        // Add subtle vignette
        float vignette = 1.0 - smoothstep(0.3, 1.2, length(uv - 0.5));
        finalColor *= 0.85 + vignette * 0.15;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new THREE.Vector2(width, height) },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uIsLight: { value: isLight ? 1.0 : 0.0 },
      }
    });
    materialRef.current = material;

    // Create full-screen plane
    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Animation loop
    let lastTime = 0;
    const animate = (time: number) => {
      // Limit to ~30fps for performance
      if (time - lastTime < 33) {
        rafRef.current = requestAnimationFrame(animate);
        return;
      }
      lastTime = time;

      if (materialRef.current) {
        materialRef.current.uniforms.uTime.value = time * 0.001;
      }
      
      renderer.render(scene, camera);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    // Handle resize
    const handleResize = () => {
      const newWidth = window.innerWidth;
      const newHeight = window.innerHeight;
      renderer.setSize(newWidth, newHeight);
      if (materialRef.current) {
        materialRef.current.uniforms.uResolution.value.set(newWidth, newHeight);
      }
    };

    // Handle mouse move
    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = 1.0 - e.clientY / window.innerHeight;
      if (materialRef.current) {
        materialRef.current.uniforms.uMouse.value.set(
          mouseRef.current.x,
          mouseRef.current.y
        );
      }
    };

    window.addEventListener('resize', handleResize, { passive: true });
    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (rendererRef.current) {
        rendererRef.current.dispose();
        if (container.contains(rendererRef.current.domElement)) {
          container.removeChild(rendererRef.current.domElement);
        }
      }
      geometry.dispose();
      material.dispose();
    };
  }, []);

  // Fallback gradient when WebGL is not supported
  const fallbackGradient = isLight ? {
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(100, 150, 246, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(80, 120, 235, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #e8f0fe 0%, #dbeafe 50%, #e8f0fe 100%)
    `,
  } : {
    background: `
      radial-gradient(ellipse at 30% 20%, rgba(56, 130, 246, 0.15) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(37, 99, 235, 0.1) 0%, transparent 50%),
      linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)
    `,
  };

  return (
    <div 
      ref={containerRef} 
      className="fixed inset-0 -z-10"
      style={webglSupported ? { background: isLight ? 'linear-gradient(135deg, #e8f0fe 0%, #dbeafe 100%)' : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)' } : fallbackGradient}
    />
  );
}
