attribute vec3 POSITION;

void main(){
    vec4 position=vec4(POSITION,1);
    gl_Position=position;
}