varying vec3 vertexNormal;
varying vec2 vertexUV;

void main()
{
    vertexNormal = normalize(normalMatrix * normal);
    vertexUV = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}