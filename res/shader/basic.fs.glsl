precision highp float;
uniform sampler2D base;

void main(){
    vec2 uv = gl_FragCoord.xy / screenSize;
    gl_FragColor=texture2D(base,uv);
}