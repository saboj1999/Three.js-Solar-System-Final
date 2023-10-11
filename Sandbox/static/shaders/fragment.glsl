uniform sampler2D starTexture;

varying vec2 vertexUV;
varying vec3 vertexNormal;

void main()
{
    float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.0, 1.0));
    vec3 atmosphere = vec3(`+rgb.r/255+`, `+rgb.g/255+`, `+rgb.b/255+`) * pow(intensity, 1.5);
    gl_FragColor = vec4(atmosphere + texture2D(starTexture, vertexUV).xyz, 1.0);
}