import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import * as dat from 'lil-gui'
import { ClampToEdgeWrapping, GeometryUtils } from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'


/**
 * Parameters
 */
const defaultScaleFactor = Math.pow(10, 10) // 10^9 is good too with use of camera views
const AU = 1.5 * Math.pow(10, 11)
const parameters = {
    timeStep: 4320, // 60 -> 1 Simulation hour per 1 Actual second (4320 -> 3 days / 1 second)
    scaleFactor: defaultScaleFactor,
    gravitationalN: 0
}
let timeStep = parameters.timeStep
const defaultTimeStep = parameters.timeStep
let scaleFactor = parameters.scaleFactor
let pauseState = true


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

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const matcapTexture = textureLoader.load('/textures/matcaps/3.png')
const sunTexture = textureLoader.load('/textures/sun.jpg')
const earthTexture = textureLoader.load('/textures/earth.jpg')
const moonTexture = textureLoader.load('/textures/moon.jpg')
const mercuryTexture = textureLoader.load('/textures/mercury.jpg')
const venusTexture = textureLoader.load('/textures/venus.jpg')
const marsTexture = textureLoader.load('/textures/mars.jpg')
const jupiterTexture = textureLoader.load('/textures/jupiter.jpg')
const saturnBodyTexture = textureLoader.load('/textures/saturnBody.jpg')
const saturnRingTexture = textureLoader.load('/textures/saturnRing.png')
const uranusBodyTexture = textureLoader.load('/textures/uranusBody.jpg')
const uranusRingTexture = textureLoader.load('/textures/saturnRing.png')

const radiusMod = 1.5
let sunRadius = .95 * radiusMod
let mercuryRadius = .30 * radiusMod
let venusRadius = .50 * radiusMod
let earthRadius = .50 * radiusMod
let moonRadius = .20 * radiusMod
let marsRadius = .35 * radiusMod
let jupiterRadius = .9 * radiusMod
let saturnRadius = .85 * radiusMod
let uranusRadius = .65 * radiusMod


/**
 * Default Planet Values for Reset
 */
const sunDefaultObject = 
{
    xPosition: 0,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: 0,
    mass: 1.989 * Math.pow(10, 30),
    radius: sunRadius
}
const mercuryDefaultObject = 
{
    xPosition: .4 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -47000,
    mass: 3.25 * Math.pow(10, 23),
    radius: mercuryRadius
}
const venusDefaultObject = 
{
    xPosition: .7 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: 35020,
    mass: 4.867 * Math.pow(10, 24),
    radius: venusRadius
}
const earthDefaultObject = 
{
    xPosition: AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,//29783 * Math.sin(.8),
    zVelocity: -29783,// * Math.cos(.8),
    mass: 5.972 * Math.pow(10, 24),
    radius: earthRadius
}
const moonDefaultObject = 
{
    xPosition: AU,
    yPosition: 2 * Math.pow(10, 7),
    zPosition: 3.844 * Math.pow(10, 8),
    xVelocity: 0,
    yVelocity: -1000,
    zVelocity: -29783,
    mass: 7.347 * Math.pow(10, 22),
    radius: moonRadius
}
const marsDefaultObject = 
{
    xPosition: 1.5 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -24077,
    mass: 6.39 * Math.pow(10, 23),
    radius: marsRadius
}
const jupiterDefaultObject = 
{
    xPosition: 5.2 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -13070,
    mass: 1.898 * Math.pow(10, 27),
    radius: marsRadius
}
const saturnDefaultObject = 
{
    xPosition: 9.5 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -9690,
    mass: 5.683 * Math.pow(10, 26),
    radius: saturnRadius
}
const uranusDefaultObject = 
{
    xPosition: 19.8 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -6810,
    mass: 8.681 * Math.pow(10, 25),
    radius: uranusRadius
}
/**
 * Particles
 */
// Geometry
const particlesGeometry = new THREE.BufferGeometry()
const count = 20000
const positions = new Float32Array(count * 3)
const colors = new Float32Array(count * 3)

for(var i = 0; i < count * 3; i ++)
{
    let distance = Math.floor((Math.random()) * (4000))
    let mod = Math.random() < .5 ? -1 : 1
    positions[i] = mod * distance
    colors[i] = Math.random() * 10
}
particlesGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positions, 3)
)
particlesGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(colors, 3)
)
// Material
const particlesMaterial = new THREE.PointsMaterial({
    size: .1,
    sizeAttenuation: true, 
    color: 0xff88cc,
    // alphaTest: .001, // kind of fix alpha problem
    // depthTest: false, // draw everything regardless of order
    depthWrite: false, // best fix for ordered rendering with particles
    blending: THREE.AdditiveBlending, // brightness of particles stacks
    transparent: true,
    vertexColors: true // tell the material we are using a color buffer attribute
})
// Points
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)


/**
 * Plane
 */
const planeGeometry = new THREE.PlaneGeometry(500, 500, 300, 300)
const planeMaterial = new THREE.MeshBasicMaterial(
{
    color:0xffffff, 
    wireframe: true,
    transparent: true,
    opacity: .1
})
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = - Math.PI / 2
scene.add(plane)
plane.visible =  false
gui.add(plane, 'visible').name('Wireframe Plane')

/**
 * Helper Axis
 */
const axesHelper = new THREE.AxesHelper(25)
scene.add(axesHelper)
axesHelper.visible = false
gui.add(axesHelper, 'visible').name('AxesHelper')

/**
 * Planet Meshes
 */
// Sun
const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32)
const sunMaterial = new THREE.MeshStandardMaterial({
    map: sunTexture,
    emissive: '#FEC829'
})
const sun = new THREE.Mesh(sunGeometry, sunMaterial)
scene.add(sun)

// Mercury
const mercuryGeometry = new THREE.SphereGeometry(mercuryRadius, 32, 32)
const mercuryMaterial = new THREE.MeshStandardMaterial({
    map: mercuryTexture
})
const mercury = new THREE.Mesh(mercuryGeometry, mercuryMaterial)
scene.add(mercury)

// Venus
const venusGeometry = new THREE.SphereGeometry(venusRadius, 32, 32)
const venusMaterial = new THREE.MeshStandardMaterial({
    map: venusTexture
})
const venus = new THREE.Mesh(venusGeometry, venusMaterial)
scene.add(venus)

// Earth
const earthGeometry = new THREE.SphereGeometry(earthRadius, 32, 32)
const earthMaterial = new THREE.MeshStandardMaterial({
    map: earthTexture,
})
const earth = new THREE.Mesh(earthGeometry, earthMaterial)
scene.add(earth)


// Earth's Moon
const moonGeometry = new THREE.SphereGeometry(moonRadius, 16, 16)
const moonMaterial = new THREE.MeshStandardMaterial({
    map: moonTexture
})
const moon = new THREE.Mesh(moonGeometry, moonMaterial)
scene.add(moon)

// Mars
const marsGeometry = new THREE.SphereGeometry(marsRadius, 32, 32)
const marsMaterial = new THREE.MeshStandardMaterial({
    map: marsTexture
})
const mars = new THREE.Mesh(marsGeometry, marsMaterial)
scene.add(mars)

// Jupiter
const jupiterGeometry = new THREE.SphereGeometry(.9, 32, 32)
const jupiterMaterial = new THREE.MeshStandardMaterial({
    map: jupiterTexture
})
const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial)
scene.add(jupiter)

// Saturn
const saturnBodyGeometry = new THREE.SphereGeometry(saturnRadius, 32, 32)
const saturnBodyMaterial = new THREE.MeshStandardMaterial({
    map: saturnBodyTexture
})
const saturnBody = new THREE.Mesh(saturnBodyGeometry, saturnBodyMaterial)

const saturnRingGeometry = new THREE.RingGeometry(1, 3, 32)
const saturnRingMaterial = new THREE.MeshStandardMaterial({
    map: saturnRingTexture, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: .9
})
const saturnRing = new THREE.Mesh(saturnRingGeometry, saturnRingMaterial)
saturnRing.rotation.x = - Math.PI * .5

const saturn = new THREE.Group()
saturn.add(saturnBody, saturnRing)
saturn.rotation.order = 'ZYX'
saturn.rotation.z = (25/180) * Math.PI 
scene.add(saturn)

// Uranus
const uranusBodyGeometry = new THREE.SphereGeometry(uranusRadius, 32, 32)
const uranusBodyMaterial = new THREE.MeshStandardMaterial({
    map: uranusBodyTexture
})
const uranusBody = new THREE.Mesh(uranusBodyGeometry, uranusBodyMaterial)

const uranusRingGeometry = new THREE.RingGeometry(1, 2.1, 32)
const uranusRingMaterial = new THREE.MeshStandardMaterial({
    map: uranusRingTexture, 
    side: THREE.DoubleSide,
    color: 0xb3fffd,
    transparent: true,
    opacity: .9
})
const uranusRing = new THREE.Mesh(uranusRingGeometry, uranusRingMaterial)
uranusRing.rotation.x = - Math.PI * .5

const uranus = new THREE.Group()
uranus.add(uranusBody, uranusRing)
uranus.rotation.order = 'ZYX'
uranus.rotation.z = -(92/180) * Math.PI 
scene.add(uranus)

/**
 * Planet Objects
 */
const sunObject = 
{
    mesh: sun,
    xPosition: 0,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: 0,
    mass: 1.989 * Math.pow(10, 30),
    radius: sunRadius,
    default: sunDefaultObject
}

const mercuryObject = 
{
    mesh: mercury,
    xPosition: .4 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -47000,
    mass: 3.25 * Math.pow(10, 23),
    radius: mercuryRadius,
    default: mercuryDefaultObject
}
mercury.position.x = mercuryObject.xPosition / scaleFactor

const venusObject = 
{
    mesh: venus,
    xPosition: .7 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: 35020,
    mass: 4.867 * Math.pow(10, 24),
    radius: venusRadius,
    default: venusDefaultObject
}
venus.position.x = venusObject.xPosition / scaleFactor

const earthObject = 
{
    mesh: earth,
    xPosition: AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,//29783 * Math.sin(.8),
    zVelocity: -29783,// * Math.cos(.8),
    mass: 5.972 * Math.pow(10, 24),
    radius: earthRadius,
    default: earthDefaultObject
}
earth.position.x = earthObject.xPosition / scaleFactor

const moonObject = 
{
    mesh: moon,
    xPosition: AU,
    yPosition: 2 * Math.pow(10, 7),
    zPosition: 3.844 * Math.pow(10, 8),
    xVelocity: 0,
    yVelocity: -1000,
    zVelocity: -29783,
    mass: 7.347 * Math.pow(10, 22),
    radius: moonRadius,
    default: moonDefaultObject
}
moon.position.x = moonObject.xPosition / scaleFactor
moon.position.y = moonObject.yPosition / scaleFactor
moon.position.z = moonObject.zPosition / scaleFactor

const marsObject = 
{
    mesh: mars,
    xPosition: 1.5 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -24077,
    mass: 6.39 * Math.pow(10, 23),
    radius: marsRadius,
    default: marsDefaultObject
}
mars.position.x = marsObject.xPosition / scaleFactor

const jupiterObject = 
{
    mesh: jupiter,
    xPosition: 5.2 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -13070,
    mass: 1.898 * Math.pow(10, 27),
    radius: jupiterRadius,
    default: jupiterDefaultObject
}
jupiter.position.x = jupiterObject.xPosition / scaleFactor

const saturnObject = 
{
    mesh: saturn,
    xPosition: 9.5 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -9690,
    mass: 5.683 * Math.pow(10, 26),
    radius: saturnRadius,
    default: saturnDefaultObject
}
saturn.position.x = saturnObject.xPosition / scaleFactor

const uranusObject = 
{
    mesh: uranus,
    xPosition: 19.8 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -6810,
    mass: 8.681 * Math.pow(10, 25),
    radius: uranusRadius,
    default: uranusDefaultObject
}
uranus.position.x = uranusObject.xPosition / scaleFactor


const sunDefaultVelocityUpdate = () =>
{
    sunObject.default.yVelocity = sunObject.yVelocity
}
gui.add(sunObject, 'yVelocity')
    .min(0)
    .max(30000)
    .step(10000)
    .name('Sun Speed')
    .onFinishChange(sunDefaultVelocityUpdate)

gui.add(sun, 'visible').name('Sun Visible')
gui.add(earth, 'visible').name('Earth Visible')



/**
 * Lights
 */
const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
scene.add(ambientLight)

// gui.add(ambientLight, 'intensity').min(0).max(1).step(.01).name('Ambient Intensity')

const pointLight = new THREE.PointLight(0xfceea7, 1.25)
scene.add(pointLight)

// gui.add(pointLight, 'intensity').min(0).max(1).step(.01).name('Point Intensity')

/**
 * Text??? -> Find way to animate 2D text that can use lookAt function
 */
// const fontLoader = new FontLoader()
// const textMaterial = new THREE.MeshMatcapMaterial()
// textMaterial.matcap = matcapTexture

// const loadText = () =>
// {
//     fontLoader.load(
//         '/fonts/helvetiker_regular.typeface.json',
//         (font) =>
//         {
//             const textGeometry = new TextGeometry(
//                 'Earth',
//                 {
//                     font: font,
//                     size: .5,
//                     height: .2,
//                     curveSegments: 4,
//                     bevelEnabled: true,
//                     bevelThickness: .03,
//                     bevelSize: .02,
//                     bevelOffset: 0,
//                     bevelSegments: 2
//                 }
//             )
//             textGeometry.computeBoundingBox()
//             textGeometry.translate(
//                 earth.position.x - (textGeometry.boundingBox.max.x - .02) * .5,
//                 earth.position.y - (textGeometry.boundingBox.max.y - .02) * .5 + 1,
//                 earth.position.z - (textGeometry.boundingBox.max.z - .03) * .5
//             )
//             // textGeometry.lookAt(camera.position)
            
    
//             // textGeometry.center()
    
//             const text = new THREE.Mesh(textGeometry, textMaterial)
//             scene.add(text)
//         }
//     )
// }

/**
 * Sizes
 */
const lockCamera = false
const cameraLock =
{
    lockCamera
}

const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

window.addEventListener('keydown', (event) => 
{
    if(event.key == 'h')
    {
        if(gui._hidden)
            gui.show()
        else
            gui.hide()
    }
    if(event.key == 'v')
    {
        if(!plane.visible)
            plane.visible = true
        else
            plane.visible = false
    }
    if(event.key == 'x')
    {
        if(!axesHelper.visible)
            axesHelper.visible = true
        else
            axesHelper.visible = false
    }
    if(event.key == 'l')
    {
        if(!cameraLock.lockCamera)
            cameraLock.lockCamera = true
        else
            cameraLock.lockCamera = false
    }
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
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
 * Update Planets Function
 */
const planets = [
    sunObject, 
    mercuryObject, 
    venusObject, 
    earthObject, 
    moonObject, 
    marsObject,
    jupiterObject,
    saturnObject,
    uranusObject
]

// Artifcially update velocities to produce more circular orbits
const velocityMod = 2.75
const artificalVelocityMod = () =>
{
    for(const planet of planets)
    {
        planet.xVelocity *= velocityMod
        planet.yVelocity *= velocityMod
        planet.zVelocity *= velocityMod
    }
}
artificalVelocityMod()

const gravitationConstant = -6.67 * Math.pow(10, -11)
let trailGeometry = new THREE.SphereGeometry(.05 * radiusMod, 3, 3)

const updateRadii = () =>
{
    let ratio = defaultScaleFactor/parameters.scaleFactor
    sun.scale.setScalar(ratio * sunRadius)
    mercury.scale.setScalar(ratio * mercuryRadius)
    venus.scale.setScalar(ratio * venusRadius)
    earth.scale.setScalar(ratio * earthRadius)
    moon.scale.setScalar(ratio * moonRadius)
    mars.scale.setScalar(ratio * marsRadius)
    jupiter.scale.setScalar(ratio * jupiterRadius)
    saturn.scale.setScalar(ratio * saturnRadius)
    uranus.scale.setScalar(ratio * uranusRadius)

    trailGeometry = new THREE.SphereGeometry(.05 * ratio, 3, 3)
}

let scaleWithZoom = true
const zoomScale = {scaleWithZoom}

const updatePlanets = () =>
{
    timeStep = parameters.timeStep
    scaleFactor = parameters.scaleFactor


        for(const planetA of planets)
        {
            let nextVX = 0
            let nextVY = 0
            let nextVZ = 0
    
            if(!pauseState)
            {
                for(const planetB of planets)
                {
                    if(planetA != planetB)
                    {
                        const sameBaseDistanceDenominator = 
                            Math.pow(planetA.xPosition - planetB.xPosition, 2)
                            + Math.pow(planetA.yPosition - planetB.yPosition, 2)
                            + Math.pow(planetA.zPosition - planetB.zPosition, 2)

                        const distance = Math.pow(
                            sameBaseDistanceDenominator, 1/2.0)
                        const denominator = Math.pow(
                            sameBaseDistanceDenominator, 3/2.0)

                        const G = gravitationConstant * Math.pow((AU/distance), parameters.gravitationalN)
        
                        nextVX += (G * planetB.mass * (planetA.xPosition - planetB.xPosition)
                        * timeStep) / denominator
                        nextVY += (G * planetB.mass * (planetA.yPosition - planetB.yPosition)
                        * timeStep) / denominator
                        nextVZ += (G * planetB.mass * (planetA.zPosition - planetB.zPosition)
                        * timeStep) / denominator
        
                        planetA.xVelocity += nextVX
                        planetA.yVelocity += nextVY
                        planetA.zVelocity += nextVZ
                    }
                }
                planetA.xPosition += planetA.xVelocity * timeStep
                planetA.yPosition += planetA.yVelocity * timeStep
                planetA.zPosition += planetA.zVelocity * timeStep
            }
            planetA.mesh.position.x = planetA.xPosition / scaleFactor
            planetA.mesh.position.y = planetA.yPosition / scaleFactor
            planetA.mesh.position.z = planetA.zPosition / scaleFactor
        }
        if(zoomScale.scaleWithZoom)
            updateRadii()
}

/**
 * Rotations
 */
let sunSpin = Math.PI * 2 * (parameters.timeStep / (2200*1))
let mercurySpin = Math.PI * 2 * (parameters.timeStep / (2200*2))
let venusSpin = Math.PI * 2 * (parameters.timeStep / (2200*2))
let earthSpin = Math.PI * 2 * (parameters.timeStep / (2200*1.5))
let marsSpin = Math.PI * 2 * (parameters.timeStep / (2200*1.6))
let jupiterSpin = Math.PI * 2 * (parameters.timeStep / (2200*.8))
let saturnSpin = Math.PI * 2 * (parameters.timeStep / (2200*.7))
let uranusSpin = Math.PI * 2 * (parameters.timeStep / (2200*.6))
const rotationSpeeds = 
{
    sun: sunSpin,
    mercury: mercurySpin,
    venus: venusSpin,
    earth: earthSpin,
    mars: marsSpin,
    jupiter: jupiterSpin,
    saturn: saturnSpin,
    uranus: uranusSpin,
    pauseSun: 0,
    pauseMercury: 0,
    pauseVenus: 0,
    pauseEarth: 0,
    pauseMars: 0,
    pauseJupiter: 0,
    pauseSaturn: 0,
    pauseUranus: 0
}

const updateRotations = () =>
{
    sunSpin = Math.PI * 2 * (parameters.timeStep / (2200*1))
    mercurySpin = Math.PI * 2 * (parameters.timeStep / (2200*2))
    venusSpin = Math.PI * 2 * (parameters.timeStep / (2200*2))
    earthSpin = Math.PI * 2 * (parameters.timeStep / (2200*1.5))
    marsSpin = Math.PI * 2 * (parameters.timeStep / (2200*1.6))
    jupiterSpin = Math.PI * 2 * (parameters.timeStep / (2200*.8))
    saturnSpin = Math.PI * 2 * (parameters.timeStep / (2200*.7))
    uranusSpin = Math.PI * 2 * (parameters.timeStep / (2200*.6))
    rotationSpeeds.sun = sunSpin
    rotationSpeeds.mercury = mercurySpin
    rotationSpeeds.venus = venusSpin
    rotationSpeeds.earth = earthSpin
    rotationSpeeds.mars = marsSpin
    rotationSpeeds.jupiter = jupiterSpin
    rotationSpeeds.saturn = saturnSpin
    rotationSpeeds.uranus = uranusSpin
}

/**
 * Pause Button
 */
const clock = new THREE.Clock()
let storedTimeStep = parameters.timeStep

// update by moving rotationSpeeds (which are rotationSpeeds)
// into the planetObjects and loop through all planets in planets to avoid 
// continued updating of rotations for new planets
const pause = () =>
{
    if(!pauseState)
    {
        pauseState = true
        storedTimeStep = parameters.timeStep
        parameters.timeStep = 0
        sunSpin = 0
        mercurySpin = 0
        venusSpin = 0
        earthSpin = 0
        marsSpin = 0
        jupiterSpin = 0
        saturnSpin = 0
        uranusSpin = 0
        sun.rotation.y = rotationSpeeds.sun * clock.getElapsedTime()
        rotationSpeeds.pauseSun = rotationSpeeds.sun * clock.getElapsedTime()
        mercury.rotation.y = rotationSpeeds.mercury * clock.getElapsedTime()
        rotationSpeeds.pauseMercury = rotationSpeeds.mercury * clock.getElapsedTime()
        venus.rotation.y = rotationSpeeds.venus * clock.getElapsedTime()
        rotationSpeeds.pauseVenus = rotationSpeeds.venus * clock.getElapsedTime()
        earth.rotation.y = rotationSpeeds.earth * clock.getElapsedTime()
        rotationSpeeds.pauseEarth = rotationSpeeds.earth * clock.getElapsedTime()
        mars.rotation.y = rotationSpeeds.mars * clock.getElapsedTime()
        rotationSpeeds.pauseMars = rotationSpeeds.mars * clock.getElapsedTime()
        jupiter.rotation.y = rotationSpeeds.jupiter * clock.getElapsedTime()
        rotationSpeeds.pauseJupiter = rotationSpeeds.jupiter * clock.getElapsedTime()
        saturn.rotation.y = rotationSpeeds.saturn * clock.getElapsedTime()
        rotationSpeeds.pauseSaturn = rotationSpeeds.saturn * clock.getElapsedTime()
        uranus.rotation.y = rotationSpeeds.uranus * clock.getElapsedTime()
        rotationSpeeds.pauseUranus = rotationSpeeds.uranus * clock.getElapsedTime()
    }
}
const play = () =>
{
    if(pauseState)
    {
        pauseState = false
        parameters.timeStep = storedTimeStep
        sunSpin = rotationSpeeds.sun
        mercurySpin = rotationSpeeds.mercury
        venusSpin = rotationSpeeds.venus
        earthSpin = rotationSpeeds.earth
        marsSpin = rotationSpeeds.mars
        jupiterSpin = rotationSpeeds.jupiter
        saturnSpin = rotationSpeeds.saturn
        uranusSpin = rotationSpeeds.uranus
    }
}
const pauseObject = {pause, play}
window.addEventListener('keydown', (event) => // play/pause with space bar
{
    if(event.key == " ")
    {
        if(!pauseState)
            pause()
        else
            play()
    }
})

/**
 * Camera View Updates
 * implement camera switcher with arrow keys ************
 */
const cameraPositionMesh = 
{
    mesh: sun
}
const sunCam = () =>
{
    cameraPositionMesh.mesh = sun
    camera.position.set(sun.position.x + 10, sun.position.y + 10, sun.position.z + 10)
}
const mercuryCam = () =>
{
    cameraPositionMesh.mesh = mercury
    camera.position.set(mercury.position.x + 10, mercury.position.y + 10, mercury.position.z + 10)
}
const venusCam = () =>
{
    cameraPositionMesh.mesh = venus
    camera.position.set(venus.position.x + 10, venus.position.y + 10, venus.position.z + 10)
}
const earthCam = () =>
{
    cameraPositionMesh.mesh = earth
    camera.position.set(earth.position.x + 10, earth.position.y + 10, earth.position.z + 10)
}
const moonCam = () =>
{
    cameraPositionMesh.mesh = moon
    camera.position.set(moon.position.x + 10, moon.position.y + 10, moon.position.z + 10)
}
const marsCam = () =>
{
    cameraPositionMesh.mesh = mars
    camera.position.set(mars.position.x + 10, mars.position.y + 10, mars.position.z + 10)
}
const jupiterCam = () =>
{
    cameraPositionMesh.mesh = jupiter
    camera.position.set(jupiter.position.x + 10, jupiter.position.y + 10, jupiter.position.z + 10)
}
const saturnCam = () =>
{
    cameraPositionMesh.mesh = saturn
    camera.position.set(saturn.position.x + 10, saturn.position.y + 10, saturn.position.z + 10)
}
const uranusCam = () =>
{
    cameraPositionMesh.mesh = uranus
    camera.position.set(uranus.position.x + 10, uranus.position.y + 10, uranus.position.z + 10)
}

const orbitCameraPositions = 
{
    sun: sunCam,
    mercury: mercuryCam,
    venus: venusCam,
    earth: earthCam,
    moon: moonCam,
    mars: marsCam,
    jupiter: jupiterCam,
    saturn: saturnCam,
    uranus: uranusCam
}
const updateCamera = () =>
{
    controls.target = cameraPositionMesh.mesh.position
    if(cameraLock.lockCamera)
    {
        camera.position.set(
            cameraPositionMesh.mesh.position.x + 10, 
            cameraPositionMesh.mesh.position.y + 10, 
            cameraPositionMesh.mesh.position.z + 10,)
    }
}
const cameraViews = gui.addFolder('Camera Views')
cameraViews.close()
cameraViews.add(orbitCameraPositions, 'sun').name('Sun Cam')
cameraViews.add(orbitCameraPositions, 'mercury').name('Mercury Cam')
cameraViews.add(orbitCameraPositions, 'venus').name('Venus Cam')
cameraViews.add(orbitCameraPositions, 'earth').name('Earth Cam')
cameraViews.add(orbitCameraPositions, 'moon').name('Moon Cam')
cameraViews.add(orbitCameraPositions, 'mars').name('Mars Cam')
cameraViews.add(orbitCameraPositions, 'jupiter').name('Jupiter Cam')
cameraViews.add(orbitCameraPositions, 'saturn').name('Saturn Cam')
cameraViews.add(orbitCameraPositions, 'uranus').name('Uranus Cam')
cameraViews.add(cameraLock, 'lockCamera').name('Lock Camera')


/**
 * Trails
 */
const showTrails = false
const trailsShown = {showTrails}
const trailMaterial = new THREE.MeshBasicMaterial({
    color:0xeeeeee, 
    transparent: true,
    opacity: .5
})
let trails = []
const hasTrail = 
{
    sun: false,
    mercury: false,
    venus: false,
    earth: true,
    moon: false,
    mars: false,
    jupiter: false,
    saturn: false,
    uranus: false
}
const trailLength = 
{
    trailLength: 1000,
    previous: 1000
}
const updateTrails = (planetMesh) =>
{ 
    const nextTrailItem = new THREE.Mesh(trailGeometry, trailMaterial)
    nextTrailItem.position.set(planetMesh.position.x, planetMesh.position.y, planetMesh.position.z)
    scene.add(nextTrailItem)
    trails.push(nextTrailItem)

    // console.log(trails.length);
    if(trails.length > trailLength.trailLength)
    {
        scene.remove(trails[0]);
        trails.shift();
    }
}
const resetTrail = () =>
{
    for(var i = 0; i < trails.length; i++)
    {
        scene.remove(trails[i])
    }
    trails = []
}
const guiUpdateTrail = () =>
{
    for(var i = 0; i < trailLength.trailLength; i++)
    {
        if((trails.length < trailLength.previous))
            if(i > trailLength.previous)
                scene.remove(trails[i])
    }
    if(trailLength.previous > trailLength.trailLength)
    {
        resetTrail()
    }
    trailLength.previous = trailLength.trailLength
}
const updateAllTrails = () =>
{
    if(trailsShown.showTrails)
    {
        for(const planet of planets)
        {
            switch(planet)
            {
                case sunObject:
                    if(hasTrail.sun)
                        updateTrails(planet.mesh)
                    break;
                case mercuryObject:
                    if(hasTrail.mercury)
                        updateTrails(planet.mesh)
                    break;
                case venusObject:
                    if(hasTrail.venus)
                        updateTrails(planet.mesh)
                    break;
                case earthObject:
                    if(hasTrail.earth)
                        updateTrails(planet.mesh)
                    break;
                case moonObject:
                    if(hasTrail.moon)
                        updateTrails(planet.mesh)
                    break;
                case marsObject:
                    if(hasTrail.mars)
                        updateTrails(planet.mesh)
                    break;
                case jupiterObject:
                    if(hasTrail.jupiter)
                        updateTrails(planet.mesh)
                    break;
                case saturnObject:
                    if(hasTrail.saturn)
                        updateTrails(planet.mesh)
                    break;
                case uranusObject:
                    if(hasTrail.uranus)
                        updateTrails(planet.mesh)
                    break;
            }
        }
    }
    
}
const resetTrailObject = {resetTrail}
const trailFolder = gui.addFolder('Trail Options')
trailFolder.add(trailsShown, 'showTrails').name('Show Trails').onChange(resetTrail)
trailFolder.close()
trailFolder.add(trailLength, 'trailLength').min(1).max(15000).step(1).name('Trail Length').onFinishChange(guiUpdateTrail)
trailFolder.add(resetTrailObject, 'resetTrail').name('Reset Trails')
const trailSelectionFolder = trailFolder.addFolder('Select Trails')
trailSelectionFolder.close()
trailSelectionFolder.add(hasTrail, 'sun').name('Sun Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'mercury').name('Mercury Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'venus').name('Venus Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'earth').name('Earth Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'moon').name('Moon Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'mars').name('Mars Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'jupiter').name('Jupiter Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'saturn').name('Saturn Trail').onChange(resetTrail)
trailSelectionFolder.add(hasTrail, 'uranus').name('Uranus Trail').onChange(resetTrail)

window.addEventListener('keydown', (event) => // toggle trails with T
{
    if(event.key == 't')
    {
        if(!trailsShown.showTrails)
            {trailsShown.showTrails = true
            resetTrail()}
        else
            {trailsShown.showTrails = false
            resetTrail()}
    }
})

gui.add(parameters, 'timeStep')
    .min(100)
    .max(50000)
    .step(10)
    .onChange(updatePlanets)
    .onChange(updateRotations)
    .name('Time Step')
gui.add(parameters, 'scaleFactor')
    .min(defaultScaleFactor / 20)
    .max(5 * defaultScaleFactor)
    .step(10)
    .onFinishChange(updatePlanets)
    .onFinishChange(resetTrail)
    .name("Zoom")
gui.add(zoomScale, 'scaleWithZoom').name('Scale with Zoom')

gui.add(parameters, 'gravitationalN')
    .min(-6)
    .max(6)
    .step(.01)
    .name('Gravitational Modifer')
    .onFinishChange(updatePlanets)

gui.add(pauseObject, 'pause').name('Pause')
gui.add(pauseObject, 'play').name('Play')


const logVelocity = (planetObject) =>
{
    const v = Math.pow((
        Math.pow(planetObject.xVelocity, 2) + 
        Math.pow(planetObject.yVelocity, 2) + 
        Math.pow(planetObject.zVelocity, 2)), 1/2)
    console.log(v);
}
const logDistanceToSun = (planetObject) =>
{
    const distanceToSun = Math.pow(
        Math.pow((planetObject.xPosition - sunObject.xPosition), 2) +
        Math.pow((planetObject.yPosition - sunObject.yPosition), 2) +
        Math.pow((planetObject.zPosition - sunObject.zPosition), 2), (1/2))
    console.log((distanceToSun / AU) + " AU");
}


/**
 * Reset Simulation to default parameters
 */
const resetSimulation = () =>
{
    timeStep = defaultTimeStep
    for(const planet of planets)
    {
        planet.xPosition = planet.default.xPosition
        planet.yPosition = planet.default.yPosition
        planet.zPosition = planet.default.zPosition

        planet.xVelocity = planet.default.xVelocity
        planet.yVelocity = planet.default.yVelocity
        planet.zVelocity = planet.default.zVelocity
    }
    resetTrail()
    artificalVelocityMod()
}
const guiResetObject = 
{
    resetSimulation
}
gui.add(guiResetObject, 'resetSimulation').name('Reset')
window.addEventListener('keydown', (event) => // reset with R key
{
    if(event.key == "r")
    {
        resetSimulation()
    }
})



// alert("'X' -> Axis Helper Toggle\n'V' -> X-Z Plane Toggle\n'L' -> Camera Lock Toggle\n'H' -> Gui Toggle\n'Space' -> Pause / Play\n'R' -> Reset Simulation")

let simSlowDownWarningCounter = 0
const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    const timer = new THREE.Clock()
    const startTime = timer.getElapsedTime()
    // Update Planets
    updatePlanets()
    moon.lookAt(earth.position)

    if(!pauseState)
    {
        sun.rotation.y = elapsedTime * sunSpin + rotationSpeeds.pauseSun
        mercury.rotation.y = elapsedTime * mercurySpin + rotationSpeeds.pauseMercury
        venus.rotation.y = - elapsedTime * venusSpin + rotationSpeeds.pauseVenus
        earth.rotation.y = elapsedTime * earthSpin + rotationSpeeds.pauseEarth
        mars.rotation.y = elapsedTime * marsSpin + rotationSpeeds.pauseMars
        jupiter.rotation.y = elapsedTime * jupiterSpin + rotationSpeeds.pauseJupiter
        saturn.rotation.y = elapsedTime * saturnSpin + rotationSpeeds.pauseSaturn
        uranus.rotation.y = elapsedTime * uranusSpin + rotationSpeeds.pauseUranus

        
        // Update Trails
        updateAllTrails()
    }

    // Earth Velocity and Distance to Sun
    // logVelocity(earthObject)
    // logDistanceToSun(earthObject)

    // Update pointlight in case of moving sun
    if(Math.round(sun.position.y) > 0)
        pointLight.position.set(0, sun.position.y, 0)

    // Update Camera
    updateCamera()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    const endTime = timer.getElapsedTime()
    const drawTime = endTime - startTime
    if(Math.round(elapsedTime) % 2 == 0)
        console.log(Math.round(drawTime * 1000000) + " µs");
    if(drawTime*1000000 > 1000000/30)
    {
        console.log("Simulation Slowing Down");
        simSlowDownWarningCounter += 1
        if(simSlowDownWarningCounter % 150 == 0)
        {
            alert("\tSimulation Slowing Down!\nAvoid high Trail Length for better performance!")
            resetTrail()
        }
        if(Math.round(elapsedTime) % 120 == 0)
        {
            simSlowDownWarningCounter = 0
        }
    }
        
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}
tick()