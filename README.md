<h1 align="center">
    <img src="https://user-images.githubusercontent.com/7625588/53308816-3041ec80-38df-11e9-9c3a-fb515eb4d404.png">
</h1>

[![Build Status](https://travis-ci.org/but0n/Ashes.svg?branch=master)](https://travis-ci.org/but0n/Ashes)
[![](https://badgen.net/bundlephobia/minzip/ashes3d)](https://bundlephobia.com/result?p=ashes3d)
[![](https://data.jsdelivr.com/v1/package/npm/ashes3d/badge)](https://www.jsdelivr.com/package/npm/ashes3d)

![](https://user-images.githubusercontent.com/7625588/75624993-d4a2f100-5c0d-11ea-95c0-f0c13f4d29d8.png)
![](https://user-images.githubusercontent.com/7625588/67295473-c0d9d680-f519-11e9-96b8-72422af0a547.png)

# Examples
 - [glTF test](https://cx20.github.io/gltf-test/?engines=Ashes)
 - [Examples](https://cx20.github.io/jsdo.it-archives/tag/ashes/)
 - [Examples](https://jsfiddle.net/user/cx20/fiddles/)


# Features
![ezgif-4-e4c6f3cb3183](https://user-images.githubusercontent.com/7625588/58366099-db266e80-7eff-11e9-9d24-396a98895d7c.gif)

 - Entity–component–system (ECS) architectural
 - glTF support
 - Physically based rendering (PBR)
 - Post effects (WIP)
 - Skeleton animation
 - Keyframe animation
 - HDR

# Getting Started

- via CDN
```html
<script src="https://cdn.jsdelivr.net/npm/ashes3d/build/ashes.main.js"></script>
```
- via npm
```
npm i ashes3d
```

# Usage

[Try it](https://codepen.io/but0n/pen/daERdd)

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
    let cam = mainCamera.addComponent(new Camera(screen.width / screen.height));

    // Set default position
    let cameraTrans = mainCamera.components.Transform;
    vec3.set(cameraTrans.translate, 0, 10, 10);

    // Add it to scene
    scene.appendChild(mainCamera);

    // Attach controler
    mainCamera.addComponent(new OrbitControl(screen, mainCamera));

    document.querySelector('body').appendChild(scene);

    // Load a gltf model
    let gltfroot = await Asset.loadGLTF(gltf, screen, skybox);
    scene.appendChild(gltfroot);

}

main();

```

## Create a quad with texture

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
    quad.addComponent(quadMR);

    // Set local translate [x, y, z]
    quad.components.Transform.translate[1] = -1;

    // Set euler angle x, y, z
    quat.fromEuler(quad.components.Transform.quaternion, -90, 0, 0);

    // The original size of quad is 2x2
    vec3.scale(quad.components.Transform.scale, quad.components.Transform.scale, 9);

```

# Deployment

```sh
git clone --recursive https://github.com/but0n/Ashes.git
cd Ashes

# if you don't have yarn installed
npm install -g yarn

yarn

yarn dev
```

