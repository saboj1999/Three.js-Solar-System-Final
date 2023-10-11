import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'

const defaultScaleFactor = Math.pow(10, 8) // 10^9 is good too with use of camera views
const AU = 1.5 * Math.pow(10, 11)
const gravitationConstant = -6.67 * Math.pow(10, -11)

/**
 * Debug
 */
const gui = new dat.GUI()
const debugObject = {}
const parameters = {
    timeStep: 1000, // 60 -> 1 Simulation hour per 1 Actual second (4320 -> 3 days / 1 second)
    scaleFactor: defaultScaleFactor,
    gravitationalN: 0,
    scaleWithZoom: true,
    currentCameraMesh: null,
    cameraLocked: false,
}

let timeStep = parameters.timeStep
const defaultTimeStep = parameters.timeStep
let scaleFactor = parameters.scaleFactor
let pauseState = false

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
const sunTexture = textureLoader.load('/textures/sun.jpg')
const earthTexture = textureLoader.load('/textures/earth.jpg')
const moonTexture = textureLoader.load('/textures/moon.jpg')
const jupiterTexture = textureLoader.load('/textures/jupiter.jpg')

const radiusMod = 1
let sunRadius = 1.5 * radiusMod
let earthRadius = .5 * radiusMod
let moonRadius = .25 * radiusMod
let jupiterRadius = 1.25 * radiusMod


/**
 * Helper Axis
 */
const axesHelper = new THREE.AxesHelper(25)
scene.add(axesHelper)
axesHelper.visible = false

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
parameters.currentCameraMesh = sun
scene.add(sun)

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

// Jupiter
const jupiterGeometry = new THREE.SphereGeometry(jupiterRadius, 16, 16)
const jupiterMaterial = new THREE.MeshStandardMaterial({
    map: jupiterTexture
})
const jupiter = new THREE.Mesh(jupiterGeometry, jupiterMaterial)
scene.add(jupiter)



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
const jupiterDefaultObject = 
{
    xPosition: 5.2 * AU,
    yPosition: 0,
    zPosition: 0,
    xVelocity: 0,
    yVelocity: 0,
    zVelocity: -13070,
    mass: 1.898 * Math.pow(10, 27),
    radius: jupiterRadius
}

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
    zPosition: -3.844 * Math.pow(10, 8),
    xVelocity: -1000,
    yVelocity: 0,
    zVelocity: -29783,
    mass: 7.347 * Math.pow(10, 22),
    radius: moonRadius,
    default: moonDefaultObject
}
moon.position.x = moonObject.xPosition / scaleFactor
moon.position.y = moonObject.yPosition / scaleFactor
moon.position.z = moonObject.zPosition / scaleFactor
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
 * Sizes
 */
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
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 10000)
camera.position.set(- 3, 3, 3)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true



// Planet Cameras
const sunCam = () =>
{
    parameters.currentCameraMesh = sun
    camera.position.set(sun.position.x + 10, sun.position.y + 10, sun.position.z + 10)
}
const earthCam = () =>
{
    parameters.currentCameraMesh = earth
    camera.position.set(earth.position.x + 10, earth.position.y + 10, earth.position.z + 10)
}
const moonCam = () =>
{
    parameters.currentCameraMesh = moon
    camera.position.set(moon.position.x + 10, moon.position.y + 10, moon.position.z + 10)
}
const jupiterCam = () =>
{
    parameters.currentCameraMesh = jupiter
    camera.position.set(jupiter.position.x + 10, jupiter.position.y + 10, jupiter.position.z + 10)
}
sunObject.camera = sunCam
earthObject.camera = earthCam
moonObject.camera = moonCam
jupiterObject.camera = jupiterCam

const updateCamera = () =>
{
    controls.target = parameters.currentCameraMesh.position
    if(parameters.cameraLocked)
    {
        camera.position.set(
            parameters.currentCameraMesh.position.x + 10, 
            parameters.currentCameraMesh.position.y + 10, 
            parameters.currentCameraMesh.position.z + 10,)
    }
}


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
 * Planets
 */
const planets = [
    sunObject, 
    earthObject,
    moonObject,
    jupiterObject
]


/**
 * Trails FIXME
 */
sunObject.hasTrail = false
moonObject.hasTrail = false

earthObject.hasTrail = false

earthObject.trail = new Array(1000)
earthObject.trailPointIndex = 0
earthObject.trail[0] = earthObject.mesh.position.clone()
// try populating initial trail -> seems to work
for(var i = 0; i < earthObject.trail.length; i++)
{
    earthObject.trail[i] = earthObject.mesh.position.clone()
}

const updateTrails = () =>
{
    for(const planet of planets)
    {
        if(planet.hasTrail)
        {
            planet.trailPointIndex = (planet.trailPointIndex + 1) % planet.trail.length
            planet.trail[planet.trailPointIndex] = planet.mesh.position.clone()

            const geometry = new THREE.BufferGeometry().setFromPoints(planet.trail)
            const material = new THREE.LineBasicMaterial({ color:0xffffff })
            const line = new THREE.Line(geometry, material)
            scene.add(line)
        

        }
    }
    
}





// Add updateRotations

const updateRadii = () =>
{
    let ratio = defaultScaleFactor/parameters.scaleFactor
    for(const planet of planets)
    {
        planet.mesh.scale.setScalar(ratio * planet.radius)
    }
}
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
        if(parameters.scaleWithZoom)
            updateRadii()
}



gui.add(parameters, 'timeStep')
    .min(60)
    .max(60000)
    .step(10)
    .onChange(updatePlanets)
    .name('Sim Min / Real Sec')
gui.add(parameters, 'scaleFactor')
    .min(defaultScaleFactor / 20)
    .max(5 * defaultScaleFactor)
    .step(10)
    .onFinishChange(updatePlanets)
    .name("Zoom")
gui.add(parameters, 'scaleWithZoom').name('Scale with Zoom')

gui.add(parameters, 'gravitationalN')
    .min(-6)
    .max(6)
    .step(.01)
    .name('Gravitational Modifer')
    .onFinishChange(updatePlanets)

gui.add(axesHelper, 'visible').name('AxesHelper')
gui.add(plane, 'visible').name('Wireframe Plane')

gui.add(sun, 'visible').name('Sun Visible')
gui.add(earth, 'visible').name('Earth Visible')

const cameraViews = gui.addFolder('Camera Views')
cameraViews.close()
cameraViews.add(sunObject, 'camera').name('Sun Cam')
cameraViews.add(earthObject, 'camera').name('Earth Cam')
cameraViews.add(moonObject, 'camera').name('Moon Cam')
cameraViews.add(jupiterObject, 'camera').name('Jupiter Cam')
cameraViews.add(parameters, 'cameraLocked').name('Lock Camera')

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElaspedTime = 0

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElaspedTime
    oldElaspedTime = elapsedTime
    
    // Update Planets
    updatePlanets()

    // Update Camera
    updateCamera()

    // Update Trails
    updateTrails()

    // controls.target = earth.position
    // camera.position.set(earth.position.x + 2, earth.position.y + 2, earth.position.z + 2)

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()