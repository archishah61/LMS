import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

const ExpressiveWhiteBlueRobot = () => {
    const mountRef = useRef(null);
    const sceneRef = useRef(null);
    const rendererRef = useRef(null);
    const robotGroupRef = useRef(null);

    useEffect(() => {
        // Scene setup with transparent background
        const scene = new THREE.Scene();
        // No background color set - will be transparent
        sceneRef.current = scene;

        // Camera setup
        const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
        camera.position.set(0, 0, 4);

        // Renderer setup with transparent background
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true // Enable alpha channel for transparency
        });
        renderer.setSize(300, 300); // Reduced from 400x400 to 300x300
        renderer.setClearColor(0x000000, 0); // Transparent background
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        rendererRef.current = renderer;
        mountRef.current.appendChild(renderer.domElement);

        // Enhanced lighting for white-blue metallic effect
        const ambientLight = new THREE.AmbientLight(0x404080, 0.7);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
        directionalLight.position.set(3, 5, 5);
        directionalLight.castShadow = true;
        scene.add(directionalLight);

        const rimLight = new THREE.DirectionalLight(0x80c0ff, 1.0);
        rimLight.position.set(-3, -2, -5);
        scene.add(rimLight);

        // Robot group
        const robotGroup = new THREE.Group();
        robotGroupRef.current = robotGroup;
        scene.add(robotGroup);

        // Main body - white-blue metallic sphere
        const bodyGeometry = new THREE.SphereGeometry(0.8, 32, 32);
        const bodyMaterial = new THREE.MeshPhongMaterial({
            color: 0xe6f3ff,
            shininess: 120,
            specular: 0xb3d9ff
        });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.castShadow = true;
        body.receiveShadow = true;
        robotGroup.add(body);

        // Black screen area - part of the sphere surface (front face)
        const screenGeometry = new THREE.SphereGeometry(0.805, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6);
        const screenMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 200,
            specular: 0x333333
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(0, 0.1, 0);
        robotGroup.add(screen);

        // Expressive ears - white-blue
        const earGeometry = new THREE.SphereGeometry(0.28, 16, 16);
        earGeometry.scale(1, 1.5, 0.7);
        const earMaterial = new THREE.MeshPhongMaterial({
            color: 0xd9ecff,
            shininess: 100,
            specular: 0xb3d9ff
        });

        const leftEar = new THREE.Mesh(earGeometry, earMaterial);
        leftEar.position.set(-0.4, 0.75, 0.15);
        leftEar.rotation.z = -0.3;
        leftEar.castShadow = true;
        robotGroup.add(leftEar);

        const rightEar = new THREE.Mesh(earGeometry, earMaterial);
        rightEar.position.set(0.4, 0.75, 0.15);
        rightEar.rotation.z = 0.3;
        rightEar.castShadow = true;
        robotGroup.add(rightEar);

        // Inner ears with light blue
        const innerEarGeometry = new THREE.SphereGeometry(0.14, 16, 16);
        innerEarGeometry.scale(1, 1.3, 0.5);
        const innerEarMaterial = new THREE.MeshPhongMaterial({
            color: 0xb3d9ff,
            shininess: 80
        });

        const leftInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
        leftInnerEar.position.set(-0.4, 0.72, 0.2);
        leftInnerEar.rotation.z = -0.3;
        robotGroup.add(leftInnerEar);

        const rightInnerEar = new THREE.Mesh(innerEarGeometry, innerEarMaterial);
        rightInnerEar.position.set(0.4, 0.72, 0.2);
        rightInnerEar.rotation.z = 0.3;
        robotGroup.add(rightInnerEar);

        // Cyan eyes - positioned within the black screen area
        const eyeGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const eyeMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffff
        });

        const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        leftEye.position.set(-0.2, 0.15, 0.72);
        robotGroup.add(leftEye);

        const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
        rightEye.position.set(0.2, 0.15, 0.72);
        robotGroup.add(rightEye);

        // Dark cyan pupils
        const pupilGeometry = new THREE.SphereGeometry(0.07, 12, 12);
        const pupilMaterial = new THREE.MeshBasicMaterial({
            color: 0x006666
        });

        const leftPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        leftPupil.position.set(-0.2, 0.15, 0.725);
        robotGroup.add(leftPupil);

        const rightPupil = new THREE.Mesh(pupilGeometry, pupilMaterial);
        rightPupil.position.set(0.2, 0.15, 0.725);
        robotGroup.add(rightPupil);

        // Bright cyan eye highlights
        const highlightGeometry = new THREE.SphereGeometry(0.025, 8, 8);
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0x66ffff
        });

        const leftHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        leftHighlight.position.set(-0.18, 0.18, 0.73);
        robotGroup.add(leftHighlight);

        const rightHighlight = new THREE.Mesh(highlightGeometry, highlightMaterial);
        rightHighlight.position.set(0.22, 0.18, 0.73);
        robotGroup.add(rightHighlight);

        // White-blue eyebrows - positioned on the black screen
        const eyebrowGeometry = new THREE.BoxGeometry(0.1, 0.025, 0.015);
        const eyebrowMaterial = new THREE.MeshBasicMaterial({
            color: 0xb3d9ff
        });

        const leftEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        leftEyebrow.position.set(-0.2, 0.26, 0.72);
        robotGroup.add(leftEyebrow);

        const rightEyebrow = new THREE.Mesh(eyebrowGeometry, eyebrowMaterial);
        rightEyebrow.position.set(0.2, 0.26, 0.72);
        robotGroup.add(rightEyebrow);

        // Cyan mouth - positioned within the black screen area
        const mouthGeometry = new THREE.TorusGeometry(0.1, 0.02, 8, 16, Math.PI);
        const mouthMaterial = new THREE.MeshBasicMaterial({
            color: 0x00cccc
        });
        const mouth = new THREE.Mesh(mouthGeometry, mouthMaterial);
        mouth.position.set(0, -0.05, 0.72);
        mouth.rotation.x = Math.PI;
        robotGroup.add(mouth);

        // Light blue nose - positioned on the black screen
        const noseGeometry = new THREE.SphereGeometry(0.015, 8, 8);
        const noseMaterial = new THREE.MeshPhongMaterial({
            color: 0xb3d9ff,
            shininess: 150
        });
        const nose = new THREE.Mesh(noseGeometry, noseMaterial);
        nose.position.set(0, 0.08, 0.725);
        robotGroup.add(nose);

        // White hands/paws
        const handGeometry = new THREE.SphereGeometry(0.09, 12, 12);
        const handMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 140,
            specular: 0xb3d9ff
        });

        const leftHand = new THREE.Mesh(handGeometry, handMaterial);
        leftHand.position.set(-0.88, 0.1, 0);
        leftHand.castShadow = true;
        robotGroup.add(leftHand);

        const rightHand = new THREE.Mesh(handGeometry, handMaterial);
        rightHand.position.set(0.88, 0.1, 0);
        rightHand.castShadow = true;
        robotGroup.add(rightHand);

        // White legs
        const legGeometry = new THREE.SphereGeometry(0.11, 16, 16);
        const legMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            shininess: 140,
            specular: 0xb3d9ff
        });

        const frontLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontLeftLeg.position.set(-0.42, -0.95, 0.32);
        frontLeftLeg.castShadow = true;
        robotGroup.add(frontLeftLeg);

        const frontRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        frontRightLeg.position.set(0.42, -0.95, 0.32);
        frontRightLeg.castShadow = true;
        robotGroup.add(frontRightLeg);

        const backLeftLeg = new THREE.Mesh(legGeometry, legMaterial);
        backLeftLeg.position.set(-0.42, -0.95, -0.32);
        backLeftLeg.castShadow = true;
        robotGroup.add(backLeftLeg);

        const backRightLeg = new THREE.Mesh(legGeometry, legMaterial);
        backRightLeg.position.set(0.42, -0.95, -0.32);
        backRightLeg.castShadow = true;
        robotGroup.add(backRightLeg);

        // Animation variables
        let time = 0;
        let movementState = 'bouncing';
        let stateTimer = 0;
        let expressionTimer = 0;
        let currentExpression = 'happy';
        let isListening = false;
        let isSpeaking = false;
        let speakingTimer = 0;
        let bounceDirection = { x: 1, z: 1 };
        let targetPosition = { x: 0, z: 0 };

        // Expression prompts
        const expressions = [
            'happy', 'sad', 'angry', 'surprised', 'sleepy', 'excited',
            'listening', 'speaking', 'confused', 'loving'
        ];

        // Advanced animation loop
        const animate = () => {
            requestAnimationFrame(animate);
            time += 0.02;
            stateTimer += 0.02;
            expressionTimer += 0.02;
            speakingTimer += 0.02;

            // Dynamic movement patterns
            if (stateTimer > 150) {
                stateTimer = 0;
                const movements = ['bouncing', 'floating', 'swaying', 'dancing'];
                movementState = movements[Math.floor(Math.random() * movements.length)];

                if (movementState === 'bouncing') {
                    bounceDirection.x = (Math.random() - 0.5) * 2;
                    bounceDirection.z = (Math.random() - 0.5) * 2;
                }
            }

            // Apply movement patterns
            switch (movementState) {
                case 'bouncing':
                    robotGroup.position.x = Math.sin(time * 2) * 0.3 * bounceDirection.x;
                    robotGroup.position.z = Math.cos(time * 1.8) * 0.3 * bounceDirection.z;
                    robotGroup.position.y = Math.abs(Math.sin(time * 3)) * 0.15;
                    robotGroup.rotation.y = Math.sin(time * 1.5) * 0.3;
                    break;
                case 'floating':
                    robotGroup.position.y = Math.sin(time * 1.5) * 0.1;
                    robotGroup.rotation.y += 0.01;
                    robotGroup.rotation.x = Math.sin(time * 0.8) * 0.1;
                    break;
                case 'swaying':
                    robotGroup.rotation.z = Math.sin(time * 1.2) * 0.2;
                    robotGroup.rotation.x = Math.cos(time * 1.1) * 0.15;
                    robotGroup.position.y = Math.sin(time * 2) * 0.05;
                    break;
                case 'dancing':
                    robotGroup.position.y = Math.abs(Math.sin(time * 4)) * 0.12;
                    robotGroup.rotation.y = Math.sin(time * 2) * 0.5;
                    robotGroup.rotation.z = Math.cos(time * 3) * 0.1;
                    break;
            }

            // Change expressions more frequently
            if (expressionTimer > 100 + Math.random() * 80) {
                expressionTimer = 0;
                currentExpression = expressions[Math.floor(Math.random() * expressions.length)];

                isListening = currentExpression === 'listening';
                isSpeaking = currentExpression === 'speaking';
                if (isSpeaking) speakingTimer = 0;
            }

            // Apply detailed expressions with cyan color variations
            switch (currentExpression) {
                case 'angry':
                    leftEyebrow.rotation.z = 0.4;
                    rightEyebrow.rotation.z = -0.4;
                    leftEyebrow.position.y = 0.24;
                    rightEyebrow.position.y = 0.24;
                    leftEye.scale.set(0.8, 0.8, 0.8);
                    rightEye.scale.set(0.8, 0.8, 0.8);
                    mouth.rotation.x = 0;
                    mouth.scale.y = 0.7;
                    leftEye.material.color.setHex(0xff4444);
                    rightEye.material.color.setHex(0xff4444);
                    break;

                case 'sad':
                    leftEyebrow.rotation.z = -0.2;
                    rightEyebrow.rotation.z = 0.2;
                    leftEyebrow.position.y = 0.23;
                    rightEyebrow.position.y = 0.23;
                    leftEye.scale.set(0.9, 0.7, 0.9);
                    rightEye.scale.set(0.9, 0.7, 0.9);
                    mouth.rotation.x = 0;
                    mouth.position.y = -0.08;
                    mouth.scale.y = 0.6;
                    leftEye.material.color.setHex(0x0088cc);
                    rightEye.material.color.setHex(0x0088cc);
                    break;

                case 'surprised':
                    leftEyebrow.rotation.z = 0;
                    rightEyebrow.rotation.z = 0;
                    leftEyebrow.position.y = 0.3;
                    rightEyebrow.position.y = 0.3;
                    leftEye.scale.set(1.4, 1.4, 1.4);
                    rightEye.scale.set(1.4, 1.4, 1.4);
                    mouth.scale.set(1.2, 1.2, 1.2);
                    mouth.rotation.x = Math.PI * 0.5;
                    leftEye.material.color.setHex(0x44ffff);
                    rightEye.material.color.setHex(0x44ffff);
                    break;

                case 'sleepy':
                    leftEyebrow.rotation.z = 0;
                    rightEyebrow.rotation.z = 0;
                    leftEyebrow.position.y = 0.26;
                    rightEyebrow.position.y = 0.26;
                    leftEye.scale.set(1, 0.3, 1);
                    rightEye.scale.set(1, 0.3, 1);
                    mouth.scale.set(0.8, 0.8, 0.8);
                    mouth.rotation.x = Math.PI;
                    leftEye.material.color.setHex(0x006699);
                    rightEye.material.color.setHex(0x006699);
                    break;

                case 'excited':
                    leftEyebrow.position.y = 0.28;
                    rightEyebrow.position.y = 0.28;
                    leftEye.scale.set(1.3, 1.3, 1.3);
                    rightEye.scale.set(1.3, 1.3, 1.3);
                    mouth.scale.set(1.4, 1.4, 1.4);
                    mouth.rotation.x = Math.PI;
                    robotGroup.position.y += Math.sin(time * 6) * 0.05;
                    leftEye.material.color.setHex(0x88ffff);
                    rightEye.material.color.setHex(0x88ffff);
                    break;

                case 'listening':
                    leftEye.scale.set(1.1, 1.1, 1.1);
                    rightEye.scale.set(1.1, 1.1, 1.1);
                    mouth.scale.set(0.9, 0.9, 0.9);
                    leftEar.rotation.z = -0.3 + Math.sin(time * 4) * 0.15;
                    rightEar.rotation.z = 0.3 + Math.cos(time * 4) * 0.15;
                    leftInnerEar.rotation.z = -0.3 + Math.sin(time * 4) * 0.15;
                    rightInnerEar.rotation.z = 0.3 + Math.cos(time * 4) * 0.15;
                    leftEye.material.color.setHex(0x00dddd);
                    rightEye.material.color.setHex(0x00dddd);
                    break;

                case 'speaking':
                    leftEye.scale.set(1.1, 1.1, 1.1);
                    rightEye.scale.set(1.1, 1.1, 1.1);
                    mouth.scale.y = 1 + Math.sin(speakingTimer * 8) * 0.3;
                    mouth.rotation.x = Math.PI + Math.sin(speakingTimer * 10) * 0.2;
                    leftEye.material.color.setHex(0x22cccc);
                    rightEye.material.color.setHex(0x22cccc);
                    break;

                case 'confused':
                    robotGroup.rotation.z += Math.sin(time * 2) * 0.1;
                    leftEyebrow.rotation.z = 0.2;
                    rightEyebrow.rotation.z = -0.2;
                    leftEye.scale.set(0.9, 0.9, 0.9);
                    rightEye.scale.set(0.9, 0.9, 0.9);
                    leftEye.material.color.setHex(0x0099bb);
                    rightEye.material.color.setHex(0x0099bb);
                    break;

                case 'loving':
                    leftEye.scale.set(1.2, 1.2, 1.2);
                    rightEye.scale.set(1.2, 1.2, 1.2);
                    mouth.scale.set(1.2, 1.2, 1.2);
                    mouth.rotation.x = Math.PI;
                    leftEye.material.color.setHex(0x66ddff);
                    rightEye.material.color.setHex(0x66ddff);
                    break;

                default: // happy
                    leftEyebrow.rotation.z = 0;
                    rightEyebrow.rotation.z = 0;
                    leftEyebrow.position.y = 0.26;
                    rightEyebrow.position.y = 0.26;
                    leftEye.scale.set(1, 1, 1);
                    rightEye.scale.set(1, 1, 1);
                    mouth.scale.set(1, 1, 1);
                    mouth.rotation.x = Math.PI;
                    mouth.position.y = -0.05;
                    leftEye.material.color.setHex(0x00ffff);
                    rightEye.material.color.setHex(0x00ffff);
            }

            // Eye movement for liveliness
            const eyeMovementX = Math.sin(time * 0.5) * 0.015;
            const eyeMovementY = Math.cos(time * 0.3) * 0.015;
            leftPupil.position.x = -0.2 + eyeMovementX;
            leftPupil.position.y = 0.15 + eyeMovementY;
            rightPupil.position.x = 0.2 + eyeMovementX;
            rightPupil.position.y = 0.15 + eyeMovementY;

            // Leg movements
            const legSpeed = movementState === 'dancing' ? 4 : 2.5;
            const legOffset = time * legSpeed;
            frontLeftLeg.position.y = -0.95 + Math.sin(legOffset) * 0.06;
            frontRightLeg.position.y = -0.95 + Math.sin(legOffset + Math.PI) * 0.06;
            backLeftLeg.position.y = -0.95 + Math.sin(legOffset + Math.PI) * 0.06;
            backRightLeg.position.y = -0.95 + Math.sin(legOffset) * 0.06;

            // Hand movements
            leftHand.position.y = 0.1 + Math.sin(time * 2.5) * 0.08;
            rightHand.position.y = 0.1 + Math.sin(time * 2.5 + Math.PI) * 0.08;

            // Default ear movement (unless listening)
            if (!isListening) {
                leftEar.rotation.z = -0.3 + Math.sin(time * 1.8) * 0.06;
                rightEar.rotation.z = 0.3 + Math.sin(time * 1.8 + Math.PI) * 0.06;
                leftInnerEar.rotation.z = -0.3 + Math.sin(time * 1.8) * 0.06;
                rightInnerEar.rotation.z = 0.3 + Math.sin(time * 1.8 + Math.PI) * 0.06;
            }

            renderer.render(scene, camera);
        };

        animate();

        // Cleanup
        return () => {
            if (mountRef.current && renderer.domElement) {
                mountRef.current.removeChild(renderer.domElement);
            }
            renderer.dispose();
        };
    }, []);

    return (
        <div
            ref={mountRef}
            style={{
                width: '300px',
                height: '300px'
            }}
        />
    );
};

export default ExpressiveWhiteBlueRobot;