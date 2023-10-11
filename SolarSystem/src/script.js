import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import * as dat from 'lil-gui'
/**
 * Parameters
 */
const defaultDistanceScaleFactor = Math.pow(10, 10) // 10^9 is good too with use of camera views
const defaultRadiiScaleFactor = Math.pow(10, 6);
const defaultTimeStep = 20000//4320
const AU = 1.5 * Math.pow(10, 11) // meters
const parameters = {
    timeStep: defaultTimeStep, // 60 -> 1 Simulation hour per 1 Actual second (4320 -> 3 days / 1 second)
    scaleFactor: defaultDistanceScaleFactor,
    gravitationalN: 0,
    scaleWithZoom: true,
    cameraPositionMesh: null,
    lockCamera: false,
    pauseState: false,
    showTrails: true,
    lockCameraX: 10,
    lockCameraY: 10,
    lockCameraZ: 10,
    systemVelocityY: 0,
    radiusMod: 1,
    collectingData: true
}
const gravitationConstant = -6.67 * Math.pow(10, -11)
const stephen_boltzmann = 5.67 * Math.pow(10, -8) // sigma -> watts per (meter^2 * Kelvin^4)

const sunLuminosity = 3.828 * Math.pow(10, 26); // watts
const brownDwarfLuminosity = .01 * sunLuminosity

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
const brownDwarfMass = .05 * sunMass

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
const brownDwarfOrbitalDistance = 50 * AU

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
const brownDwarfOrbitalVelocity = -2000

const defaultRadiusScaler = 25 // arbitrary TODO -> realistic radii
let sunRadius =  defaultRadiusScaler * 696_000_000/2 / parameters.scaleFactor // meters
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
let brownDwarfRadius = defaultRadiusScaler * .12 * 696_000_000/2 / parameters.scaleFactor


// Comment out these lines to see radii to scale
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
brownDwarfRadius = .6 * radiusMod


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
const brownDwarfRotation = Math.PI * 2

const mercuryAlbedo = .12;
const venusAlbedo = .8;
const earthAlbedo = .2;
const marsAlbedo = .32;
const jupiterAlbedo = .5;
const saturnAlbedo = .34;
const uranusAlbedo = .3;
const neptuneAlbedo = .29;
const plutoAlbedo = .1;

const mercuryEmissivity = .9;
const venusEmissivity = .01;
const earthEmissivity = .7;
const marsEmissivity = .95;
const jupiterEmissivity = .2;
const saturnEmissivity = .3;
const uranusEmissivity = .4;
const neptuneEmissivity = .3;
const plutoEmissivity = .6;

const defaultTrailLength = 0; // -> find way to determine length of trail in AU?

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
    data;
   
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
        this.radiusMod = 1;

        this.defaultObject = 
        {
            x: this.x,
            y: this.y,
            z: this.z,
            vx: this.vx,
            vy: this.vy,
            vz: this.vz,
            mass: this.mass,
        }

        // This is for writing to a file for python graph
        this.data = "name, temp, time, distance"
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
    data;

    constructor(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation, luminosity, pointLightIntensity)
    {
        super(name, x, y, z, vx, vy, vz, mesh, mass, radius, rotation);
        this.luminosity = luminosity;
        this.defaultObject.luminosity = this.luminosity;
        const pointLight = new THREE.PointLight(this.mesh.emissive, pointLightIntensity, 500);
        this.pointLight = pointLight;
        scene.add(pointLight);

        this.data = "name, temp, time, distance"
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
    var texture = textureLoader.load('/textures/'+textureSource)
    var geometry = new THREE.SphereGeometry(radius, 32, 32)
    var material = new THREE.MeshStandardMaterial({
        map: texture,
        emissive: emissiveColor, 
        emissiveIntensity: emissiveIntensity
    })
    return new THREE.Mesh(geometry, material)
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
const calculateHabitableZoneRadius = (luminosity) =>
{
    var minTemp = 273.15
    var maxTemp = 353.15
    var albedo = .5
    var emissivity = .8

    var innerRadius = Math.pow(((1-albedo)*luminosity)/(4 * Math.PI * stephen_boltzmann * emissivity * Math.pow(maxTemp, 4)), 1/2) / parameters.scaleFactor
    var outerRadius = Math.pow(((1-albedo)*luminosity)/(4 * Math.PI * stephen_boltzmann * emissivity * Math.pow(minTemp, 4)), 1/2) / parameters.scaleFactor

    return {innerRadius, outerRadius}
}
const createHabitableZoneMesh = () =>
{
    var habitableRadii = calculateHabitableZoneRadius(sunLuminosity)
    var habitableZoneMaterial = new THREE.MeshBasicMaterial({color:0x00ff00, transparent: true, opacity: .5, side: THREE.DoubleSide})
    var habitableZoneGeometry = new THREE.RingGeometry(habitableRadii.innerRadius, habitableRadii.outerRadius, 64)
    var habitableZone = new THREE.Mesh(habitableZoneGeometry, habitableZoneMaterial)
    habitableZone.rotation.x = - Math.PI * .5
    habitableZone.visible = false
    return habitableZone
}
/**
 * Habitable Zone
 */
const habitableZone = createHabitableZoneMesh()
scene.add(habitableZone)

/**
 * Sky box http://paulbourke.net/miscellaneous/astronomy/
 */
const skyBox = createSkyBox("skyBox.png")
scene.add(skyBox)

/**
 * Body Meshes
 */
// Sun
const sun = createStarMesh(sunRadius, 'sun.jpg', '#FEC829', .75)
scene.add(sun)
// Mercury
const mercury = createBodyMesh(mercuryRadius, 'mercury.jpg')
scene.add(mercury)
// Venus
const venus = createBodyMesh(venusRadius, 'venus.jpg')
scene.add(venus)
// Earth
const earth = createBodyMesh(earthRadius, 'earth.jpg')
scene.add(earth)
// Earth's Moon
const moon = createBodyMesh(moonRadius, 'moon.jpg')
// scene.add(moon)
// Mars
const mars = createBodyMesh(marsRadius, 'mars.jpg')
scene.add(mars)
// Jupiter
const jupiter = createBodyMesh(jupiterRadius, 'jupiter.jpg')
scene.add(jupiter)
// Saturn
const saturnPlanetRotation = (25/180) * Math.PI
const saturn = createRingedBodyMesh(saturnRadius, 'saturnBody.jpg', 'saturnRing.png', saturnPlanetRotation, 1, 3, null) // 0xc7a34e
scene.add(saturn)
// Uranus
const uranusPlanetRotation = (92/180) * Math.PI
const uranus = createRingedBodyMesh(uranusRadius, 'uranusBody.jpg', 'uranusRing.png', uranusPlanetRotation, 1, 2.1, 0xb3fffd)
scene.add(uranus)
// Neptune
const neptune = createBodyMesh(neptuneRadius, 'neptune.jpg')
scene.add(neptune)
// Pluto
const pluto = createBodyMesh(plutoRadius, 'pluto.jpg')
scene.add(pluto)
// Brown Dwarf
const brownDwarf = createBodyMesh(brownDwarfRadius, 'brown_dwarf.jpeg', '#f74a28', .75)
scene.add(brownDwarf)

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
 * Planet Objects as Classes
 */
const sunObject = new Star('Sun', 0, 0, 0, 0, parameters.systemVelocityY, 0, sun, sunMass, sunRadius, sunRotation, sunLuminosity, 1.25);
const mercuryObject = new Planet('Mercury', mercuryOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, mercuryOrbitalVelocity, mercury, mercuryMass, mercuryRadius, mercuryRotation, mercuryAlbedo, mercuryEmissivity);
const venusObject = new Planet('Venus', venusOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, venusOrbitalVelocity, venus, venusMass, venusRadius, venusRotation, venusAlbedo, venusEmissivity);
const earthObject = new Planet('Earth', earthOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, earthOrbitalVelocity, earth, earthMass, earthRadius, earthRotation, earthAlbedo, earthEmissivity);
// const moonObject = new Body('Moon', AU, 2 * Math.pow(10, 7), 3.844 * Math.pow(10, 8), 0, -1000, -29783, moon, moonMass, moonRadius, moonRotation);
const marsObject = new Planet('Mars', marsOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, marsOrbitalVelocity, mars, marsMass, marsRadius, marsRotation, marsAlbedo, marsEmissivity);
const jupiterObject = new Planet('Jupiter', jupiterOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, jupiterOrbitalVelocity, jupiter, jupiterMass, jupiterRadius, jupiterRotation, jupiterAlbedo, jupiterEmissivity);
const saturnObject = new Planet('Saturn', saturnOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, saturnOrbitalVelocity, saturn, saturnMass, saturnRadius, saturnRotation, saturnAlbedo, saturnEmissivity);
const uranusObject = new Planet('Uranus', uranusOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, uranusOrbitalVelocity, uranus, uranusMass, uranusRadius, uranusRotation, uranusAlbedo, uranusEmissivity);
const neptuneObject = new Planet('Neptune', neptuneOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, neptuneOrbitalVelocity, neptune, neptuneMass, neptuneRadius, neptuneRotation, neptuneAlbedo, neptuneEmissivity);
const plutoObject = new Planet('Pluto', plutoOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, plutoOrbitalVelocity, pluto, plutoMass, plutoRadius, plutoRotation, plutoAlbedo, plutoEmissivity);
const brownDwarfObject = new Star('Brown Dwarf', brownDwarfOrbitalDistance, 0, 0, 0, parameters.systemVelocityY, brownDwarfOrbitalVelocity, brownDwarf, brownDwarfMass, brownDwarfRadius, brownDwarfRotation, brownDwarfLuminosity, 1);

const planets = 
[
    sunObject,
    mercuryObject,
    venusObject,
    earthObject,
    // moonObject,
    marsObject,
    jupiterObject,
    saturnObject,
    uranusObject,
    neptuneObject,
    plutoObject,
    brownDwarfObject
]

const updateRotations = () =>
{
    for(var planet of planets)
    {
        planet.mesh.rotation.y += planet.rotation * (parameters.timeStep / 600000)
    }
}
const updateRadii = () =>
{
    let ratio = defaultDistanceScaleFactor/parameters.scaleFactor

    for(var planet of planets)
    {
        planet.mesh.scale.setScalar(ratio * planet.radius * planet.radiusMod * parameters.radiusMod)
    }
    habitableZone.scale.setScalar(ratio)
}
const updatePlanets = () =>
{
        for(var planetA of planets)
        {
            let nextVX = 0
            let nextVY = 0
            let nextVZ = 0
        
            for(var planetB of planets)
            {
                if(planetA != planetB)
                {
                    var sameBaseDistanceDenominator = 
                        Math.pow(planetA.x - planetB.x, 2)
                        + Math.pow(planetA.y - planetB.y, 2)
                        + Math.pow(planetA.z - planetB.z, 2)

                    var distance = Math.pow(
                        sameBaseDistanceDenominator, 1/2.0)
                    var denominator = Math.pow(
                        sameBaseDistanceDenominator, 3/2.0)

                    var G = gravitationConstant * Math.pow((AU/distance), parameters.gravitationalN)
                    
                    if(planetB.mass >= sunMass*.1 || distance <= 10*AU)
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
    for(var body of planets)
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
const realisticRadii = () =>
{

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
    for(var planet of planets)
    {
        if(!parameters.pauseState)
            planet.updateTrail()
        var trailGeometry = new THREE.BufferGeometry().setFromPoints(planet.trail);
        var trailMesh = new THREE.Line(trailGeometry, planet.trailMaterial);
        trailHolder.push(trailMesh)
        if(parameters.showTrails)
            scene.add(trailMesh);
    }
}
const resetTrails = () =>
{
    for(var planet of planets)
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
    for(var body of planets)
    {
        body.x = body.defaultObject.x
        body.y = body.defaultObject.y
        body.z = body.defaultObject.z
        body.vx = body.defaultObject.vx
        body.vy = parameters.systemVelocityY
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
const updateSystemVelocity = () =>
{
    for(var body of planets)
    {
        body.vy = parameters.systemVelocityY
    }

}

/**
 * Temperature
 */
const calculateTemperature = (planet, star) =>
{
    var distance = getDistance(planet, star)

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
 * Download Data File
 * @param {*} filename 
 * @param {*} text 
 */
function download(filename, text) 
{
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function updatePlanetDownloadData(planet)
{
    planet.data += "\n"+planet.name+","
    +planet.planetTempText.innerText.split(": ")[1].trim()+","
    +parameters.timeStep+","
    +getDistance(planet, sunObject)
}
function updateStarDownloadData(star)
{
    star.data += "\n"+star.name+","
    +"staticTemp,"
    +parameters.timeStep+","
    +getDistance(star, sunObject)
}

function updateAllPlanetData()
{
    if(parameters.collectingData)
    {
        for(var body of planets)
        {
            if(body instanceof Planet)
            {
                updatePlanetDownloadData(body)
            }
            else if(body instanceof Star && body != sunObject)
            {
                updateStarDownloadData(body)
            }
        }
    }
}

function downloadAllPlanetData()
{
    if(parameters.collectingData)
    {
        for(var body of planets)
        {
            if(body instanceof Planet)
            {
                download(body.name+".txt", body.data)
            }
            else if(body instanceof Star && body != sunObject)
            {
                download(body.name+".txt", body.data)
            }
        }
        parameters.collectingData = false
    }
}

parameters.downloadData = downloadAllPlanetData



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
    planetFolder.add(planet, 'currentTrailLength').min(0).max(7500).step(10)
        .name(planet.name + " Trail Length").onFinishChange(planet.updatePreviousTrailLength)
    planetFolder.addColor(planet.trailMaterial, 'color').name(planet.name+" Trail Color")
    
}
const createStarGui = (star) =>
{
    const starFolder = bodiesFolder.addFolder(star.name).close()
    starFolder.add(star, 'camera').onFinishChange(updateCamera).name(star.name+" Camera")
    starFolder.add(star, 'radiusMod').min(1/defaultRadiusScaler).max(100).step(.01).name(star.name+" Radius")
    starFolder.add(star, 'luminosity').min(1*star.luminosity).max(20*star.luminosity)
        .step(100000).onFinishChange(star.updateMass).name(star.name+' Lumonosity')
    starFolder.add(star, 'mass').min(.05*star.defaultObject.mass).max(8*star.defaultObject.mass)
        .step(100000).onFinishChange(star.updateEmissiveLuminosity).name(star.name+' Mass')
    starFolder.add(star, 'currentTrailLength').min(0).max(7500).step(10)
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
        trailOptions.add(planet, 'currentTrailLength').min(0).max(7500).step(10)
        .name(planet.name + " Trail Length").onFinishChange(planet.updatePreviousTrailLength)
    }
    trailOptions.add(parameters, 'showTrails').name('Show Trails').onFinishChange(updateTrails).onFinishChange(resetTrails)
}
const setupGui = () =>
{
    const settingsFolder = gui.addFolder("Settings").close()
    settingsFolder.add(parameters, 'timeStep').min(100).max(200000).step(10).name('Time Step')
    settingsFolder.add(parameters, 'scaleFactor').min(defaultDistanceScaleFactor / 20).max(5 * defaultDistanceScaleFactor).step(10)
        .onChange(updateRadii).onFinishChange(resetTrails).onChange(updatePlanets).name("Zoom")
    settingsFolder.add(parameters, 'scaleWithZoom').name('Scale with Zoom')
    settingsFolder.add(skyBox, "visible").name("Sky Box Visible")
    settingsFolder.add(habitableZone, "visible").name("Habitable Zone Visible")
    settingsFolder.add(parameters, "systemVelocityY").min(-20000).max(20000).step(500).name("System Velocity Y").onChange(updateSystemVelocity)
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

gui.add(parameters, "downloadData").name("Download Data")

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
    if(event.key == 't')
    {
        if(!parameters.showTrails)
            parameters.showTrails = true
        else
            parameters.showTrails = false
    }
    if(event.key == 'z')
    {
        if(!habitableZone.visible)
            habitableZone.visible = true
        else
            habitableZone.visible = false
    }
})

/**
 * Attempt to place text over planets
 */
// let base = new THREE.Vector3(0, 0, 0)
// let coords_1 = base.applyMatrix4(earth.modelViewMatrix)
// let coords_2 = coords_1.applyMatrix4(camera.matrixWorldInverse)
// console.log(coords_2);

parameters.cameraPositionMesh = sun
var vector = new THREE.Vector3();

vector.set( earth.position.x, earth.position.y, earth.position.z );

function convert3Dto2D(vector, camera)
{
    // vector.project(camera);

    // map to 2D screen space
    vector.x = Math.round( (   vector.x + 1 ) * sizes.width  / 2 );
    vector.y = Math.round( ( - vector.y + 1 ) * sizes.height / 2 );
    vector.z = 0;

    return vector
}

let earthText = document.getElementById("earth")

function updatePlanetText(vector, planetText)
{
    planetText.style.left = vector.x+'px'
    planetText.style.top = vector.y+'px'
}

// vector = convert3Dto2D(vector)
// updatePlanetText(vector, earthText)


// Click to change Camera feature?


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
    }
    if(parameters.scaleWithZoom)
        updateRadii()
    
    // Sky Box
    updateSkyBox()
    
    // Update controls
    controls.update()

    // Camera
    updateCamera()

    // Habitable Zone
    if(habitableZone.visible)
        habitableZone.position.set(sun.position.x, sun.position.y, sun.position.z)

    // Render
    renderer.render(scene, camera)

    const endTime = timer.getElapsedTime()
    const drawTime = endTime - startTime

    if(Math.round(elapsedTime) % 2 == 0)
        console.log(Math.round(drawTime * 1000000) + " µs");

    updateTempText()

    // Update Plot Data
    updateAllPlanetData()
        
    window.requestAnimationFrame(tick)
}
tick()