'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * The single WebGL element in the NexaMind design system: animated graphite
 * shader (20x20 grid, 3 slow-pulsing cyan/teal node glows, noise flow tint).
 * GLSL is reproduced verbatim from the Stitch export.
 *
 * Constraints:
 * - mounts only where imported (Evaluation run header)
 * - pauses the rAF loop under prefers-reduced-motion (renders one frame)
 * - static gradient fallback on mobile viewports (<768px) and when WebGL
 *   is unavailable
 */

const VERT = `attribute vec2 a_position;
varying vec2 v_texCoord;
void main() {
  v_texCoord = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;
uniform float u_time;
uniform vec2 u_resolution;
varying vec2 v_texCoord;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.71, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 uv = v_texCoord;
    vec2 centered_uv = (uv - 0.5) * (u_resolution.x / u_resolution.y);

    // Background color (Slate/Graphite)
    vec3 color = vec3(0.07, 0.08, 0.09);

    // Grid lines
    vec2 grid_uv = fract(uv * 20.0);
    float grid = smoothstep(0.02, 0.0, grid_uv.x) + smoothstep(0.02, 0.0, grid_uv.y);
    color += grid * 0.03;

    // Node-like pulse effects
    for(float i=0.0; i<3.0; i++) {
        vec2 pos = vec2(sin(u_time * 0.5 + i), cos(u_time * 0.3 + i)) * 0.3;
        float dist = length(centered_uv - pos);
        float pulse = smoothstep(0.1, 0.0, dist) * (0.5 + 0.5 * sin(u_time * 2.0));
        color += vec3(0.05, 0.4, 0.6) * pulse * 0.2;
    }

    // Subtle flow lines
    float n = noise(uv * 5.0 + u_time * 0.1);
    color += vec3(0.05, 0.4, 0.6) * n * 0.05;

    gl_FragColor = vec4(color, 1.0);
}`;

function drawFrame(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  canvas: HTMLCanvasElement,
  time: number,
) {
  const w = canvas.clientWidth || 1280;
  const h = canvas.clientHeight || 720;
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.useProgram(program);
  const uTime = gl.getUniformLocation(program, 'u_time');
  const uRes = gl.getUniformLocation(program, 'u_resolution');
  gl.uniform1f(uTime, time);
  gl.uniform2f(uRes, canvas.width, canvas.height);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

export default function ShaderBackground({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    if (mobile || typeof document === 'undefined') {
      setFallback(true);
      return;
    }

    const reduced =
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let gl: WebGLRenderingContext | null = null;
    try {
      gl = (canvasRef.current?.getContext('webgl') ||
        canvasRef.current?.getContext('experimental-webgl')) as
        | WebGLRenderingContext
        | null;
    } catch {
      gl = null;
    }
    if (!gl || !canvasRef.current) {
      setFallback(true);
      return;
    }

    const compile = (type: number, src: string) => {
      const s = gl!.createShader(type)!;
      gl!.shaderSource(s, src);
      gl!.compileShader(s);
      return s;
    };

    const prog = gl.createProgram();
    if (!prog) {
      setFallback(true);
      return;
    }
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const pos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    let raf = 0;
    const start = performance.now();

    if (reduced) {
      // Render one static frame; do not animate.
      drawFrame(gl, prog, canvasRef.current, 0.0);
      const ro = new ResizeObserver(() => {
        if (canvasRef.current)
          drawFrame(gl!, prog, canvasRef.current, 0.0);
      });
      ro.observe(canvasRef.current);
      return () => {
        ro.disconnect();
        gl?.getExtension('WEBGL_lose_context')?.loseContext();
      };
    }

    const loop = (now: number) => {
      if (!canvasRef.current) return;
      drawFrame(gl!, prog, canvasRef.current, (now - start) / 1000);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    };
  }, []);

  if (fallback) {
    // Static gradient fallback — same graphite base with faint node tints.
    return (
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 opacity-30 mix-blend-screen ${className}`}
        style={{
          background:
            'radial-gradient(circle at 25% 60%, rgba(14,165,233,0.35), transparent 40%),' +
            'radial-gradient(circle at 75% 30%, rgba(78,222,163,0.22), transparent 45%),' +
            '#12141a',
        }}
      />
    );
  }

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 opacity-30 mix-blend-screen ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
