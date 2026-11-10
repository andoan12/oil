import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const OIL_PATCH_COUNT = 18;
const OIL_DROPLET_COUNT = 85;
const BACTERIA_COUNT = 220;
const BUBBLE_COUNT = 160;

export default function OceanScene({
  phase, // 'polluted' | 'remediating' | 'clean'
  cleanupProgress, // 0 to 100
  simSpeed, // 0.5 | 1 | 2
  isPaused,
  cameraMode, // 'overview' | 'closeup' | 'underwater'
}) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    phase,
    cleanupProgress,
    simSpeed,
    isPaused,
    cameraMode,
  });

  useEffect(() => {
    stateRef.current = {
      phase,
      cleanupProgress,
      simSpeed,
      isPaused,
      cameraMode,
    };
  }, [phase, cleanupProgress, simSpeed, isPaused, cameraMode]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Camera, Renderer
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x061224, 0.015);

    const camera = new THREE.PerspectiveCamera(
      50,
      container.clientWidth / container.clientHeight,
      0.1,
      300
    );
    camera.position.set(0, 18, 32);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // 2. Lights
    const ambientLight = new THREE.AmbientLight(0x94a3b8, 1.3);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 2.6);
    sunLight.position.set(25, 45, 20);
    scene.add(sunLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-25, 15, -20);
    scene.add(rimLight);

    const bioLight = new THREE.PointLight(0x10b981, 0, 35);
    bioLight.position.set(0, 3, 0);
    scene.add(bioLight);

    // 3. Ocean Water Plane (Animated Vertex Waves)
    const waterGeo = new THREE.PlaneGeometry(110, 110, 128, 128);
    waterGeo.rotateX(-Math.PI / 2);

    // Store original coordinates for wave math
    const posAttr = waterGeo.attributes.position;
    const basePositions = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count * 3; i++) {
      basePositions[i] = posAttr.array[i];
    }

    const waterMat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0a233d),
      emissive: new THREE.Color(0x031022),
      roughness: 0.18,
      metalness: 0.1,
      transmission: 0.35,
      transparent: true,
      opacity: 0.94,
      reflectivity: 0.9,
      clearcoat: 0.8,
      clearcoatRoughness: 0.15,
      flatShading: false,
    });

    const waterMesh = new THREE.Mesh(waterGeo, waterMat);
    scene.add(waterMesh);

    // Deep ocean floor glow grid for depth perception
    const seabedGeo = new THREE.PlaneGeometry(140, 140, 24, 24);
    seabedGeo.rotateX(-Math.PI / 2);
    const seabedMat = new THREE.MeshBasicMaterial({
      color: 0x0369a1,
      wireframe: true,
      transparent: true,
      opacity: 0.12,
    });
    const seabedMesh = new THREE.Mesh(seabedGeo, seabedMat);
    seabedMesh.position.y = -7;
    scene.add(seabedMesh);

    // Wave height helper function so oil & bacteria ride the waves accurately
    const getWaveHeight = (x, z, t) => {
      return (
        Math.sin(x * 0.18 + t * 1.4) * 0.42 +
        Math.cos(z * 0.15 + t * 1.1) * 0.38 +
        Math.sin((x + z) * 0.25 - t * 1.8) * 0.2
      );
    };

    // 4. Dark Oil Spill Surface Patches
    const oilPatchGroup = new THREE.Group();
    scene.add(oilPatchGroup);

    const oilPatchMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      emissive: 0x181024,
      emissiveIntensity: 0.35,
      roughness: 0.08,
      metalness: 0.75,
      transparent: true,
      opacity: 0.96,
      depthWrite: false,
    });

    const oilPatches = [];
    for (let i = 0; i < OIL_PATCH_COUNT; i++) {
      const radius = 2.2 + Math.random() * 3.8;
      const patchGeo = new THREE.CircleGeometry(radius, 32);
      patchGeo.rotateX(-Math.PI / 2);

      // Distort vertices into organic spill shape
      const pAttr = patchGeo.attributes.position;
      for (let v = 1; v < pAttr.count; v++) {
        const vx = pAttr.getX(v);
        const vz = pAttr.getZ(v);
        const angle = Math.atan2(vz, vx);
        const factor =
          0.75 +
          0.25 * Math.sin(angle * 3 + i) +
          0.15 * Math.cos(angle * 5 - i * 2);
        pAttr.setX(v, vx * factor);
        pAttr.setZ(v, vz * factor);
      }
      patchGeo.computeVertexNormals();

      const mesh = new THREE.Mesh(patchGeo, oilPatchMat.clone());
      const dist = Math.pow(Math.random(), 0.7) * 16;
      const theta = (i / OIL_PATCH_COUNT) * Math.PI * 2 + Math.random() * 0.5;
      const x = Math.cos(theta) * dist;
      const z = Math.sin(theta) * dist;

      mesh.position.set(x, 0.12, z);
      oilPatchGroup.add(mesh);
      oilPatches.push({
        mesh,
        baseX: x,
        baseZ: z,
        baseScale: 0.85 + Math.random() * 0.5,
        rotSpeed: (Math.random() - 0.5) * 0.15,
        dissolveOffset: Math.random() * 0.25, // staggered cleanup
      });
    }

    // 5. 3D Hydrocarbon Oil Droplets (Targets for bacteria attachment)
    const dropletGroup = new THREE.Group();
    scene.add(dropletGroup);

    const dropletGeo = new THREE.IcosahedronGeometry(0.45, 2);
    const dropletMat = new THREE.MeshPhysicalMaterial({
      color: 0x090a0f,
      emissive: 0x1e1b4b,
      emissiveIntensity: 0.25,
      roughness: 0.1,
      metalness: 0.65,
      clearcoat: 1.0,
      transparent: true,
      opacity: 0.98,
    });

    const droplets = [];
    for (let i = 0; i < OIL_DROPLET_COUNT; i++) {
      const mesh = new THREE.Mesh(dropletGeo, dropletMat.clone());
      const radius = Math.pow(Math.random(), 0.65) * 17;
      const angle = Math.random() * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const depthOffset = (Math.random() - 0.65) * 1.4; // Near surface and slightly submerged
      const baseScale = 0.55 + Math.random() * 0.95;

      mesh.position.set(x, depthOffset, z);
      mesh.scale.setScalar(baseScale);
      dropletGroup.add(mesh);

      droplets.push({
        mesh,
        baseX: x,
        baseZ: z,
        depthOffset,
        baseScale,
        phaseOffset: Math.random() * Math.PI * 2,
        threshold: 0.1 + Math.random() * 0.9,
      });
    }

    // 6. Alcanivorax Bacteria Swarm (Rod-shaped bioluminescent green capsules)
    const bacteriaGroup = new THREE.Group();
    scene.add(bacteriaGroup);

    const bacteriaGeo = new THREE.CapsuleGeometry(0.11, 0.34, 8, 12);
    bacteriaGeo.rotateZ(Math.PI / 2);

    const bacteriaMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x34d399,
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
      transparent: true,
      opacity: 0,
    });

    const bacteriaList = [];
    for (let i = 0; i < BACTERIA_COUNT; i++) {
      const mesh = new THREE.Mesh(bacteriaGeo, bacteriaMat);
      // Assign each bacterium a target oil droplet
      const targetDroplet = droplets[i % droplets.length];

      // Starting position high/wide before release
      const spawnAngle = Math.random() * Math.PI * 2;
      const spawnRadius = 4 + Math.random() * 20;
      const startX = Math.cos(spawnAngle) * spawnRadius;
      const startZ = Math.sin(spawnAngle) * spawnRadius;
      const startY = 6 + Math.random() * 8;

      mesh.position.set(startX, startY, startZ);
      mesh.visible = false;
      bacteriaGroup.add(mesh);

      bacteriaList.push({
        mesh,
        targetDroplet,
        startX,
        startY,
        startZ,
        orbitAngle: Math.random() * Math.PI * 2,
        orbitSpeed: 1.8 + Math.random() * 2.5,
        orbitRadius: 0.32 + Math.random() * 0.45,
        orbitTilt: (Math.random() - 0.5) * 1.5,
        arrivalProgress: 0,
        delay: Math.random() * 0.35,
      });
    }

    // 7. CO2 & H2O Conversion Bubbles (Rising sky-blue & white spheres)
    const bubbleGroup = new THREE.Group();
    scene.add(bubbleGroup);

    const co2Geo = new THREE.SphereGeometry(0.13, 12, 12);
    const co2Mat = new THREE.MeshPhysicalMaterial({
      color: 0xe0f2fe,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.9,
      roughness: 0.05,
      transmission: 0.7,
      transparent: true,
      opacity: 0.85,
    });

    const h2oMat = new THREE.MeshPhysicalMaterial({
      color: 0x22d3ee,
      emissive: 0x06b6d4,
      emissiveIntensity: 1.1,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85,
    });

    const bubbles = [];
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      const isCO2 = i % 2 === 0;
      const mesh = new THREE.Mesh(co2Geo, isCO2 ? co2Mat : h2oMat);
      const hostDroplet = droplets[i % droplets.length];
      mesh.visible = false;
      bubbleGroup.add(mesh);

      bubbles.push({
        mesh,
        isCO2,
        hostDroplet,
        life: Math.random(),
        speed: 0.45 + Math.random() * 0.65,
        wobbleFreq: 2 + Math.random() * 3,
        wobbleAmp: 0.15 + Math.random() * 0.25,
        spreadX: (Math.random() - 0.5) * 1.8,
        spreadZ: (Math.random() - 0.5) * 1.8,
      });
    }

    // 8. Interactive Mouse/Touch Orbit Controls
    let isDragging = false;
    let prevX = 0;
    let prevY = 0;
    let sphericalTheta = 0.0;
    let sphericalPhi = 1.05; // angle from top
    let cameraDist = 33;
    const targetLookAt = new THREE.Vector3(0, 0, 0);

    const onPointerDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      prevY = e.clientY;
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      prevX = e.clientX;
      prevY = e.clientY;

      sphericalTheta -= dx * 0.007;
      sphericalPhi = Math.max(0.28, Math.min(1.48, sphericalPhi - dy * 0.006));
    };

    const onPointerUp = () => {
      isDragging = false;
    };

    const onWheel = (e) => {
      e.preventDefault();
      cameraDist = Math.max(10, Math.min(52, cameraDist + e.deltaY * 0.02));
    };

    const domElem = renderer.domElement;
    domElem.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElem.addEventListener('wheel', onWheel, { passive: false });

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Colors for smooth interpolation
    const pollutedWaterColor = new THREE.Color(0x0c1e33);
    const cleanWaterColor = new THREE.Color(0x0284c7);
    const pollutedEmissive = new THREE.Color(0x040b16);
    const cleanEmissive = new THREE.Color(0x0369a1);
    const pollutedFog = new THREE.Color(0x061224);
    const cleanFog = new THREE.Color(0x082f49);

    let elapsed = 0;
    let lastTime = performance.now();
    let animFrameId;

    const animate = (now) => {
      animFrameId = requestAnimationFrame(animate);

      const rawDt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const {
        phase: curPhase,
        cleanupProgress: curProgress,
        simSpeed: curSpeed,
        isPaused: curPaused,
        cameraMode: curCamMode,
      } = stateRef.current;

      const dt = curPaused ? 0 : rawDt * curSpeed;
      elapsed += dt;

      const progressRatio = Math.max(0, Math.min(1, curProgress / 100));
      const oilRemaining = 1 - progressRatio;

      // Camera preset interpolation when not dragging
      if (!isDragging) {
        sphericalTheta += dt * 0.08;
        let desiredPhi = 1.04;
        let desiredDist = 33;
        let desiredTargetY = 0;

        if (curCamMode === 'closeup') {
          desiredPhi = 1.18;
          desiredDist = 14.5;
          desiredTargetY = 0.2;
        } else if (curCamMode === 'topdown') {
          desiredPhi = 0.35;
          desiredDist = 36;
          desiredTargetY = 0;
        }

        sphericalPhi += (desiredPhi - sphericalPhi) * 0.05;
        cameraDist += (desiredDist - cameraDist) * 0.05;
        targetLookAt.y += (desiredTargetY - targetLookAt.y) * 0.05;
      }

      camera.position.x =
        cameraDist * Math.sin(sphericalPhi) * Math.sin(sphericalTheta);
      camera.position.y = cameraDist * Math.cos(sphericalPhi);
      camera.position.z =
        cameraDist * Math.sin(sphericalPhi) * Math.cos(sphericalTheta);
      camera.lookAt(targetLookAt);

      // Update Water Vertices & Color
      const positions = waterGeo.attributes.position.array;
      for (let i = 0; i < posAttr.count; i++) {
        const ix = i * 3;
        const x = basePositions[ix];
        const z = basePositions[ix + 2];
        positions[ix + 1] = getWaveHeight(x, z, elapsed);
      }
      waterGeo.attributes.position.needsUpdate = true;
      waterGeo.computeVertexNormals();

      waterMat.color.lerpColors(pollutedWaterColor, cleanWaterColor, progressRatio);
      waterMat.emissive.lerpColors(
        pollutedEmissive,
        cleanEmissive,
        progressRatio
      );
      scene.fog.color.lerpColors(pollutedFog, cleanFog, progressRatio);

      // Update Oil Surface Patches
      for (let i = 0; i < oilPatches.length; i++) {
        const patch = oilPatches[i];
        const waveY = getWaveHeight(patch.baseX, patch.baseZ, elapsed);
        patch.mesh.position.y = waveY + 0.08;
        patch.mesh.rotation.y += patch.rotSpeed * dt;

        // Calculate local patch fade
        const localProgress = Math.max(
          0,
          Math.min(1, (progressRatio - patch.dissolveOffset) / (1 - patch.dissolveOffset))
        );
        const currentScale = patch.baseScale * Math.max(0.001, 1 - localProgress * 0.98);
        patch.mesh.scale.setScalar(currentScale);
        patch.mesh.material.opacity = Math.max(0, 0.95 * (1 - localProgress));
        patch.mesh.visible = localProgress < 0.99;
      }

      // Update 3D Oil Droplets
      for (let i = 0; i < droplets.length; i++) {
        const d = droplets[i];
        const waveY = getWaveHeight(d.baseX, d.baseZ, elapsed);
        d.mesh.position.y =
          waveY + d.depthOffset + Math.sin(elapsed * 2 + d.phaseOffset) * 0.12;
        d.mesh.rotation.x += dt * 0.5;
        d.mesh.rotation.y += dt * 0.7;

        const shrink = Math.max(0.001, 1 - progressRatio * 0.96);
        d.mesh.scale.setScalar(d.baseScale * shrink);
        d.mesh.material.opacity = Math.max(0, 0.98 * (1 - Math.pow(progressRatio, 1.3)));
        d.mesh.visible = progressRatio < 0.99;
      }

      // Update Alcanivorax Bacteria Swarm
      const isBacteriaActive = curPhase === 'remediating' || curPhase === 'clean';
      if (isBacteriaActive) {
        const targetOpacity =
          curPhase === 'clean' ? 0.35 : Math.min(1, bacteriaMat.opacity + dt * 1.5);
        bacteriaMat.opacity = targetOpacity;
        bioLight.intensity = curPhase === 'remediating' ? 4.5 : 1.5;

        for (let i = 0; i < bacteriaList.length; i++) {
          const b = bacteriaList[i];
          b.mesh.visible = true;

          if (b.arrivalProgress < 1) {
            b.arrivalProgress = Math.min(
              1,
              b.arrivalProgress + dt * (0.75 - b.delay * 0.5)
            );
          }

          const ease = 1 - Math.pow(1 - b.arrivalProgress, 3);
          const dPos = b.targetDroplet.mesh.position;

          b.orbitAngle += dt * b.orbitSpeed;
          const currentOrbitR =
            b.orbitRadius * Math.max(0.25, oilRemaining + 0.15);

          const attachedX =
            dPos.x + Math.cos(b.orbitAngle) * currentOrbitR;
          const attachedY =
            dPos.y +
            Math.sin(b.orbitAngle * 1.3) * currentOrbitR * 0.6;
          const attachedZ =
            dPos.z + Math.sin(b.orbitAngle) * currentOrbitR;

          b.mesh.position.x = THREE.MathUtils.lerp(b.startX, attachedX, ease);
          b.mesh.position.y = THREE.MathUtils.lerp(b.startY, attachedY, ease);
          b.mesh.position.z = THREE.MathUtils.lerp(b.startZ, attachedZ, ease);

          // Orient bacterium toward droplet center
          b.mesh.lookAt(dPos);
        }
      } else {
        bacteriaMat.opacity = 0;
        bioLight.intensity = 0;
        for (let i = 0; i < bacteriaList.length; i++) {
          const b = bacteriaList[i];
          b.mesh.visible = false;
          b.arrivalProgress = 0;
        }
      }

      // Update CO2 & H2O Conversion Particles
      const showBubbles =
        curPhase === 'remediating' && curProgress > 2 && curProgress < 99.5;
      for (let i = 0; i < bubbles.length; i++) {
        const bub = bubbles[i];
        if (!showBubbles) {
          bub.mesh.visible = false;
          continue;
        }

        bub.mesh.visible = true;
        bub.life += dt * bub.speed;
        if (bub.life > 1) {
          bub.life = 0;
        }

        const hostPos = bub.hostDroplet.mesh.position;
        if (bub.isCO2) {
          // CO2 gas bubbles rise upward into the atmosphere
          bub.mesh.position.x =
            hostPos.x +
            Math.sin(bub.life * bub.wobbleFreq * Math.PI * 2) * bub.wobbleAmp;
          bub.mesh.position.y = hostPos.y + bub.life * 6.5;
          bub.mesh.position.z =
            hostPos.z +
            Math.cos(bub.life * bub.wobbleFreq * Math.PI * 2) * bub.wobbleAmp;
        } else {
          // H2O molecules disperse outward into the ocean water
          bub.mesh.position.x = hostPos.x + bub.spreadX * bub.life * 2.5;
          bub.mesh.position.y = hostPos.y - bub.life * 1.8;
          bub.mesh.position.z = hostPos.z + bub.spreadZ * bub.life * 2.5;
        }

        const scalePulse = Math.sin(bub.life * Math.PI) * 1.15;
        bub.mesh.scale.setScalar(Math.max(0.01, scalePulse));
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      domElem.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElem.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 w-full h-full cursor-grab active:cursor-grabbing"
      title="Kéo chuột để xoay góc nhìn 3D • Cuộn chuột để phóng to/thu nhỏ"
    />
  );
}
