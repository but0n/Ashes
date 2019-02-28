precision mediump float;
uniform sampler2D base;

varying vec2 uv;
varying vec4 pos;

void main(){
    gl_FragColor=texture2D(base,uv);
    // gl_FragColor = vec4(uv, 1, 1);
}