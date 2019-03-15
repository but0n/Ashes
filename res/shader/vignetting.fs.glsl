precision highp float;
uniform sampler2D base;

void main(){
    vec2 uv = gl_FragCoord.xy / screenSize;
    vec2 pos = uv * 2. - 1.;
    float mask=1.-dot(pos,pos)*FACTOR;
    mask=clamp(.5+(mask-.5)*HARDNESS,0.,1.);
    vec4 color=texture2D(base,uv);
    gl_FragColor=mix(vec4(vec3(0),1),color,mask);
}