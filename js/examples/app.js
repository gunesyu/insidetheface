	/*
	itü matematik mühendisliği lisans bitirme projesi
	gerçek zamanlı 3d yüz konstrüksiyonu uygulaması
	web kamera görüntüsünden yüz algılama ve takibi : Beyond Reality Face SDK - tastenkunst şirketi
	hem takip için hem rekonstrüksiyon için uyarlanacak olan yüz modeli : Candide3 - Jörgen Ahlberg, Linköping Uni.
	3d model ve sahne uygulamaları : WebGL & Three.js
	*/


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
	
	var container; //webgl container for renderer

	var stats;  //stats object (fps performance measurement)
	
	//camera options
	var	view = { left : 0.5, bottom : 0, width : 0.5, height : 1,
				 background : new THREE.Color().setRGB(0,0,0),
				 eye : [0, 0, 500], fov : 45 };

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

	
	function initScene(){

		container = document.getElementById('webgl-container');
		renderer.setPixelRatio(window.devicePixelRatio);
		renderer.setSize(640,480);
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
		camera = new THREE.PerspectiveCamera(view.fov, 640/480, 1, 5000);
		camera.position.x=view.eye[0];
		camera.position.y=view.eye[1];
		camera.position.z=view.eye[2];
		camera.name = "kamera";
		view.camera = camera;
		scene.add(camera);
		controls = new THREE.OrbitControls( camera, renderer.domElement );

		//stats
		stats = new Stats();
		stats.domElement.style.position = 'absolute';
		stats.domElement.style.top='0px';
		var sol = 75;
		//window.innerWidth/2-125;
		stats.domElement.style.left=sol+"px";
		container.appendChild(stats.domElement);

		//for raycast
		container.addEventListener( 'mousemove', onMouseMove, false );

		//dat.gui object
		gui = new dat.GUI();

		onlyOnce = 0;

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
			

			/* ---------------------------  BU BÖLÜMDE UPDATE SIKINTISI VAR  --------------------------- */

			/*matGui = faceGui.addFolder('Material');
			
			matGui.add( objConfig, 'lambert', true ).onChange( 
				function() {
					if (objConfig.lambert == false) {
						if (!objConfig.normal && !objConfig.basic && !objConfig.phong){
							objConfig.lambert=true;
							obj.material = matLambert;
						};
					}
					else {
					   obj.material = matLambert;
					   objConfig.basic = false;
					   objConfig.normal = false;
					   objConfig.phong = false;
					};
				} 
			).listen();

			matGui.add( objConfig, 'basic', false ).onChange(
				function() {
				    if (objConfig.basic == false) {
				    	if (!objConfig.normal && !objConfig.lambert && !objConfig.phong){
							objConfig.lambert=true;
							obj.material = matLambert;
						};
					}
					else {
					   obj.material = matBasic;
					   objConfig.lambert = false;
					   objConfig.normal = false;
					   objConfig.phong = false;
					};
				}
			).listen();

			matGui.add( objConfig, 'normal', false ).onChange(
				function() {
				    if (objConfig.normal == false) {
				    	if (!objConfig.lambert && !objConfig.basic && !objConfig.phong){
							objConfig.lambert=true;
							obj.material = matLambert;
						};
					}
					else {
					   obj.material = matNormal;
					   objConfig.basic = false;
					   objConfig.lambert = false;
					   objConfig.phong = false;
					};
				}
			).listen();

			matGui.add( objConfig, 'phong', false ).onChange(
				function() {
				    if (objConfig.phong == false) {
				    	if (!objConfig.normal && !objConfig.basic && !objConfig.lambert){
							objConfig.lambert=true;
							obj.material = matLambert;
						};
					}
					else {
					   obj.phong = matPhong;
					   objConfig.basic = false;
					   objConfig.normal = false;
					   objConfig.lambert = false;
					};
				}
			).listen();*/
			/* ---------------------------------------------------------------------------------  */

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
		/*
		else if (bool == false) {
			console.log("kaldir");
		}
		*/
	}

	function onMouseMove( event ) {

		mouse.x = ( (event.clientX - 640) / 640 ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
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


		/* -----------------   KESİŞİMİ KONTROL ET   ----------------- */
		//for ( var i = 0; i < intersects.length; i++ ) {
			//if (intersects[i].object.name == "kafa") {
				//console.log("kafayla kesisti");
			//};
		//}
		/* ----------------------------------------------------------- */

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



		/* 
		DÖNÜŞLERİ VE YAKLAŞIP UZAKLAŞMAYI ROTATION VE TRANSFORM İLE KONTROL ET
		BOUNDING SPHERE'İN' YARIÇAPININ ZAMANA GÖRE DEĞİŞİMİNİ KULLAN
		*/
		/* ---------------------------------------------------------------------- */
		//obj.rotation.y += 0.01;
		obj.geometry.computeBoundingSphere();
		//console.log(obj.geometry.boundingSphere);
		//console.log(clock.getDelta());
		/* ---------------------------------------------------------------------- */

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

	//window.onload = initScene;