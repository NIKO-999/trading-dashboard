/* ============================================================
   Vigil — proportion & silhouette blockout.

   THIS IS NOT THE MODEL. There is no 3D authoring tool in this environment
   (no Blender, no sculpting, no texture painting), so the hero-asset Vigil
   described in docs/crew3d/vigil-spec.md cannot be produced here. What this
   file gives you instead: the spec's actual numbers — height, proportion,
   structure, prop layout — built from plain geometric primitives, so mass
   distribution and silhouette can be judged before a modeller or a
   text-to-3D pass touches it. No filigree, no cloth sim, no PBR, no real
   idle clip: those all need real authoring.

   It doubles as the spec's own acceptance gate (§2): "rendered as a flat
   black shape at 80px, Vigil must be unmistakable." The small panel on the
   right renders exactly that test, permanently, rather than as a one-off
   screenshot someone has to remember to take.

   Deliberately independent of moonshot/crew3d/ — that module is the real
   runtime (loader.ts loading authored .glb, useIdle.ts driving an authored
   clip, particles/ as GPU-simulated systems). Wiring this blockout into that
   pipeline would just give a false sense that the pipeline was validated
   against real content. The one thing borrowed from it is BASE_TIER, to
   prove the tier extension point actually reaches something visual even
   before real assets exist.
   ============================================================ */

import { useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { BASE_TIER } from '../moonshot/crew3d/types';

/* ---------- spec numbers (docs/crew3d/vigil-spec.md §2-§3) ---------- */

const HEIGHT_M = 2.4; // §2 total height
const HALO_COLOR = '#ffc53d'; // §6 halo emissive
const RELIQUARY_COLOR = '#ffb020'; // §6 reliquary emissive
const GOLD = '#8a6a2c'; // unlit grey-box stand-in for "polished gold" (§5) — a
// flat colour reads as a placeholder on purpose; the real material is a
// basecolor/normal/roughness/metallic/AO set no primitive can fake honestly.
const STEEL = '#232326';
const CLOTH = '#141419';

/** index-based hash noise — deterministic scatter with no Math.random(),
 *  so the blockout looks identical on every reload and every screenshot. */
function hash(i: number, salt = 0): number {
  const s = Math.sin(i * 127.1 + salt * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

const REDUCED_MOTION =
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- the figure ---------- */

function VigilFigure({ silhouette, animate }: { silhouette: boolean; animate: boolean }) {
  const root = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.PointLight>(null);
  const ashGeo = useRef<THREE.BufferGeometry>(null);

  const mats = useMemo(() => {
    if (silhouette) {
      // The gate is about shape, not light — glow goes flat black too.
      const black = new THREE.MeshBasicMaterial({ color: '#050505' });
      return { gold: black, steel: black, cloth: black, halo: black, reliquary: black };
    }
    return {
      gold: new THREE.MeshStandardMaterial({ color: GOLD, metalness: 1, roughness: 0.3 }),
      steel: new THREE.MeshStandardMaterial({ color: STEEL, metalness: 1, roughness: 0.55 }),
      cloth: new THREE.MeshStandardMaterial({ color: CLOTH, metalness: 0, roughness: 0.95 }),
      halo: new THREE.MeshStandardMaterial({
        color: HALO_COLOR,
        emissive: HALO_COLOR,
        emissiveIntensity: 2 * BASE_TIER.emissiveIntensity,
      }),
      reliquary: new THREE.MeshStandardMaterial({
        color: RELIQUARY_COLOR,
        emissive: RELIQUARY_COLOR,
        emissiveIntensity: 1.4 * BASE_TIER.emissiveIntensity,
      }),
    };
  }, [silhouette]);

  // 9 halo spines, longest vertical (§3) — angle spread narrows the further
  // a spine sits from centre, echoing the reference's radiating fan.
  const spines = useMemo(
    () =>
      Array.from({ length: 9 }, (_, i) => {
        const t = (i - 4) / 4; // -1..1
        const angle = t * 1.05;
        const length = 0.34 - Math.abs(t) * 0.16;
        return { angle, length, key: i };
      }),
    [],
  );

  // 11 tapering, irregular cloak tongues (§3) — lengths fixed by index-hash,
  // not authored, so this is intentionally not a final silhouette read.
  const tongues = useMemo(
    () =>
      Array.from({ length: 11 }, (_, i) => {
        const a = (i / 11) * Math.PI * 2;
        const len = 0.55 + hash(i) * 0.35;
        return { angle: a, len, key: i };
      }),
    [],
  );

  // Idle bob: a ~2cm breath, per spec §7's warning that the real idle must
  // stay almost imperceptible — this placeholder is deliberately tiny too,
  // not a stand-in for the authored clip useIdle.ts will eventually drive.
  useFrame((state) => {
    if (!animate || REDUCED_MOTION) return;
    const t = state.clock.elapsedTime;
    if (root.current) root.current.position.y = Math.sin(t * (Math.PI / 2)) * 0.01;
    if (haloRef.current) {
      haloRef.current.intensity = (2.2 + Math.sin(t * 0.6) * 0.3) * BASE_TIER.emissiveIntensity;
    }
    const geo = ashGeo.current;
    if (geo) {
      const pos = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        let y = pos.getY(i) - 0.0025;
        if (y < 0.1) y = HEIGHT_M * 0.95;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  });

  const ashPositions = useMemo(() => {
    const count = 70; // placeholder count — the real 'ash-drift' preset is
    // GPU-simulated and budgeted separately in particles/presets.ts
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (hash(i) - 0.5) * 1.1;
      arr[i * 3 + 1] = hash(i, 1) * HEIGHT_M;
      arr[i * 3 + 2] = (hash(i, 2) - 0.5) * 1.1;
    }
    return arr;
  }, []);

  return (
    <group ref={root}>
      {/* ---------- ground fog — flat, static stand-in for the real
          GPU-simulated 'ground-fog' preset ---------- */}
      {!silhouette && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.3, 32]} />
          <meshBasicMaterial color="#2a2e38" transparent opacity={0.22} depthWrite={false} />
        </mesh>
      )}

      {/* ---------- legs — thin rods, no feet modelled (§3) ---------- */}
      {[-0.09, 0.09].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.55, 0]}>
            <cylinderGeometry args={[0.025, 0.02, 0.9, 8]} />
            <primitive object={mats.steel} attach="material" />
          </mesh>
          <mesh position={[x, 0.18, 0]}>
            <sphereGeometry args={[0.03, 8, 8]} />
            <primitive object={mats.steel} attach="material" />
          </mesh>
        </group>
      ))}

      {/* ---------- cloak — dominant silhouette shape. A wedge is left open
          facing forward (§3: "you see through the body") — a full 360° cone
          would hide the whole point of the open torso behind cloth. Double-
          sided so the cut edge and the cloak's own interior read correctly
          from the front. ---------- */}
      <mesh position={[0, 1.05, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <coneGeometry args={[0.72, 1.55, 20, 1, true, 0.5, Math.PI * 2 - 1.0]} />
        <primitive object={mats.cloth} attach="material" side={THREE.DoubleSide} />
      </mesh>
      {tongues.map((tg) => (
        <mesh
          key={tg.key}
          position={[Math.sin(tg.angle) * 0.68, 0.28 - tg.len / 2, Math.cos(tg.angle) * 0.68]}
          rotation={[0, -tg.angle, Math.PI]}
        >
          <coneGeometry args={[0.09, tg.len, 3]} />
          <primitive object={mats.cloth} attach="material" side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ---------- open torso — spine, ribs, reliquary (§3) ---------- */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={i} position={[0, 1.15 + i * 0.09, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.045, 0.016, 8, 12]} />
          <primitive object={mats.gold} attach="material" />
        </mesh>
      ))}
      {[-1, 1].map((side) =>
        Array.from({ length: 4 }, (_, i) => (
          <mesh
            key={`${side}-${i}`}
            position={[0, 1.22 + i * 0.13, 0]}
            rotation={[0, side > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
          >
            <torusGeometry args={[0.11, 0.012, 6, 12, Math.PI * 0.85]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
        )),
      )}
      <mesh position={[0, 1.5, 0.05]}>
        <boxGeometry args={[0.14, 0.17, 0.06]} />
        <primitive object={mats.reliquary} attach="material" />
      </mesh>

      {/* ---------- arms — hanging open, empty (§3) ---------- */}
      {[-1, 1].map((side) => (
        <group key={side} position={[side * 0.21, 1.68, 0]} rotation={[0, 0, -side * 0.26]}>
          <mesh position={[0, -0.16, 0]}>
            <cylinderGeometry args={[0.028, 0.024, 0.32, 8]} />
            <primitive object={mats.gold} attach="material" />
          </mesh>
          <mesh position={[0, -0.32, 0]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <primitive object={mats.steel} attach="material" />
          </mesh>
          <group position={[0, -0.32, 0]} rotation={[0, 0, side * 0.12]}>
            <mesh position={[0, -0.14, 0]}>
              <cylinderGeometry args={[0.024, 0.02, 0.28, 8]} />
              <primitive object={mats.gold} attach="material" />
            </mesh>
            {/* claw hand — 4 thin splayed fingers, open and empty */}
            <group position={[0, -0.28, 0]}>
              {[-0.28, -0.09, 0.09, 0.28].map((fx) => (
                <mesh key={fx} position={[fx * 0.5, -0.06, 0]} rotation={[0, 0, fx * 0.6]}>
                  <coneGeometry args={[0.012, 0.11, 4]} />
                  <primitive object={mats.gold} attach="material" />
                </mesh>
              ))}
            </group>
          </group>
        </group>
      ))}

      {/* ---------- cowl — static, heavy, rolled (§3, §7) ---------- */}
      <mesh position={[0, 1.87, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.17, 0.075, 10, 24]} />
        <primitive object={mats.cloth} attach="material" />
      </mesh>

      {/* ---------- helm — featureless, tilted back 8° (§3) ---------- */}
      <mesh position={[0, 2.07, 0.015]} rotation={[-0.14, 0, 0]} scale={[1, 1.15, 1]}>
        <sphereGeometry args={[0.12, 16, 16]} />
        <primitive object={mats.gold} attach="material" />
      </mesh>

      {/* ---------- halo — the one raw-emissive exception (§6) ---------- */}
      <group position={[0, 2.14, -0.06]}>
        <pointLight
          ref={haloRef}
          color={HALO_COLOR}
          intensity={2.2 * BASE_TIER.emissiveIntensity}
          distance={3.2}
        />
        {spines.map((s) => (
          <mesh
            key={s.key}
            position={[Math.sin(s.angle) * s.length * 0.5, Math.cos(s.angle) * s.length * 0.5, 0]}
            rotation={[0, 0, -s.angle]}
          >
            <cylinderGeometry args={[0.006, 0.001, s.length, 6]} />
            <primitive object={mats.halo} attach="material" />
          </mesh>
        ))}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.007, 0.007, 0.62, 8]} />
          <primitive object={mats.halo} attach="material" />
        </mesh>
      </group>

      {/* ---------- ash drift — placeholder for the real 'ash-drift' GPU
          preset; CPU-updated points, fine at this count for a dev viewer
          only, not the budgeted runtime path ---------- */}
      {!silhouette && (
        <points>
          <bufferGeometry ref={ashGeo}>
            <bufferAttribute attach="attributes-position" args={[ashPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#dfe3ea" size={0.012} transparent opacity={0.55} />
        </points>
      )}
    </group>
  );
}

/* ---------- the always-on 80px silhouette gate, spec §2 ---------- */

function SilhouetteGate() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 80,
          background: '#d9dbe0',
          borderRadius: 4,
          overflow: 'hidden',
        }}
      >
        <Canvas camera={{ position: [0, 1.2, 5.2], fov: 32 }} dpr={1}>
          <VigilFigure silhouette animate={false} />
        </Canvas>
      </div>
      <div style={{ fontFamily: 'monospace', fontSize: 10, color: '#9aa0ac', textAlign: 'center' }}>
        80px gate — spec §2
        <br />
        must read unmistakably
      </div>
    </div>
  );
}

/* ---------- page ---------- */

export function VigilBlockout() {
  const [silhouette, setSilhouette] = useState(false);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0a0a0c', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 16,
          left: 16,
          zIndex: 10,
          fontFamily: 'monospace',
          color: '#d8dae0',
          maxWidth: 420,
          lineHeight: 1.5,
        }}
      >
        <div style={{ fontSize: 15, fontWeight: 700 }}>VIGIL — proportion &amp; silhouette blockout</div>
        <div style={{ fontSize: 11, color: '#9aa0ac', marginTop: 4 }}>
          Grey-box only — not final art. No filigree, no cloth sim, no PBR, no authored idle. Real
          materials and geometry detail need an actual 3D authoring pipeline this environment doesn't
          have. Spec: docs/crew3d/vigil-spec.md
          <br />
          Grid: 0.1m minor · 0.5m major — figure is 2.4m tall (spec §2).
        </div>
        <button
          onClick={() => setSilhouette((s) => !s)}
          style={{
            marginTop: 10,
            fontFamily: 'monospace',
            fontSize: 12,
            padding: '6px 12px',
            background: silhouette ? '#3a3f4c' : '#1b1c20',
            color: '#e4e6ea',
            border: '1px solid #3a3f4c',
            borderRadius: 6,
            cursor: 'pointer',
          }}
        >
          {silhouette ? 'Showing: silhouette' : 'Showing: shaded'} — click to toggle
        </button>
      </div>

      <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
        <SilhouetteGate />
      </div>

      <Canvas camera={{ position: [0, 1.5, 5.6], fov: 38 }}>
        {/* Neutral mid-grey in both modes — a scale reference needs contrast
            against the figure regardless of shaded/silhouette, and grey
            reads dimensions without tinting materials the way black or a
            saturated colour would. */}
        <color attach="background" args={[silhouette ? '#d9dbe0' : '#7d818a']} />
        {!silhouette && (
          <>
            <ambientLight intensity={0.55} />
            <directionalLight position={[2, 3, 2]} intensity={0.7} />
            {/* Two-tier grid for reading dimensions off the figure: fine
                lines every 0.1m, a stronger line every 0.5m. Vigil is 2.4m
                tall (spec §2) — count major lines against the halo or hem
                to check a proportion by eye. */}
            <gridHelper args={[4, 40, '#5c6068', '#6b6f78']} position={[0, 0.0015, 0]} />
            <gridHelper args={[4, 8, '#40434a', '#40434a']} position={[0, 0.002, 0]} />
          </>
        )}
        <VigilFigure silhouette={silhouette} animate />
        <OrbitControls target={[0, 1.15, 0]} minDistance={1.8} maxDistance={9} />
      </Canvas>
    </div>
  );
}
