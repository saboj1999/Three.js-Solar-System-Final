import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import * as dat from 'lil-gui'

/**
 * Parameters
 */
const defaultScaleFactor = Math.pow(10, 11) // 10^10 is good too with use of camera views
const defaultTimeStep = 4320
const AU = 1.5 * Math.pow(10, 11)
const parameters = {
    timeStep: defaultTimeStep, // 60 -> 1 Simulation hour per 1 Actual second (4320 -> 3 days / 1 second)
    scaleFactor: defaultScaleFactor,
    gravitationalN: 0,
    scaleWithZoom: true,
    cameraPositionMesh: null,
    lockCamera: false,
    pauseState: false,
    showTrails: true,
    lockCameraX: 10,
    lockCameraY: 10,
    lockCameraZ: 10,
    radiusMod: 1
}
const gravitationConstant = -6.67 * Math.pow(10, -11)
const stephen_boltzmann = 5.67 * Math.pow(10, -8) // sigma -> watts per (meter^2 * Kelvin^4)

const sunLuminosity = 3.828 * Math.pow(10, 26);
const alphaCentauriALuminosity = 1.519 * sunLuminosity;
const alphaCentauriBLuminosity = .5 * sunLuminosity;
const proximaCentauriLuminosity = .0017 * sunLuminosity;

const alphaCentauriAPointLightIntensity = 1;
const alphaCentauriBPointLightIntensity = 1;
const proximaCentauriPointLightIntensity = .8;

const sunMass = 1.989 * Math.pow(10, 30);
const earthMass = 5.97 * Math.pow(10, 24);
const alphaCentauriAMass = 1.1 * sunMass;
const alphaCentauriBMass = .93 * sunMass;
const proximaCentauriMass = 2.428 * Math.pow(10, 29);
const proximaCentauriBMass = 1.07 * earthMass;
const proximaCentauriCMass = 7 * earthMass;

const alphaCentauriAOrbitalDistance = -10.9 * AU / 2
const alphaCentauriBOribtalDistance = 12.8 * AU / 2
const proximaCentauriOrbitalDistance = 2500 * AU
const proximaCentauriBOrbitalDistance = 2500 * AU + .5 * AU
const proximaCentauriCOrbitalDistance = 2500 * AU + 1.49 * AU

const alphaCentauriAOrbitalVelocity = 5000
const alphaCentauriBOrbitalVelocity = -5000
const proximaCentauriOrbitalVelocity = -11000
const proximaCentauriBOrbitalVelocity = -11000 - 12500
const proximaCentauriCOrbitalVelocity = -11000 - 7500

const defaultRadiusScaler = 25 // arbitrary TODO -> realistic radii
const radiusMod = 1.25
const alphaCentauriARadius = 1.1 * radiusMod;
const alphaCentauriBRadius = .9 * radiusMod;
const proximaCentauriRadius = .45 * radiusMod;
const proximaCentauriBRadius = .2 * radiusMod;
const proximaCentauriCRadius = .3 * radiusMod;

const alphaCentauriARotation = Math.PI * 1.5;
const alphaCentauriBRotation = Math.PI * 1.5;
const proximaCentauriRotation = Math.PI;
const proximaCentauriBRotation = Math.PI * .6;
const proximaCentauriCRotation = Math.PI * .3;

const proximaCentauriBAlbedo = .1;
const proximaCentauriCAlbedo = .1;

const proximaCentauriBEmissivity = .9;
const proximaCentauriCEmissivity = .9;

const defaultTrailLength = 0;

class Body
{
    name;
    x;
    y;
    z;
    vx;
    vy;
    vz;
    mesh;
    mass;
    radius;
    radiusMod;
    rotation;
    trail = [];
    defaultObject;
    currentTrailLength = defaultTrailLength;
    previousTrailLength = defaultTrailLength + 1;
    trailMaterial = new THREE.LineBasicMaterial({color: 0xffffff});
   
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
        this.radiusMod = 1;
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
        parameters.cameraPositionMesh = this.mesh
        camera.position.set(this.mesh.position.x + parameters.lockCameraX, this.mesh.position.y + parameters.lockCameraY, this.mesh.position.z + parameters.lockCameraZ)
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
        const pointLight = new THREE.PointLight(this.mesh.emissive, pointLightIntensity, 1000);
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
    planetTempText;
    
    constructor(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation, albedo, emissivity)
    {
        super(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation);
        this.albedo = albedo;
        this.emissivity = emissivity;
        this.planetTempText = document.getElementById(this.name.toLowerCase()+"Temp")
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
 * System Center Mesh
 */
const centerMesh = new THREE.Mesh(new THREE.SphereGeometry(.1, 8, 8), new THREE.MeshBasicMaterial({color:0x0000ff}))
scene.add(centerMesh)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const createBodyMesh = (radius, textureSource) =>
{
    const texture = textureLoader.load('/textures/'+textureSource)
    const geometry = new THREE.SphereGeometry(radius, 32, 32)
    const material = new THREE.MeshStandardMaterial({
        map: texture
    })
    return new THREE.Mesh(geometry, material)
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
const createSkyBox = () =>
{
    var skyBoxTexture = textureLoader.load("/textures/skybox.png")
    var skyBoxMaterial = new THREE.MeshBasicMaterial({map: skyBoxTexture, side: THREE.BackSide})
    var skyBoxGeometry = new THREE.SphereGeometry(10000, 64, 64)
    return new THREE.Mesh(skyBoxGeometry, skyBoxMaterial)
}

/**
 * Sky box http://paulbourke.net/miscellaneous/astronomy/
 */
const skyBox = createSkyBox()
scene.add(skyBox)

/**
 * Body Meshes
 */
// Alpha Centauri A
const alphaCentauriA = createStarMesh(alphaCentauriARadius, 'alphaA.jpg', '#ffeb0a', .75)
scene.add(alphaCentauriA)
// Alpha Centauri B
const alphaCentauriB = createStarMesh(alphaCentauriBRadius, 'alphaB.jpg', '#f78605', .85)
scene.add(alphaCentauriB)
// Proxima Centauri
const proximaCentauri = createStarMesh(proximaCentauriRadius, 'proxima.jpg', '#ff0000', .75)
scene.add(proximaCentauri)
// Proxima Centauri B
const proximaCentauriB = createBodyMesh(proximaCentauriBRadius, 'proximaB.jpg')
scene.add(proximaCentauriB)
// Proxima Centauri C
const proximaCentauriC = createBodyMesh(proximaCentauriCRadius, 'proximaC.jpg')
scene.add(proximaCentauriC)

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
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 20000)
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
 * Planet Objects as Classes
 */
const alphaCentauriAObject = new Star('Alpha Centauri A', alphaCentauriAOrbitalDistance, 0, 0, 0, 0, alphaCentauriAOrbitalVelocity, alphaCentauriA, alphaCentauriAMass, alphaCentauriARadius, alphaCentauriARotation, alphaCentauriALuminosity, alphaCentauriAPointLightIntensity);
const alphaCentauriBObject = new Star('Alpha Centauri B', alphaCentauriBOribtalDistance, 0, 0, 0, 0, alphaCentauriBOrbitalVelocity, alphaCentauriB, alphaCentauriBMass, alphaCentauriBRadius, alphaCentauriBRotation, alphaCentauriBLuminosity, alphaCentauriBPointLightIntensity);
const proximaCentauriObject = new Star('Proxima Centauri', proximaCentauriOrbitalDistance, 0, 0, 0, 0, proximaCentauriOrbitalVelocity, proximaCentauri, proximaCentauriMass, proximaCentauriRadius, proximaCentauriRotation, proximaCentauriLuminosity, proximaCentauriPointLightIntensity);
const proximaCentauriBObject = new Planet('Proxima Centauri B', proximaCentauriBOrbitalDistance, 0, 0, 0, 0, proximaCentauriBOrbitalVelocity, proximaCentauriB, proximaCentauriBMass, proximaCentauriBRadius, proximaCentauriBRotation, proximaCentauriBAlbedo, proximaCentauriBEmissivity);
const proximaCentauriCObject = new Planet('Proxima Centauri C', proximaCentauriCOrbitalDistance, 0, 0, 0, 0, proximaCentauriCOrbitalVelocity, proximaCentauriC, proximaCentauriCMass, proximaCentauriCRadius, proximaCentauriCRotation, proximaCentauriCAlbedo, proximaCentauriCEmissivity);

const planets = 
[
    alphaCentauriAObject,
    alphaCentauriBObject,
    proximaCentauriObject,
    proximaCentauriBObject,
    proximaCentauriCObject
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
    centerMesh.scale.setScalar(ratio * .6)
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
    
                    if(planetB.mass >= sunMass*.1 || distance <= 10*AU) // optimization?
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
    controls.target = parameters.cameraPositionMesh.position
    if(parameters.lockCamera)
    {
        camera.position.set(
            parameters.cameraPositionMesh.position.x + parameters.lockCameraX, 
            parameters.cameraPositionMesh.position.y + parameters.lockCameraY, 
            parameters.cameraPositionMesh.position.z + parameters.lockCameraZ,)
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

/**
 * Update System Center - Alpha Centauri
 */
const updateCenterMass = () =>
{
    const centerMassX = (alphaCentauriAObject.mass*alphaCentauriAObject.x + alphaCentauriBObject.mass*alphaCentauriBObject.x) / (alphaCentauriAObject.mass + alphaCentauriBObject.mass)
    const centerMassZ = (alphaCentauriAObject.mass*alphaCentauriAObject.z + alphaCentauriBObject.mass*alphaCentauriBObject.z) / (alphaCentauriAObject.mass + alphaCentauriBObject.mass)

    centerMesh.position.x = centerMassX / parameters.scaleFactor
    centerMesh.position.z = centerMassZ / parameters.scaleFactor 
}
const systemCenterCamera = () =>
{
    parameters.cameraPositionMesh = centerMesh
    camera.position.set(centerMesh.position.x + parameters.lockCameraX, centerMesh.position.y + parameters.lockCameraY, centerMesh.position.z + parameters.lockCameraZ)
}
systemCenterCamera()
parameters.updateSystemCenter = systemCenterCamera
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

const updateTempText = () =>
{
    for(var body of planets)
    {
        if(body instanceof Planet)
        {
            let temp = calculateTemperatureMultiStar(body)
            body.planetTempText.innerText = body.name+": "+parseFloat(temp).toFixed(2) +'\n'
        }
    }
}

/**
 * GUI
 */
const bodiesFolder = gui.addFolder("Planets / Stars").close()
const createPlanetGui = (planet) =>
{
    const planetFolder = bodiesFolder.addFolder(planet.name).close()
    planetFolder.add(planet, 'camera').onFinishChange(updateCamera).name(planet.name+" Camera")
    planetFolder.add(planet, 'radiusMod').min(1/defaultRadiusScaler).max(1000).step(.01).name(planet.name+" Radius")
    planetFolder.add(planet, 'albedo').min(.01).max(.99).step(.01).name(planet.name+" Albedo")
    planetFolder.add(planet, 'emissivity').min(.01).max(.99).step(.01).name(planet.name+" Emissivity")
    planetFolder.add(planet, 'currentTrailLength').min(0).max(2500).step(10)
        .name(planet.name + " Trail Length").onFinishChange(planet.updatePreviousTrailLength)
    planetFolder.addColor(planet.trailMaterial, 'color').name(planet.name+" Trail Color")
    
}
const createStarGui = (star) =>
{
    const starFolder = bodiesFolder.addFolder(star.name).close()
    starFolder.add(star, 'camera').onFinishChange(updateCamera).name(star.name+" Camera")
    starFolder.add(star, 'radiusMod').min(1/defaultRadiusScaler).max(100).step(.01).name(star.name+" Radius")
    starFolder.add(star, 'luminosity').min(1*star.defaultObject.luminosity).max(20*star.defaultObject.luminosity)
        .step(100000).onFinishChange(star.updateMass).name(star.name+' Lumonosity')
    starFolder.add(star, 'mass').min(.05*star.defaultObject.mass).max(8*star.defaultObject.mass)
        .step(100000).onFinishChange(star.updateEmissiveLuminosity).name(star.name+' Mass')
    starFolder.add(star, 'currentTrailLength').min(0).max(5000).step(10)
        .name(star.name + " Trail Length").onFinishChange(star.updatePreviousTrailLength)
    starFolder.addColor(star.trailMaterial, 'color').name(star.name+" Trail Color")

    
}
const setupCameraViews = () =>
{
    const cameraViews = gui.addFolder('Camera Views').close()
    for(const planet of planets)
    {
        cameraViews.add(planet, 'camera').onFinishChange(updateCamera).name(planet.name)
    }
    cameraViews.add(parameters, 'updateSystemCenter').name("System Center").onFinishChange(updateCamera)
    const cameraLockOptions = cameraViews.addFolder('Camera Lock Options')
    cameraLockOptions.close()
    cameraLockOptions.add(parameters, 'lockCamera').name('Lock Camera')
    cameraLockOptions.add(parameters, 'lockCameraX').min(-50).max(50).step(1).name("X Position")
    cameraLockOptions.add(parameters, 'lockCameraY').min(-50).max(50).step(1).name("Y Position")
    cameraLockOptions.add(parameters, 'lockCameraZ').min(-50).max(50).step(1).name("Z Position")

}
const setupTrailOptions = () =>
{
    const trailOptions = gui.addFolder('Trail Options').close()
    for(const planet of planets)
    {
        let maxTrail = 2500
        if(planet instanceof Star)
            {maxTrail = 5000}
        trailOptions.add(planet, 'currentTrailLength').min(0).max(maxTrail).step(10)
        .name(planet.name + " Trail Length").onFinishChange(planet.updatePreviousTrailLength)
    }
    trailOptions.add(parameters, 'showTrails').name('Show Trails').onFinishChange(updateTrails).onFinishChange(resetTrails)
}
const setupGui = () =>
{
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
    const settingsFolder = gui.addFolder("Settings").close()
    settingsFolder.add(parameters, 'timeStep').min(100).max(250000).step(10).name('Time Step')
    settingsFolder.add(parameters, 'scaleFactor').min(defaultScaleFactor / 50).max(5 * defaultScaleFactor).step(10)
        .onChange(updateRadii).onFinishChange(resetTrails).onChange(updatePlanets).name("Zoom")
    settingsFolder.add(parameters, 'scaleWithZoom').name('Scale with Zoom')
    settingsFolder.add(skyBox, "visible").name("Sky Box Visible")
    settingsFolder.add(parameters, "radiusMod").min(1).max(10).step(1).name("System Scale")


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
            parameters.pauseState = true
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
})

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
        // Update Center Mass
        updateCenterMass()
    }
    if(parameters.scaleWithZoom)
        updateRadii()
    
    // Sky Box
    updateSkyBox()
    
    // Update controls
    controls.update()

    // Camera
    updateCamera()

    // Render
    renderer.render(scene, camera)

    const endTime = timer.getElapsedTime()
    const drawTime = endTime - startTime

    // if(Math.round(elapsedTime) % 2 == 0)
        // console.log(Math.round(drawTime * 1000000) + " µs");

        // console.log(parseFloat(parseFloat(getDistance(proximaCentauriObject, alphaCentauriAObject)/AU).toPrecision(6)).toFixed());
    updateTempText()
    
    window.requestAnimationFrame(tick)
}
tick()