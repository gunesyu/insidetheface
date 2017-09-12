var scene = new THREE.Scene();

var	renderer = window.WebGLRenderingContext ? new THREE.WebGLRenderer() : new THREE.CanvasRenderer();

var	light = new THREE.DirectionalLight(0xffffff);
var lightS = new THREE.SpotLight(0xffffff, 1.0);

var	camera;

var zPositions;  //candide face model vertice depth
var geom;  //face geometry
var obj;   //face

//face materials
var matLambert = new THREE.MeshLambertMaterial( {color : 0xE0E0E0} );
var matPhong = new THREE.MeshPhongMaterial( {color : 0xE0E0E0} );
var matBasic = new THREE.MeshBasicMaterial( {color : 0xE0E0E0} );
var matNormal = new THREE.MeshNormalMaterial( {color : 0xE0E0E0} );

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();

var controls;  //camera orbit control

var mouse = { x: -1000, y: -1000 };  //for raycast

var stage;
var container; //webgl container for renderer

var stats;  //stats object (fps performance measurement)

//scene view options
var axes = new THREE.AxisHelper(500);
var gridXZ = new THREE.GridHelper(500, 25);
var gridXY = new THREE.GridHelper(500, 25);
var gridYZ = new THREE.GridHelper(500, 25);

var onlyOnce = 0; //counter to not adding gui object repeatedly

//gui configuration initializations
var objConfigData = function() {
		this.wireframe = false;
		this.grid = true;
		this.axes = true;
		this.normal = false;
		this.basic = false;
		this.lambert = true;
		this.phong = false;
	};
var objConfig = new objConfigData();
var gui;
var faceGui;
var matGui;
var sceneGui;

var brfLogo;
var stageStats;


function initScene(){

	stage = document.getElementById("stage");
	container = document.getElementById('webgl-container');
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.setSize(
		640,480);
	container.appendChild(renderer.domElement);
	
	//directional light
	light.position.set(0,0,-500);
	light.name = "DirectionalLight";
	scene.add(light);
	//spot light
	lightS.position.set(0, 0, 1000);
	lightS.name = "SpotLight";
	lightS.target.position.set(0,0,0);
	scene.add(lightS);

	//camera
	camera = new THREE.PerspectiveCamera(45, 640/480, 1, 5000);
	camera.position.z = 500;
	scene.add(camera);
	controls = new THREE.OrbitControls( camera, renderer.domElement );

	//stats
	stats = new Stats();
	stats.domElement.style.position = 'absolute';
	stats.domElement.style.top='0px';
	stats.domElement.style.left='0px';
	stats.domElement.id = "newStats"
	container.appendChild(stats.domElement);

	//for raycast
	container.addEventListener( 'mousemove', onMouseMove, false );

	//dat.gui object
	gui = new dat.GUI();

	onlyOnce = 0;

	document.getElementById("move").addEventListener("click", moveStage, false);

	brfLogo = document.querySelector("div#brfLogo");

	animate();
}

function initFace(faceShape){

	//candide model 
	// (x,y) coordinates are taken from ExampleCandideTracking.js with BRF faceShape
	// z coordinates from candide.wfm file
	zPositions = [-0.371000,-0.024000,0.085000,0.107000,0.085000,0.210000,0.124000,
					0.142000,0.150000,0.107000,0.063000,-0.371000,-0.328000,-0.111000,
					-0.328000,-0.111000,0.0300000,0.107000,0.0300000,-0.002000,-0.111000,
					-0.000000,-0.000000,-0.000000,-0.000000,0.037000,0.037000,-0.045000,
					-0.328000,-0.328000,-0.328000,-0.000000,0.000000,0.150000,-0.024000,
					0.085000,0.107000,0.085000,0.210000,0.124000,0.124000,0.150000,0.107000,
					0.063000,-0.371000,-0.328000,-0.111000,-0.328000,-0.111000,0.030000,
					0.107000,0.030000,-0.002000,-0.111000,-0.000000,-0.000000,-0.000000,
					-0.000000,0.037000,0.037000,-0.045000,-0.328000,-0.328000,-0.328000,
					-0.000000,0.000000,0.150000,-0.0300000,-0.0300000,-0.0300000,-0.0300000,
					-0.0300000,-0.0300000,-0.0300000,-0.0300000,0.150000,0.150000,0.063000,
					0.063000,0.063000,0.063000,0.050000,0.050000,0.050000,0.050000,0.063000,
					0.063000,0.124000,-0.024000,-0.024000,-0.050000,-0.050000,0.050000,0.050000,
					0.100000,-0.056000,-0.056000,-0.056000,-0.056000,-0.056000,-0.056000,-0.067000,
					-0.067000,-0.013000,-0.013000,-0.013000,-0.013000,-0.013000,-0.013000,-0.024000,
					-0.024000,0.100000,0.100000];
	geom = new THREE.Geometry();
	//form of candideShapeVertices array is a single line of coordinates instead of ordered pairs, i.e., (x,y),(x,y),.. --> x,y,x,y,..
	for (var i = 0; i < faceShape.candideShapeVertices.length/2; i++) {
		geom.vertices.push(new THREE.Vector3(faceShape.candideShapeVertices[2*i]-335, faceShape.candideShapeVertices[2*i+1]-275, zPositions[i]*150));
	};
	//candideShapeTriangles array is constructed same way
	for (var i = 0; i < faceShape.candideShapeTriangles.length/3; i++) {
		geom.faces.push(new THREE.Face3(faceShape.candideShapeTriangles[3*i], faceShape.candideShapeTriangles[3*i+1], faceShape.candideShapeTriangles[3*i+2]));
	};
	geom.computeFaceNormals();
	//geom.computeVertexNormals();

	obj = new THREE.Mesh(geom, matLambert);
	obj.material.side = THREE.DoubleSide;
	//don't know why the face appears upside down : 
	obj.rotateZ(Math.PI);
	obj.name = "kafa";
	scene.add(obj);

	//axes and grid
	axes.position.set(0,0,0);
	scene.add(axes);
	
	gridXZ.setColors( new THREE.Color(0x006600), new THREE.Color(0x006600) );
	gridXZ.position.set( 0,0,0 );
	scene.add(gridXZ);
	
	gridXY.position.set( 0,0,0 );
	gridXY.rotation.x = Math.PI/2;
	gridXY.setColors( new THREE.Color(0x000066), new THREE.Color(0x000066) );
	scene.add(gridXY);

	gridYZ.position.set( 0,0,0 );
	gridYZ.rotation.z = Math.PI/2;
	gridYZ.setColors( new THREE.Color(0x660000), new THREE.Color(0x660000) );
	scene.add(gridYZ);

	if(onlyOnce==0){
		guiController(true);
		onlyOnce++;
	}
	
}

function guiController(bool){
	//dat.gui controls
	
	if(bool == true){
		
		//face wireframe and material options
		faceGui = gui.addFolder('Yuz Modu');
		faceGui.open();
		
		faceGui.add( objConfig, 'wireframe', false ).onChange(
			function() {
				obj.material.wireframe = objConfig.wireframe;
			} 
		);

		//scene grid and axis options
		sceneGui = gui.addFolder('Sahne Modu');
		sceneGui.open();
		
		sceneGui.add( objConfig, 'grid', true).onChange( function() {
			if (objConfig.grid == false) {
				scene.remove(gridXZ);
				scene.remove(gridXY);
				scene.remove(gridYZ);
			}
			else {
				scene.add(gridXZ);
				scene.add(gridXY);
				scene.add(gridYZ);
			};
		}).listen();
		sceneGui.add( objConfig, 'axes', true).onChange( function() {
			if (objConfig.axes == false) {
				scene.remove(axes);
			}
			else {
				scene.add(axes);
			};
		}).listen();
	}
}

function onMouseMove( event ) {

	mouse.x = ( (event.clientX - 640) / 640 ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
}

function moveStage(){
	
	var newWidth, newHeight, newLeft, newTop, ratio;
	stageStats = document.getElementById("stats");

	if(this.innerHTML == "MOVE"){
		newWidth = 256;
		newHeight = 192;
		newLeft = window.innerWidth - 256;
		newTop = window.innerHeight - 192;
		this.style.height = "25px";
		this.innerHTML = "PUT BACK";
		ratio = window.innerWidth/window.innerHeight;

		container.style.left = "0px";
		this.style.left = window.innerWidth - 256 + "px";
		this.style.top = window.innerHeight - 192 + "px";
		brfLogo.style.left = window.innerWidth - 55+ "px";
		brfLogo.style.top = window.innerHeight - 40 + "px";
		brfLogo.firstElementChild.firstElementChild.style.width = "45px";
		brfLogo.lastElementChild.lastElementChild.style.width = "45px";
		stageStats.style.left = window.innerWidth - 80+ "px";
		stageStats.style.top = window.innerHeight - 192 + "px";

		renderer.setSize(window.innerWidth*.95, window.innerHeight*.95);

	}else{
		newWidth = 640;
		newHeight = 480;
		newLeft = 0;
		newTop = 0;
		this.innerHTML = "MOVE";
		this.style.height = "40px";
		ratio = 640/480;

		container.style.left = "640px";
		this.style.left = "560px";
		this.style.top = "440px";
		brfLogo.style.left = "0px";
		brfLogo.style.top = "0px";
		brfLogo.firstElementChild.firstElementChild.style.width = "100px";
		brfLogo.lastElementChild.lastElementChild.style.width = "100px";
		stageStats.style.left = "560px";
		stageStats.style.top = "0px";

		renderer.setSize(640, 480);
	
	}
	stage.style.width = newWidth+"px";
	stage.style.height = newHeight+"px";
	stage.style.left = newLeft+"px";
	stage.style.top = newTop+"px";

	camera.aspect = ratio;
}

function animate(){

	render();
	stats.update();

	requestAnimationFrame( animate );

}

function render(){

	// update the picking ray with the camera and mouse position	
	raycaster.setFromCamera( mouse, camera );	
	// calculate objects intersecting the picking ray
	var intersects = raycaster.intersectObjects( scene.children );

	renderer.render(scene, camera);

}

var clock = new THREE.Clock();

function updateFace(faceShape){

	//call from updateGUI at ExampleCandideTracking.js (my updated version) line 134
	//update face model after the head moves

	obj.geometry.dynamic=true;
	
	for (var i = 0; i < obj.geometry.vertices.length; i++) {
		obj.geometry.vertices[i].x = faceShape.candideShapeVertices[2*i]-335;
		obj.geometry.vertices[i].y = faceShape.candideShapeVertices[2*i + 1]-275;
	};
	
	obj.geometry.verticesNeedUpdate=true;
	obj.geometry.elementsNeedUpdate=true;
	obj.geometry.normalsNeedUpdate=true;
	obj.geometry.colorsNeedUpdate=true;
	obj.geometry.tangentsNeedUpdate=true;
	obj.geometry.computeFaceNormals();

	obj.geometry.computeBoundingSphere();

}

function destroyScene(){

	guiController(false);
	objConfig.grid = true;
	objConfig.axes = true;
	scene.remove(obj);
	scene.remove(axes);
	scene.remove(gridXY);
	scene.remove(gridYZ);
	scene.remove(gridXZ);
}