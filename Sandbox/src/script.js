import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'

/**
 * Parameters
 */
const defaultScaleFactor = Math.pow(10, 10) // 10^9 is good too with use of camera views
const defaultTimeStep = 4320
const AU = 1.5 * Math.pow(10, 11)
const parameters = {
    timeStep: defaultTimeStep, // 60 -> 1 Simulation hour per 1 Actual second (4320 -> 3 days / 1 second) // is 1/60th real time?
    scaleFactor: defaultScaleFactor,
    gravitationalN: 0,
    scaleWithZoom: true,
    cameraTargetObject: null,
    lockCamera: false,
    pauseState: false,
    showTrails: true,
    radiusMod: 1,
    systemVelocityY: 0,
    timeToAnimateCamera: false
}
const gravitationConstant = -6.67 * Math.pow(10, -11)
const stephen_boltzmann = 5.67 * Math.pow(10, -8) // sigma -> watts per (meter^2 * Kelvin^4)
const controlsDivElement = document.getElementById('temps')
controlsDivElement.appendChild(document.createTextNode("Temperatures ->"))
const sunTemp = document.createElement("span")
sunTemp.innerText = "\n\nSun: 10,000"
controlsDivElement.appendChild(sunTemp)

const sunLuminosity = 3.828 * Math.pow(10, 26);
const alphaCentauriALuminosity = 1.519 * sunLuminosity;
const alphaCentauriBLuminosity = .5 * sunLuminosity;
const proximaCentauriLuminosity = .0017 * sunLuminosity;

const alphaCentauriAPointLightIntensity = 1;
const alphaCentauriBPointLightIntensity = 1;
const proximaCentauriPointLightIntensity = .8;

const sunMass = 1.989 * Math.pow(10, 30) // kgs
const mercuryMass = 3.285 * Math.pow(10, 23)
const venusMass = 4.867 * Math.pow(10, 24)
const earthMass = 5.972 * Math.pow(10, 24)
const moonMass = 7.347 * Math.pow(10, 22)
const marsMass = 6.39 * Math.pow(10, 23)
const jupiterMass = 1.898 * Math.pow(10, 27)
const saturnMass = 5.683 * Math.pow(10, 26)
const uranusMass = 8.681 * Math.pow(10, 25)
const neptuneMass = 1.024 * Math.pow(10, 26)
const plutoMass = 1.303 * Math.pow(10, 22)
const alphaCentauriAMass = 1.1 * sunMass;
const alphaCentauriBMass = .93 * sunMass;
const proximaCentauriMass = 2.428 * Math.pow(10, 29);
const proximaCentauriBMass = 1.07 * earthMass;
const proximaCentauriCMass = 7 * earthMass;

const sunOrbitalDistance = 0 // AU -> meters
const mercuryOrbitalDistance = .4 * AU
const venusOrbitalDistance = .7 * AU
const earthOrbitalDistance = AU
const marsOrbitalDistance = 1.5 * AU
const jupiterOrbitalDistance = 5.2 * AU
const saturnOrbitalDistance = 9.5 * AU
const uranusOrbitalDistance = 19.8 * AU
const neptuneOrbitalDistance = 30 * AU
const plutoOrbitalDistance = 39 * AU
const alphaCentauriAOrbitalDistance = -10.9 * AU / 2
const alphaCentauriBOribtalDistance = 12.8 * AU / 2
const proximaCentauriOrbitalDistance = 2500 * AU
const proximaCentauriBOrbitalDistance = 2500 * AU + .5 * AU
const proximaCentauriCOrbitalDistance = 2500 * AU + 1.49 * AU

const sunOrbitalVelocity = 0 // -> m/s
const mercuryOrbitalVelocity = -47000
const venusOrbitalVelocity = -35020
const earthOrbitalVelocity = -29783
const marsOrbitalVelocity = -24077
const jupiterOrbitalVelocity = -13070
const saturnOrbitalVelocity = -9690
const uranusOrbitalVelocity = -6810
const neptuneOrbitalVelocity = -5430
const plutoOrbitalVelocity = -4670
const alphaCentauriAOrbitalVelocity = 5000
const alphaCentauriBOrbitalVelocity = -5000
const proximaCentauriOrbitalVelocity = -11000
const proximaCentauriBOrbitalVelocity = -11000 - 12500
const proximaCentauriCOrbitalVelocity = -11000 - 7500


// comment out these lines to see radii to scale
const defaultRadiusScaler = 25 // arbitrary TODO -> realistic radii
let sunRadius =  defaultRadiusScaler * 696_000_000 / parameters.scaleFactor // meters
let mercuryRadius = defaultRadiusScaler * 4_879_000/2 / parameters.scaleFactor
let venusRadius = defaultRadiusScaler * 12_104_000/2 / parameters.scaleFactor	
let earthRadius = defaultRadiusScaler * 12_756_000/2 / parameters.scaleFactor
let moonRadius = defaultRadiusScaler * 3_475_000/2 / parameters.scaleFactor
let marsRadius = defaultRadiusScaler * 6_792_000/2 / parameters.scaleFactor
let jupiterRadius = defaultRadiusScaler * 142_984_000/2 / parameters.scaleFactor
let saturnRadius = defaultRadiusScaler * 120_536_000/2 / parameters.scaleFactor
let uranusRadius = defaultRadiusScaler * 51_118_000/2 / parameters.scaleFactor
let neptuneRadius = defaultRadiusScaler * 49_528_000/2 / parameters.scaleFactor
let plutoRadius = defaultRadiusScaler * 2_376_000/2 / parameters.scaleFactor
let alphaCentauriARadius = defaultRadiusScaler * 1_702_200_000/2 / parameters.scaleFactor
let alphaCentauriBRadius = defaultRadiusScaler * 1_201_600_000/2 / parameters.scaleFactor
let proximaCentauriRadius = defaultRadiusScaler * 214_550_000/2 / parameters.scaleFactor
let proximaCentauriBRadius = defaultRadiusScaler * 1.03 * 12_756_000/2 / parameters.scaleFactor
let proximaCentauriCRadius = defaultRadiusScaler * 7 * 12_756_000/2 / parameters.scaleFactor

const radiusMod = 1.5
sunRadius = .95 * radiusMod
mercuryRadius = .30 * radiusMod
venusRadius = .50 * radiusMod
earthRadius = .50 * radiusMod
moonRadius = .20 * radiusMod
marsRadius = .35 * radiusMod
jupiterRadius = .9 * radiusMod
saturnRadius = .85 * radiusMod
uranusRadius = .8 * radiusMod
neptuneRadius = .75 * radiusMod
plutoRadius = .18 * radiusMod
alphaCentauriARadius = 1.1 * radiusMod;
alphaCentauriBRadius = .9 * radiusMod;
proximaCentauriRadius = .45 * radiusMod;
proximaCentauriBRadius = .2 * radiusMod;
proximaCentauriCRadius = .3 * radiusMod;

const sunRotation = Math.PI * 2 // arbitrary -> TODO: realistic rotation
const mercuryRotation = Math.PI * .4
const venusRotation = -Math.PI * .1 
const earthRotation = Math.PI
const moonRotation = 0
const marsRotation = Math.PI
const jupiterRotation = Math.PI * 1.5
const saturnRotation = Math.PI * 1.25
const uranusRotation = Math.PI * 1.8
const neptuneRotation = Math.PI * 2
const plutoRotation = Math.PI
const alphaCentauriARotation = Math.PI * 1.5;
const alphaCentauriBRotation = Math.PI * 1.5;
const proximaCentauriRotation = Math.PI;
const proximaCentauriBRotation = Math.PI * .6;
const proximaCentauriCRotation = Math.PI * .3;

const mercuryAlbedo = .12;
const venusAlbedo = .8;
const earthAlbedo = .2;
const marsAlbedo = .32;
const jupiterAlbedo = .5;
const saturnAlbedo = .34;
const uranusAlbedo = .3;
const neptuneAlbedo = .29;
const plutoAlbedo = .1;
const proximaCentauriBAlbedo = .1;
const proximaCentauriCAlbedo = .1;

const mercuryEmissivity = .9;
const venusEmissivity = .01;
const earthEmissivity = .7;
const marsEmissivity = .95;
const jupiterEmissivity = .2;
const saturnEmissivity = .3;
const uranusEmissivity = .4;
const neptuneEmissivity = .3;
const plutoEmissivity = .6;
const proximaCentauriBEmissivity = .9;
const proximaCentauriCEmissivity = .9;

const defaultTrailLength = 0; // -> find way to determine length of trail in AU?

/**
 * Debug
 */
const gui = new dat.GUI({width: 400})
// gui.close()
// gui.hide()

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()


const hex2rgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    
    // return {r, g, b} 
    return { r, g, b };
}
/**
 * Plane
 */
const planeGeometry = new THREE.PlaneGeometry(500, 500, 300, 300)
const planeMaterial = new THREE.MeshBasicMaterial({color:0xffffff, wireframe: true,transparent: true, opacity: .1})
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = - Math.PI / 2
scene.add(plane)
plane.visible =  false

/**
 * Helper Axis
 */
const axesHelper = new THREE.AxesHelper(25)
scene.add(axesHelper)
axesHelper.visible = false

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const noTextureTexture = textureLoader.load('/textures/noTexture.jpg')
const sunTexture = textureLoader.load('/textures/sun.jpg')
const earthTexture = textureLoader.load('/textures/earth.jpg')
const moonTexture = textureLoader.load('/textures/moon.jpg')
const mercuryTexture = textureLoader.load('/textures/mercury.jpg')
const venusTexture = textureLoader.load('/textures/venus.jpg')
const marsTexture = textureLoader.load('/textures/mars.jpg')
const jupiterTexture = textureLoader.load('/textures/jupiter.jpg')
const saturnTexture = textureLoader.load('/textures/saturnBody.jpg')
const uranusTexture = textureLoader.load('/textures/uranusBody.jpg')
const neptuneTexture = textureLoader.load('/textures/neptune.jpg')
const plutoTexture = textureLoader.load('/textures/pluto.jpg')

const alphaCentauriATexture = textureLoader.load('/textures/alphaA.jpg')
const alphaCentauriBTexture = textureLoader.load('/textures/alphaB.jpg')
const proximaCentauriTexture = textureLoader.load('/textures/proxima.jpg')
const proximaCentauriBTexture = textureLoader.load('/textures/proximaB.jpg')
const proximaCentauriCTexture = textureLoader.load('/textures/proximaC.jpg')

const textures = {
    "No Texure":noTextureTexture,
    "Sun": sunTexture,
    "Earth": earthTexture,
    "Moon": moonTexture,
    "Mercury": mercuryTexture,
    "Venus": venusTexture,
    "Mars": marsTexture,
    "Jupiter": jupiterTexture,
    "Saturn": saturnTexture,
    "Uranus": uranusTexture,
    "Neptune": neptuneTexture,
    "Pluto": plutoTexture,
    "Alpha Centauri A": alphaCentauriATexture,
    "Alpha Centauri B": alphaCentauriBTexture,
    "Proxima Centauri": proximaCentauriTexture,
    "Proxima Centauri B": proximaCentauriBTexture,
    "Proxima Centauri C": proximaCentauriCTexture
}

const createBodyMesh = (radius, textureSource) =>
{
    const texture = textureLoader.load('/textures/'+textureSource)
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({
        map: texture
    })
    return new THREE.Mesh(geometry, material)
}
const createBodyMeshCustomShader = (radius, textureSource, atmosphereColor) =>
{
    const rgb = hex2rgb(atmosphereColor)

    var vertexPlanetS = `
    varying vec3 vertexNormal;
    varying vec2 vertexUV;
    varying vec3 vPosition;

    void main()
    {
        vertexNormal = normalize(normalMatrix * normal);
        vertexUV = uv;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`
    var fragPlanetS = `
    uniform vec3 colorNear;
    uniform vec3 colorFar;
    uniform float nearDistance;
    uniform float farDistance;
    varying vec3 vPosition;
    uniform sampler2D planetTexture;

    varying vec2 vertexUV;
    varying vec3 vertexNormal;
    
    void main()
    {
        // Calculate the distance to the camera
        float distance = length(cameraPosition - vPosition);
    
        // Interpolate the color based on the distance
        vec3 color = mix(colorFar, colorNear, smoothstep(nearDistance, farDistance, distance));
    
        // gl_FragColor = vec4(color, 1.0);

        float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.0, 1.0));
        vec3 atmosphere = vec3(`+rgb.r/255+`, `+rgb.g/255+`, `+rgb.b/255+`) * pow(intensity, 1.5);
        gl_FragColor = vec4(atmosphere + texture2D(planetTexture, vertexUV).xyz, 1.0);
    }`
    var vertexAtmosphereS = `
    varying vec3 vertexNormal;

    void main()
    {
        vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`
    var fragAtmosphereS = `
    varying vec3 vertexNormal;
    
    void main()
    {
        float intensity = pow(1.25 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        // gl_FragColor = vec4(gl_FragCoord.x, gl_FragCoord.y, gl_FragCoord.z, 1.0);
        gl_FragColor = vec4(${rgb.r/255}, `+rgb.g/255+`, `+rgb.b/255+`, 1.0) * intensity;
    }`

    // const texture = 
    const planetGeometry = new THREE.SphereGeometry(radius, 32, 32)
    const planetMaterial = new THREE.ShaderMaterial({
        uniforms:{
            planetTexture:{ value: textureLoader.load('/textures/'+textureSource) },
            colorNear: { value: new THREE.Color('atmosphereColor') },
            colorFar: { value: new THREE.Color('#ffffff') },
            nearDistance: { value: .1 },
            farDistance: { value: 5 }
        },
        vertexShader: vertexPlanetS,
        fragmentShader: fragPlanetS
    })

    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32)
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexAtmosphereS,
        fragmentShader: fragAtmosphereS,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })

    const planetMesh = new THREE.Mesh(planetGeometry, planetMaterial)
    const planetAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)

    const planet = new THREE.Object3D()
    planet.add(planetMesh)
    planet.add(planetAtmosphere)

    return planet
}
const createStarMesh = (radius, textureSource, emissiveColor, emissiveIntensity) =>
{
    const texture = textureLoader.load('/textures/'+textureSource)
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: emissiveColor, 
        emissiveIntensity: emissiveIntensity
    })
    return new THREE.Mesh(geometry, material)
}
const createStarMeshCustomShader = (radius, textureSource, atmosphereColor) =>
{
    const rgb = hex2rgb(atmosphereColor)

    var vertexStarS = `
    varying vec3 vertexNormal;
    varying vec2 vertexUV;

    void main()
    {
        vertexNormal = normalize(normalMatrix * normal);
        vertexUV = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`
    var fragStarS = `
    uniform sampler2D starTexture;

    varying vec2 vertexUV;
    varying vec3 vertexNormal;
    
    void main()
    {
        float intensity = 1.05 - dot(vertexNormal, vec3(0.0, 0.0, 1.0));
        vec3 atmosphere = vec3(`+rgb.r/255+`, `+rgb.g/255+`, `+rgb.b/255+`) * pow(intensity, 1.5);
        gl_FragColor = vec4(atmosphere + texture2D(starTexture, vertexUV).xyz, 1.0);
    }`
    var vertexAtmosphereS = `
    varying vec3 vertexNormal;

    void main()
    {
        vertexNormal = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`
    var fragAtmosphereS = `
    varying vec3 vertexNormal;
    
    void main()
    {
        float intensity = pow(1.25 - dot(vertexNormal, vec3(0.0, 0.0, 1.0)), 2.0);
        gl_FragColor = vec4(`+rgb.r/255+`, `+rgb.g/255+`, `+rgb.b/255+`, 1.0) * intensity;
    }`

    // const texture = 
    const starGeometry = new THREE.SphereGeometry(radius, 32, 32)
    const starMaterial = new THREE.ShaderMaterial({
        uniforms:{starTexture:{value: textureLoader.load('/textures/'+textureSource)}},
        vertexShader: vertexStarS,
        fragmentShader: fragStarS
    })

    const atmosphereGeometry = new THREE.SphereGeometry(radius * 1.1, 32, 32)
    const atmosphereMaterial = new THREE.ShaderMaterial({
        vertexShader: vertexAtmosphereS,
        fragmentShader: fragAtmosphereS,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide
    })

    const starMesh = new THREE.Mesh(starGeometry, starMaterial)
    const starAtmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial)

    const star = new THREE.Object3D()
    star.add(starMesh)
    star.add(starAtmosphere)

    return star
}
const createRingedBodyMesh = (radius, planetTextureSource, ringTextureSource, planetRotation, ringInnerRadius, ringOuterRadius, ringColor) =>
{
    var planetTexture = textureLoader.load('/textures/'+planetTextureSource)
    var planetGeometry = new THREE.SphereGeometry(radius, 32, 32)
    var planetMaterial = new THREE.MeshStandardMaterial({
        map: planetTexture
    })
    var planet = new THREE.Mesh(planetGeometry, planetMaterial)

    var ringTexture = textureLoader.load('/textures/'+ringTextureSource)
    var ringGeometry = new THREE.RingGeometry(ringInnerRadius, ringOuterRadius, 32)
    var ringMaterial = new THREE.MeshStandardMaterial({
        map: ringTexture, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: .9,
        color: ringColor
    })
    var ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = - Math.PI * .5

    var mesh = new THREE.Group()
    mesh.add(planet, ring)
    mesh.rotation.order = 'ZYX'
    mesh.rotation.z = planetRotation
    return mesh
}
const createSkyBox = (skyBoxSource) =>
{
    var skyBoxTexture = textureLoader.load("/textures/"+skyBoxSource)
    var skyBoxMaterial = new THREE.MeshBasicMaterial({map: skyBoxTexture, side: THREE.BackSide})
    var skyBoxGeometry = new THREE.SphereGeometry(10000, 64, 64)
    return new THREE.Mesh(skyBoxGeometry, skyBoxMaterial)
}
/**
 * Sky Box
 */
const skyBox = createSkyBox('skyBox.png')
scene.add(skyBox)

/**
 * Body Meshes
 */
// Sun
// const sun = createStarMesh(sunRadius, 'sun.jpg', '#FEC829', .75)
const sun = createStarMesh(sunRadius, 'sun.jpg', '#FEC829');
scene.add(sun)
// Mercury
const mercury = createBodyMesh(mercuryRadius, 'mercury.jpg', '#d4b353')
// Venus
const venus = createBodyMesh(venusRadius, 'venus.jpg', '#fcc52b')
// Earth
const earth = createBodyMesh(earthRadius, 'earth.jpg', '#4C99FF')
scene.add(earth)
// Earth's Moon
const moon = createBodyMesh(moonRadius, 'moon.jpg')
// Mars
const mars = createBodyMesh(marsRadius, 'mars.jpg', '#ff977d')
// Jupiter
const jupiter = createBodyMesh(jupiterRadius, 'jupiter.jpg', '#ffad08')
// Saturn
const saturnPlanetRotation = (25/180) * Math.PI
const saturn = createRingedBodyMesh(saturnRadius, 'saturnBody.jpg', 'saturnRing.png', saturnPlanetRotation, 1, 3, null) // 0xc7a34e
// Uranus
const uranusPlanetRotation = (92/180) * Math.PI
const uranus = createRingedBodyMesh(uranusRadius, 'uranusBody.jpg', 'uranusRing.png', uranusPlanetRotation, 1, 2.1, 0xb3fffd)
// Neptune
const neptune = createBodyMesh(neptuneRadius, 'neptune.jpg', '#2986ff')
// Pluto
const pluto = createBodyMesh(plutoRadius, 'pluto.jpg', '#8492a3')

// Alpha Centauri A
const alphaCentauriA = createStarMesh(alphaCentauriARadius, 'alphaA.jpg', '#ffeb0a', .75)
// Alpha Centauri B
const alphaCentauriB = createStarMesh(alphaCentauriBRadius, 'alphaB.jpg', '#f78605', .85)
// Proxima Centauri
const proximaCentauri = createStarMesh(proximaCentauriRadius, 'proxima.jpg', '#ff0000', .75)
// Proxima Centauri B
const proximaCentauriB = createBodyMesh(proximaCentauriBRadius, 'proximaB.jpg')
// Proxima Centauri C
const proximaCentauriC = createBodyMesh(proximaCentauriCRadius, 'proximaC.jpg')

/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
scene.add(ambientLight)

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 1e-5, 20000)
camera.position.set(20, 10, 20)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
// const controls = new TrackballControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/** 
 * Classes
 */
class Body
{
    name; // default parameters?
    x;
    y;
    z;
    vx;
    vy;
    vz;
    mesh;
    mass;
    radius;
    radiusMod = 1;
    velocityMod = 1;
    rotation;
    trail = [];
    defaultObject;
    currentTrailLength = defaultTrailLength;
    previousTrailLength = defaultTrailLength + 1;
    trailMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
    folder;
   
    constructor(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation)
    {
        this.name = name;
        this.x = x;
        this.y = y;
        this.z = z;
        this.vx = vx;
        this.vy = vy;
        this.vz = vz;
        this.mesh = mesh;
        this.mass = mass;
        this.radius = radius;
        this.rotation = rotation;

        this.defaultObject = 
        {
            x: this.x,
            y: this.y,
            z: this.z,
            vx: this.vx,
            vy: this.vy,
            vz: this.vz,
            mass: this.mass
        }
    }

    camera = () =>
    {
        parameters.cameraTargetObject = this
        parameters.timeToAnimateCamera = true
        // camera.position.set(this.mesh.position.x + this.radius, this.mesh.position.y + this.radius, this.mesh.position.z + this.radius)
    }

    updateTrail = () =>
    {
        if(this.previousTrailLength >= this.currentTrailLength)
        {
            this.trail = this.trail.splice(-this.previousTrailLength)
        }
        if(this.trail.length > this.currentTrailLength)
        {
            this.trail.shift()
        }
        this.trail.push(new THREE.Vector3(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z))
    }

    updatePreviousTrailLength = () =>
    {
        this.previousTrailLength = this.currentTrailLength
    }
}

class Star extends Body
{
    luminosity;
    pointLight;

    constructor(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation, luminosity, pointLightIntensity)
    {
        super(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation);
        this.luminosity = luminosity;
        this.defaultObject.luminosity = this.luminosity;
        const pointLight = new THREE.PointLight(this.mesh.emissive, pointLightIntensity, 100);
        this.pointLight = pointLight;
        scene.add(pointLight);
    }
    updateMass = () =>
    {
        this.mass = this.defaultObject.mass * Math.pow(Math.log(this.luminosity / this.defaultObject.luminosity), 2/7)
        this.mesh.material.emissiveIntensity = (Math.log(this.luminosity / this.defaultObject.luminosity) + 4)/5
    }
    updateEmissiveLuminosity = () =>
    {
        this.luminosity = this.defaultObject.luminosity * Math.pow(this.mass / this.defaultObject.mass, 3.5)
        this.mesh.material.emissiveIntensity = Math.abs(Math.log(this.luminosity / this.defaultObject.luminosity) + 4)/5
    }
    updatePointLight = () =>
    {
        this.pointLight.position.set(this.mesh.position.x, this.mesh.position.y, this.mesh.position.z)
    }
}

class Planet extends Body
{
    albedo; // visible light reflected
    emissivity; // infrared light emitted
    
    constructor(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation, albedo, emissivity)
    {
        super(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation);
        this.albedo = albedo;
        this.emissivity = emissivity;
    }

}

const getDistance = (body_1, body_2) =>
{        
    return Math.pow(
        Math.pow(body_1.x - body_2.x, 2)
        + Math.pow(body_1.y - body_2.y, 2)
        + Math.pow(body_1.z - body_2.z, 2), 1/2.0)
}


/**
 * Planet Objects as Classes
 */
const sunObject = new Star('Sun', sunOrbitalDistance, 0, 0, 0, 0, sunOrbitalVelocity, sun, sunMass, sunRadius, sunRotation, sunLuminosity, 1.75);
const earthObject = new Planet('Earth', earthOrbitalDistance, 0, 0, 0, 0, earthOrbitalVelocity, earth, earthMass, earthRadius, earthRotation, earthAlbedo, earthEmissivity);
const mercuryObject = new Planet('Mercury', mercuryOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, mercuryOrbitalVelocity, mercury, mercuryMass, mercuryRadius, mercuryRotation, mercuryAlbedo, mercuryEmissivity);
const venusObject = new Planet('Venus', venusOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, venusOrbitalVelocity, venus, venusMass, venusRadius, venusRotation, venusAlbedo, venusEmissivity);
// const moonObject = new Planet('Moon', AU, 2 * Math.pow(10, 7), 3.844 * Math.pow(10, 8), 0, -1000, -29783, moon, moonMass, moonRadius, moonRotation, moonAlbedo, moonEmissivity);
const marsObject = new Planet('Mars', marsOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, marsOrbitalVelocity, mars, marsMass, marsRadius, marsRotation, marsAlbedo, marsEmissivity);
const jupiterObject = new Planet('Jupiter', jupiterOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, jupiterOrbitalVelocity, jupiter, jupiterMass, jupiterRadius, jupiterRotation, jupiterAlbedo, jupiterEmissivity);
const saturnObject = new Planet('Saturn', saturnOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, saturnOrbitalVelocity, saturn, saturnMass, saturnRadius, saturnRotation, saturnAlbedo, saturnEmissivity);
const uranusObject = new Planet('Uranus', uranusOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, uranusOrbitalVelocity, uranus, uranusMass, uranusRadius, uranusRotation, uranusAlbedo, uranusEmissivity);
const neptuneObject = new Planet('Neptune', neptuneOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, neptuneOrbitalVelocity, neptune, neptuneMass, neptuneRadius, neptuneRotation, neptuneAlbedo, neptuneEmissivity);
const plutoObject = new Planet('Pluto', plutoOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, plutoOrbitalVelocity, pluto, plutoMass, plutoRadius, plutoRotation, plutoAlbedo, plutoEmissivity);
const alphaCentauriAObject = new Star('Alpha Centauri A', alphaCentauriAOrbitalDistance, 0, 0, 0, 0, alphaCentauriAOrbitalVelocity, alphaCentauriA, alphaCentauriAMass, alphaCentauriARadius, alphaCentauriARotation, alphaCentauriALuminosity, alphaCentauriAPointLightIntensity);
const alphaCentauriBObject = new Star('Alpha Centauri B', alphaCentauriBOribtalDistance, 0, 0, 0, 0, alphaCentauriBOrbitalVelocity, alphaCentauriB, alphaCentauriBMass, alphaCentauriBRadius, alphaCentauriBRotation, alphaCentauriBLuminosity, alphaCentauriBPointLightIntensity);
const proximaCentauriObject = new Star('Proxima Centauri', proximaCentauriOrbitalDistance, 0, 0, 0, 0, proximaCentauriOrbitalVelocity, proximaCentauri, proximaCentauriMass, proximaCentauriRadius, proximaCentauriRotation, proximaCentauriLuminosity, proximaCentauriPointLightIntensity);
const proximaCentauriBObject = new Planet('Proxima Centauri B', proximaCentauriBOrbitalDistance, 0, 0, 0, 0, proximaCentauriBOrbitalVelocity, proximaCentauriB, proximaCentauriBMass, proximaCentauriBRadius, proximaCentauriBRotation, proximaCentauriBAlbedo, proximaCentauriBEmissivity);
const proximaCentauriCObject = new Planet('Proxima Centauri C', proximaCentauriCOrbitalDistance, 0, 0, 0, 0, proximaCentauriCOrbitalVelocity, proximaCentauriC, proximaCentauriCMass, proximaCentauriCRadius, proximaCentauriCRotation, proximaCentauriCAlbedo, proximaCentauriCEmissivity);

const planetsToAdd = 
{
    "Mercury": mercuryObject,
    "Venus": venusObject,
    "Earth": earthObject,
    "Mars": marsObject,
    "Jupiter": jupiterObject,
    // "Saturn": saturnObject,
    // "Uranus": uranusObject,
    "Neptune": neptuneObject,
    "Pluto": plutoObject,
    "Proxima Centauri B": proximaCentauriBObject,
    "Proxima Centauri C": proximaCentauriCObject
}

const planets = 
[
    sunObject,
    earthObject
]

const updateRotations = () =>
{
    for(const planet of planets)
    {
        planet.mesh.rotation.y += planet.rotation * (parameters.timeStep / 600000)
    }
}
const updateRadii = () =>
{
    let ratio = defaultScaleFactor/parameters.scaleFactor

    for(const planet of planets)
    {
        planet.mesh.scale.setScalar(ratio * planet.radius * planet.radiusMod * parameters.radiusMod)
    }
}
const updatePlanets = () =>
{
        for(const planetA of planets)
        {
            let nextVX = 0
            let nextVY = 0
            let nextVZ = 0
        
            for(const planetB of planets)
            {
                if(planetA != planetB)
                {
                    const sameBaseDistanceDenominator = 
                        Math.pow(planetA.x - planetB.x, 2)
                        + Math.pow(planetA.y - planetB.y, 2)
                        + Math.pow(planetA.z - planetB.z, 2)

                    const distance = Math.pow(
                        sameBaseDistanceDenominator, 1/2.0)
                    const denominator = Math.pow(
                        sameBaseDistanceDenominator, 3/2.0)

                    const G = gravitationConstant * Math.pow((AU/distance), parameters.gravitationalN)
                    
                    if(planetB.mass >= sunMass*.1 || distance <= .5*AU)
                    {
                        nextVX += (G * planetB.mass * (planetA.x - planetB.x)
                        * parameters.timeStep) / denominator
                        nextVY += (G * planetB.mass * (planetA.y - planetB.y)
                        * parameters.timeStep) / denominator
                        nextVZ += (G * planetB.mass * (planetA.z - planetB.z)
                        * parameters.timeStep) / denominator
                    }
                }
            }

            planetA.vx += nextVX
            planetA.vy += nextVY
            planetA.vz += nextVZ

            planetA.x += planetA.vx * parameters.timeStep
            planetA.y += planetA.vy * parameters.timeStep
            planetA.z += planetA.vz * parameters.timeStep

            planetA.mesh.position.x = planetA.x / parameters.scaleFactor
            planetA.mesh.position.y = planetA.y / parameters.scaleFactor
            planetA.mesh.position.z = planetA.z / parameters.scaleFactor
        }
}
const updateCamera = () =>
{
    gsap.to(camera.position,{
        x: parameters.cameraTargetObject.mesh.position.x + 2*parameters.cameraTargetObject.radius,
        y: parameters.cameraTargetObject.mesh.position.y + 2*parameters.cameraTargetObject.radius, 
        z: parameters.cameraTargetObject.mesh.position.z + 2*parameters.cameraTargetObject.radius,
        duration: 2,
        ease: "power2.out",
    })
    
    if(parameters.pauseState)
    {
        controls.target = parameters.cameraTargetObject.mesh.position
    }
    else
    {
        gsap.to(controls.target, {
            x: parameters.cameraTargetObject.mesh.position.x,
            y: parameters.cameraTargetObject.mesh.position.y,
            z: parameters.cameraTargetObject.mesh.position.z,
            ease: "power2.out", // Adjust the easing function here
            onComplete: () => {
                controls.target = parameters.cameraTargetObject.mesh.position
            }
        });
    }

    parameters.timeToAnimateCamera = false
}
const updateCameraLock = () =>
{
    if(parameters.lockCamera)
    {
        camera.position.set(
            controls.target.x + 2*parameters.cameraTargetObject.radius, 
            controls.target.y + 2*parameters.cameraTargetObject.radius, 
            controls.target.z + 2*parameters.cameraTargetObject.radius,)
    }
}
const updatePointLights = () =>
{
    for(const body of planets)
    {
        if(body instanceof Star)
        {
            body.updatePointLight()
        }
    }
}
const updateSkyBox = () =>
{
    if(skyBox.visible)
        skyBox.position.set(camera.position.x, camera.position.y, camera.position.z)
}

/**
 * Trails
 */
let trailHolder = []

const updateTrails = () =>
{
    if(trailHolder.length > 0)
    {
        for(var i = 0; i < trailHolder.length; i++)
        {
            scene.remove(trailHolder[i])
        }
        trailHolder = []
    }
    for(const planet of planets)
    {
        if(!parameters.pauseState)
            planet.updateTrail()
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(planet.trail);
        const trailMesh = new THREE.Line(trailGeometry, planet.trailMaterial);
        trailHolder.push(trailMesh)
        if(parameters.showTrails)
            scene.add(trailMesh);
    }
}
const resetTrails = () =>
{
    for(const planet of planets)
    {
        planet.trail = []
    }
    if(parameters.pauseState)
    {
        updateTrails()
    }
}
const resetSimulation = () =>
{
    for(const body of planets)
    {
        body.x = body.defaultObject.x
        body.y = body.defaultObject.y
        body.z = body.defaultObject.z
        body.vx = body.defaultObject.vx
        body.vy = body.defaultObject.vy
        body.vz = body.defaultObject.vz
        body.mesh.position.x = body.x / parameters.scaleFactor
        body.mesh.position.y = body.y / parameters.scaleFactor
        body.mesh.position.z = body.z / parameters.scaleFactor
        body.mesh.rotation.y = 0
        if(body instanceof Star)
        {
            body.luminosity = body.defaultObject.luminosity
        }
        
    }
    resetTrails()
}

/**
 * Temperature
 */
const calculateTemperature = (planet, star) =>
{
    const distance = getDistance(planet, star)

    let temp = Math.pow((star.luminosity*(1-planet.albedo))/(16*Math.PI*stephen_boltzmann*planet.emissivity*Math.pow(distance, 2)), 1/4)

    temp -= 273.15
    temp *= 9/5.0
    temp += 32 // Freedom units
    return temp;
}
const calculateTemperatureMultiStar = (planet) =>
{
    var lumRadiusSqSum = 0;
    for(var body of planets)
    {
        if(body instanceof Star)
        {
            var distance = getDistance(planet, body)
            lumRadiusSqSum += body.luminosity / Math.pow(distance, 2)
        }
    }
    let temp = Math.pow(((1-planet.albedo)*lumRadiusSqSum)/(16*Math.PI*stephen_boltzmann*planet.emissivity), 1/4)

    temp -= 273.15
    temp *= 9/5.0
    temp += 32 // Freedom units
    return temp;
}

/**
 * GUI
 */
const bodiesFolder = gui.addFolder("Planets and Stars").close()
const cameraViews = gui.addFolder('Camera Views').close()
const trailOptions = gui.addFolder('Trail Options').close()
const settingsFolder = gui.addFolder("Settings").close()
const createPlanetGui = (planet) =>
{
    const planetFolder = bodiesFolder.addFolder(planet.name)
    planet.folder = planetFolder
    planetFolder.close()
    planetFolder.add(planet, 'camera').name(planet.name+" Camera")
    planetFolder.add(planet, 'albedo').min(.01).max(.99).step(.01).name(planet.name+" Albedo")
    planetFolder.add(planet, 'emissivity').min(.01).max(.99).step(.01).name(planet.name+" Emissivity")
    planetFolder.add(planet, 'radiusMod').min(.1).max(4).step(.1).name(planet.name+" Scale")
    planetFolder.add(planet, 'currentTrailLength').min(0).max(2500).step(10)
        .name(planet.name + " Trail Length").onFinishChange(planet.updatePreviousTrailLength)
    planetFolder.addColor(planet.trailMaterial, 'color').name(planet.name+" Trail Color")
    
}
const createStarGui = (star) =>
{
    const starFolder = bodiesFolder.addFolder(star.name)
    star.folder = starFolder
    starFolder.close()
    starFolder.add(star, 'camera').name(star.name+" Camera")
    starFolder.add(star, 'luminosity').min(1*star.luminosity).max(20*star.luminosity)
        .step(100000).onFinishChange(star.updateMass).name(star.name+' Lumonosity')
    starFolder.add(star, 'mass').min(.05*star.defaultObject.mass).max(8*star.defaultObject.mass)
        .step(100000).onFinishChange(star.updateEmissiveLuminosity).name(star.name+' Mass')
    starFolder.add(star, 'radiusMod').min(.1).max(100).step(.1).name(star.name+" Scale")
    starFolder.add(star, 'currentTrailLength').min(0).max(2500).step(10)
        .name(star.name + " Trail Length").onFinishChange(star.updatePreviousTrailLength)
    starFolder.addColor(star.trailMaterial, 'color').name(star.name+" Trail Color")
}
const setupCameraViews = () =>
{
    cameraViews.add(parameters, 'lockCamera').name('Lock Camera')
    for(const planet of planets)
    {
        cameraViews.add(planet, 'camera').name(planet.name)
    }
}
const deleteCameraView = (body) =>
{
    for(const controller of cameraViews.controllers)
    {
        if(controller._name == (body.name))
        {
            controller.destroy()
        }
    }
}
const setupTrailOptions = () =>
{
    trailOptions.add(parameters, 'showTrails').name('Show Trails').onFinishChange(updateTrails).onFinishChange(resetTrails)
    for(const planet of planets)
    {
        trailOptions.add(planet, 'currentTrailLength').min(0).max(2500).step(10)
        .name(planet.name + " Trail Length").onFinishChange(planet.updatePreviousTrailLength)
    }
}
const deleteTrailOption = (body) =>
{
    for(const controller of trailOptions.controllers)
    {
        if(controller._name == (body.name + " Trail Length"))
        {
            controller.destroy()
        }
    }
}
const createNewPlanetGui = (newPlanetObject) =>
{
    createPlanetGui(newPlanetObject)

    newPlanetObject.folder.add(newPlanetObject, "mass").min(100).max(2 * sunMass).step(100000).name(newPlanetObject.name+" Mass")
    newPlanetObject.folder.add(newPlanetObject.defaultObject, "x").min(.1).max(10*AU).step(1).name(newPlanetObject.name+ " Initial X").onFinishChange(resetSimulation)
    newPlanetObject.folder.add(newPlanetObject.defaultObject, "vz").min(-100000).max(100000).step(1000).name(newPlanetObject.name+ " Initial VZ").onFinishChange(resetSimulation)
    newPlanetObject.folder.add(newPlanetObject, "velocityMod").min(.25).max(1.75).step(.25).name("Velocity Multiplier")
    newPlanetObject.folder.add(newPlanetObject, "updateVelocity").name("Update Velocity")
    newPlanetObject.folder.add(newPlanetObject, "changeName").name("Change Name")
    newPlanetObject.folder.add(newPlanetObject, "delete").name("Delete "+ newPlanetObject.name)

    cameraViews.add(newPlanetObject, 'camera').name(newPlanetObject.name).onFinishChange(updateCamera)
    trailOptions.add(newPlanetObject, 'currentTrailLength').min(0).max(2500).step(10)
        .name(newPlanetObject.name + " Trail Length").onFinishChange(newPlanetObject.updatePreviousTrailLength)
}
const createNewRandomPlanetGui = (newPlanetObject) =>
{
    createPlanetGui(newPlanetObject)

    newPlanetObject.folder.add(newPlanetObject, "mass").min(100).max(2 * sunMass).step(100000).name(newPlanetObject.name+" Mass")
    newPlanetObject.folder.add(newPlanetObject.defaultObject, "x").min(.1).max(10*AU).step(1).name(newPlanetObject.name+ " Initial X").onFinishChange(resetSimulation)
    newPlanetObject.folder.add(newPlanetObject.defaultObject, "vz").min(-100000).max(100000).step(1000).name(newPlanetObject.name+ " Initial VZ").onFinishChange(resetSimulation)
    newPlanetObject.folder.add(newPlanetObject, "velocityMod").min(.25).max(1.75).step(.25).name("Velocity Multiplier")
    newPlanetObject.folder.add(newPlanetObject, "updateVelocity").name("Update Velocity")
    // Difference is this uses THREE.js default mesh objects in order to allow for dynimcally changing textures
    // NO SHADERS for now
    newPlanetObject.folder.add(newPlanetObject.mesh.material, "map", textures).name("Texture").onChange(() => {newPlanetObject.mesh.material.needsUpdate = true})
    newPlanetObject.folder.addColor(newPlanetObject.mesh.material, "color").name(newPlanetObject.name+ " Color")
    newPlanetObject.folder.add(newPlanetObject, "changeName").name("Change Name")
    newPlanetObject.folder.add(newPlanetObject, "delete").name("Delete "+ newPlanetObject.name)

    cameraViews.add(newPlanetObject, 'camera').name(newPlanetObject.name).onFinishChange(updateCamera)
    trailOptions.add(newPlanetObject, 'currentTrailLength').min(0).max(2500).step(10)
        .name(newPlanetObject.name + " Trail Length").onFinishChange(newPlanetObject.updatePreviousTrailLength)
}
const setupGui = () =>
{
    settingsFolder.add(parameters, 'timeStep').min(100).max(50000).step(10).name('Time Step')
    settingsFolder.add(parameters, 'scaleFactor').min(defaultScaleFactor / 20).max(5 * defaultScaleFactor).step(10)
        .onChange(updateRadii).onChange(resetTrails).onChange(updatePlanets).name("Zoom")
    settingsFolder.add(parameters, 'scaleWithZoom').name('Scale with Zoom')
    settingsFolder.add(parameters, "systemVelocityY").min(-100000).max(100000).step(500).name("System Velocity").onChange(() => {for(const p of planets){p.vy = parameters.systemVelocityY}})
    settingsFolder.add(parameters, "radiusMod").min(1).max(10000).step(1).name("System Scale")


    for(const body of planets)
    {
        if(body instanceof Star)
        {
            createStarGui(body)
        }
        else if(body instanceof Planet)
        {
            createPlanetGui(body)
        }
    }

    setupCameraViews()
    setupTrailOptions()

    parameters.reset = resetSimulation
    gui.add(parameters, 'reset').name('Reset')
    // gui.add(parameters, 'pauseState').name('Pause / Play')
}
setupGui()

window.addEventListener('keydown', (event) => 
{
    if(event.key == " ") // play/pause with space bar
    {
        if(!parameters.pauseState)
            {parameters.pauseState = true
            parameters.cameraTargetObject = null}
        else
            parameters.pauseState = false
    }
    if(event.key == 'r') // reset simulation with r key
    {
        resetSimulation()
    }
    if(event.key == 'x') // toggle axes helper with x key
    {
        if(!axesHelper.visible)
            axesHelper.visible = true
        else
            axesHelper.visible = false
    }
    if(event.key == 'v') // toggle floor plane with v key
    {
        if(!plane.visible)
            plane.visible = true
        else
            plane.visible = false
    }
    if(event.key == 'l')
    {
        if(!parameters.lockCamera)
            parameters.lockCamera = true
        else
            parameters.lockCamera = false
    }
    if(event.key == 't')
    {
        if(!parameters.showTrails)
            parameters.showTrails = true
        else
            parameters.showTrails = false
    }
})


/**
 * Text Overlay using HTML Document 
 */
let earthTempText = document.createElement('span')
controlsDivElement.appendChild(earthTempText)
/**
 * Attempt to place text over planets
 */
// let base = new THREE.Vector3(0, 0, 0)
// let coords_1 = base.applyMatrix4(earth.modelViewMatrix)
// let coords_2 = coords_1.applyMatrix4(camera.matrixWorldInverse)
// console.log(coords_2);

/**
 * Create New Customizable Planet
 */
function newPlanetFeatures(planetObject)
{
    planetObject.index = planets.length
    planetObject.radialVelocityMod = 1
    planetObject.span = document.createElement('span')
    planetObject.span.innerText = "\n"+planetObject.name+": "
    controlsDivElement.appendChild(planetObject.span)
    
    planetObject.delete = () =>
    {
        controlsDivElement.removeChild(planetObject.span)
        planets.splice(planetObject.index, 1)
        planetObject.trails = []
        planetObject.folder.destroy()
        scene.remove(planetObject.mesh)
        deleteCameraView(planetObject)
        deleteTrailOption(planetObject)
        parameters.cameraTargetObject = sunObject
    }
    planetObject.changeName = () =>
    {
        deleteCameraView(planetObject)
        deleteTrailOption(planetObject)
        planetObject.folder.destroy()
        let planetName = prompt("Enter a new name: ")
        if(planetName.trim() != "")
            planetObject.name = planetName
        createNewPlanetGui(planetObject)
        planetObject.folder.open()
    }
    planetObject.updateVelocity = () =>
    {
        planetObject.vx = planetObject.velocityMod * planetObject.vx
        planetObject.vy = planetObject.velocityMod * planetObject.vy
        planetObject.vz = planetObject.velocityMod * planetObject.vz
    }

}
const addBody = (bodyObject) =>
{
    if(!planets.includes(bodyObject))
    {
        newPlanetFeatures(bodyObject)
        if(planetsToAdd.hasOwnProperty(bodyObject.name))
            createNewPlanetGui(bodyObject)
        else
            createNewRandomPlanetGui(bodyObject)
        // FIXME -> be able to change distance from sun dynamically mid orbit!
        scene.add(bodyObject.mesh)
        planets.push(bodyObject)
        bodiesFolder.open()
        bodyObject.folder.open()
        updatePlanets()
        bodyObject.camera()
    }
}

let numberOfAddedPlanets = 0
const createRandomEarthLikePlanet = () =>
{
    var defaultMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshStandardMaterial({color:0xffffff * Math.random()}))
    var defaultOrbitalDistance = 3 * AU * Math.random() + .5 * AU
    var defaultOrbitalVelocity = -27500 * AU / defaultOrbitalDistance
    var defaultMass = 4 * earthMass * Math.random() + .25 * earthMass
    var defaultRadius = defaultOrbitalDistance / 1.5 / AU
    var defaultRotation = Math.PI * 2 * Math.random()
    var defaultAlbedo = Math.random();
    var defaultEmissivity = Math.random();
    var newPlanetMesh = defaultMesh
    scene.add(newPlanetMesh)
    let newPlanetName = prompt("Enter New Planet's Name: ")
    if(newPlanetName == "")
    {
        numberOfAddedPlanets += 1
        newPlanetName = "New Planet "+numberOfAddedPlanets
    }
    const newPlanetObject = new Planet(newPlanetName, defaultOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, defaultOrbitalVelocity, newPlanetMesh, defaultMass, defaultRadius, defaultRotation, defaultAlbedo, defaultEmissivity)
    newPlanetObject.trailMaterial.color = defaultMesh.material.color.clone()

    addBody(newPlanetObject)
}

const reverseTime = () =>
{
    parameters.timeStep *= -1
}

parameters.planetToAdd = null
parameters.createNewPlanet = createRandomEarthLikePlanet
parameters.reverseTime = reverseTime
parameters.cameraTargetObject = sunObject
parameters.timeToAnimateCamera = true


gui.add(parameters, 'reverseTime').name("Reverse Time")
gui.add(parameters, "planetToAdd", planetsToAdd).name("Add Planet: ").onFinishChange(() => {addBody(parameters.planetToAdd)})
gui.add(parameters, "createNewPlanet").name("Add Random Rocky Planet!")

const updateTemperatureText = () =>
{
    for(const body of planets)
    {
        if(body instanceof Planet && body != earthObject)
        {
            body.span.innerText = "\n"+body.name+": "+parseFloat(calculateTemperature(body, sunObject)).toFixed(2) 
        }
    }
}

const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const timer = new THREE.Clock()
    const startTime = timer.getElapsedTime()
    if(!parameters.pauseState)
    {
        // Update Planets
        updatePlanets()
        // Rotations
        updateRotations()
        // Trails
        updateTrails()
        // Star Point Lights
        updatePointLights()
        // Temperature
        updateTemperatureText()
    }
    if(parameters.scaleWithZoom)
        updateRadii()
    
    // Update controls
    controls.update()

    // Camera
    if(parameters.timeToAnimateCamera)
        updateCamera()
    if(parameters.lockCamera)
        updateCameraLock()

    // Render
    renderer.render(scene, camera)

    const endTime = timer.getElapsedTime()
    const drawTime = endTime - startTime

    // if(Math.round(elapsedTime) % 2 == 0)
    //     console.log(Math.round(drawTime * 1000000) + " µs");

    let earthTemp = calculateTemperature(earthObject, sunObject);    
    earthTempText.innerText = "\nEarth: "+ parseFloat(earthTemp).toFixed(2)
        
    window.requestAnimationFrame(tick)
}
tick()