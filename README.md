<h1 align="center">
    <img src="https://user-images.githubusercontent.com/7625588/51424529-163f2b00-1c0a-11e9-84fe-0a83d0659a1a.png">
</h1>

[![Build Status](https://travis-ci.org/but0n/Ashes.svg?branch=master)](https://travis-ci.org/but0n/Ashes)
[![](https://badgen.net/bundlephobia/minzip/ashes3d)](https://bundlephobia.com/result?p=ashes3d)
[![](https://data.jsdelivr.com/v1/package/npm/ashes3d/badge)](https://www.jsdelivr.com/package/npm/ashes3d)


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

## Example

```js
async function example() {

    // Get canvas
    let screen = new Ashes.Screen('#screen');

    gltfpath = 'gltfsamples/police_drone/scene.gltf';
    skymap = 'res/envmap/GoldenGateBridge2/';

    let scene = Ashes.EntityMgr.create('root');

    // Load gltf scene and append to the root
    let gltfroot = await Ashes.Asset.loadGLTF(gltfpath, screen, skymap);
    scene.appendChild(gltfroot);


    // Create camera
    let mainCamera = Ashes.EntityMgr.create('camera');
    Ashes.EntityMgr.addComponent(mainCamera, new Ashes.Camera(screen.width / screen.height));

    // Set camera position
    let cameraTrans = mainCamera.components.Transform;
    Ashes.vec3.set(cameraTrans.translate, 0, 0, 10);
    scene.appendChild(mainCamera);

    // Orbit control
    new Ashes.OrbitControl(screen, mainCamera);

    document.querySelector('body').appendChild(scene);

}

example();

```