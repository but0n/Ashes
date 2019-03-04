precision mediump float;
uniform sampler2D base;

varying vec2 uv;
varying vec4 pos;

void main(){
    vec2 offset=uv*2.-1.;
    float mask=1.-dot(offset,offset)*FACTOR;
    mask=clamp(.5+(mask-.5)*HARDNESS,0.,1.);
    vec4 color=texture2D(base,uv);
    gl_FragColor=mix(vec4(vec3(0),1),color,mask);
    gl_FragColor=vec4(pos.xy, 0, 1);
}