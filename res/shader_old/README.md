This folder contains shaders before [precompute VP matrix](https://github.com/but0n/Ashes/commit/8f6ebc76d7e92a5b7dde8ba5e741548fed2c5d71#diff-d7bd94c90ac7f9b5a1f43eb1901331cc) for backward compatibility.

If you are using Ashes v0.0.50 or older, please make sure the shader path is direct to this folder:

```js
Material.SHADER_PATH = CDN + 'res/shader_old/';
```