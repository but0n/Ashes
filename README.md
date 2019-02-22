<h1 align="center">
    <img src="https://user-images.githubusercontent.com/7625588/51424529-163f2b00-1c0a-11e9-84fe-0a83d0659a1a.png">
</h1>

[![Build Status](https://travis-ci.org/but0n/Ashes.svg?branch=master)](https://travis-ci.org/but0n/Ashes)
[![](https://badgen.net/bundlephobia/minzip/ashes3d)](https://bundlephobia.com/result?p=ashes3d)
[![](https://data.jsdelivr.com/v1/package/npm/ashes3d/badge)](https://www.jsdelivr.com/package/npm/ashes3d)

![](https://user-images.githubusercontent.com/7625588/52896085-bbdfbd00-31fd-11e9-944d-cfed12c18cbd.png)

### [glTF-test](https://cx20.github.io/gltf-test/?engines=Ashes) by [cx20](https://github.com/cx20)

## Getting Started

```sh
yarn add ashes3d
```

## Deployment

```sh
git clone https://github.com/but0n/Ashes.git
cd Ashes

# if you don't have yarn installed
npm install -g yarn

yarn

yarn dev
```

## [Example](https://codepen.io/but0n/pen/daERdd)

```js

let { Asset, EntityMgr, Camera, vec3, quat, Screen, OrbitControl, MeshRenderer, Filter, Shader, Material, QuadMesh } = Ashes;

let CDN = 'https://but0n.github.io/Ashes/'
Material.SHADER_PATH = CDN + Material.SHADER_PATH;


// DamagedHelmet
let gltf = CDN + 'gltfsamples/DamagedHelmet.glb';


async function main() {

    let screen = new Screen('#screen');

    screen.bgColor = [0.2,0.2,0.2,1];


    let skybox = await Asset.loadCubemap(CDN + 'res/envmap/GoldenGateBridge2/');

    let scene = EntityMgr.create('root - (Click each bar which has yellow border to toggle visible)');

    // Camera
    let mainCamera = EntityMgr.create('camera');
    let cam = EntityMgr.addComponent(mainCamera, new Camera(screen.width / screen.height));

    // Set default position
    let cameraTrans = mainCamera.components.Transform;
    vec3.set(cameraTrans.translate, 0, 10, 10);

    // Add it to scene
    scene.appendChild(mainCamera);

    // Attach controler
    EntityMgr.addComponent(mainCamera, new OrbitControl(screen, mainCamera));

    document.querySelector('body').appendChild(scene);

    // Load a gltf model
    let gltfroot = await Asset.loadGLTF(gltf, screen, skybox);
    scene.appendChild(gltfroot);

}

main();

```

### Create a quad with texture

```js
    // Create an entity
    let quad = scene.appendChild(EntityMgr.create('quad'));

    // Load a material
    let quadMat = await Asset.LoadMaterial('stylize'); // PBR material

    // Load a texture
    let floor = await Asset.loadTexture(CDN + 'res/textures/floor.png', { minFilter: screen.gl.NEAREST_MIPMAP_NEAREST });
    floor.flipY = true;

    // Attach texture to material we created
    Material.setTexture(quadMat, 'baseColorTexture', floor);
    quadMat.shader.macros['HAS_BASECOLOR_MAP'] = '';

    // Create a renderer component
    let quadMR = new MeshRenderer(screen, new QuadMesh(), quadMat);

    // Attach renderer to entity
    EntityMgr.addComponent(quad, quadMR);

    // Set local translate [x, y, z]
    quad.components.Transform.translate[1] = -1;

    // Set euler angle x, y, z
    quat.fromEuler(quad.components.Transform.quaternion, -90, 0, 0);

    // The original size of quad is 2x2
    vec3.scale(quad.components.Transform.scale, quad.components.Transform.scale, 9);

```