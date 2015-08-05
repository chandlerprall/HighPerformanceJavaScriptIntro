(function(){
	var scene, renderer, camera,
		camera_fov = 55,
		tan_fov = Math.tan( ( ( Math.PI / 180 ) * camera_fov / 2 ) ),
		physics_objects = [],
		world;

	function initGoblin() {
		world = new Goblin.World( new Goblin.SAPBroadphase(), new Goblin.NarrowPhase(), new Goblin.IterativeSolver() );
	}

	function initThree() {
		// Setup scene, renderer, and camera
		scene = new THREE.Scene();

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.shadowMapEnabled = true;

		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		camera = new THREE.PerspectiveCamera( camera_fov, 800 / 640, 1, 100 );
		camera.position.set( 0, 15, 50 );
		camera.lookAt( scene.position );

		window.addEventListener( 'resize', onWindowResize );
	}

	function initLights() {
		var ambient = new THREE.AmbientLight( 0x111111 );
		scene.add( ambient );

		var spotlight = new THREE.SpotLight( 0xFFFFFF, 2, 50, Math.PI / 1.2, 10, 2 );
		spotlight.position.set( 10, 5, 15 );
		spotlight.castShadow = true;
		spotlight.shadowCameraNear = 1;
		spotlight.shadowCameraFar = 50;
		spotlight.shadowCameraFov = 50;
		spotlight.shadowBias = 0;
		spotlight.shadowDarkness = 0.5;
		spotlight.shadowMapWidth = 1024;
		spotlight.shadowMapHeight = 1024;
		scene.add( spotlight );

		var spotlight = new THREE.SpotLight( 0xFFFFFF, 2, 50, Math.PI / 1.2, 10, 2 );
		spotlight.position.set( -10, 5, 15 );
		spotlight.castShadow = true;
		spotlight.shadowCameraNear = 1;
		spotlight.shadowCameraFar = 50;
		spotlight.shadowCameraFov = 50;
		spotlight.shadowBias = 0;
		spotlight.shadowDarkness = 0.5;
		spotlight.shadowMapWidth = 1024;
		spotlight.shadowMapHeight = 1024;
		scene.add( spotlight );
	}

	function initFloor() {
		var floor = new THREE.Mesh(
			new THREE.PlaneGeometry( 50, 50, 0, 0 ),
			new THREE.MeshPhongMaterial({
				map: THREE.ImageUtils.loadTexture('textures/floor_diffuse.jpg'),
				normalMap: THREE.ImageUtils.loadTexture('textures/floor_normal.png'),
				specularMap: THREE.ImageUtils.loadTexture('textures/floor_specular.jpg'),
				normalScale: new THREE.Vector2( 4, 4 )
			})
		);
		floor.receiveShadow = true;
		floor.geometry.applyMatrix(new THREE.Matrix4().makeRotationFromQuaternion( new THREE.Quaternion( -1, 0, 0, 1 ).normalize() ));
		floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping;
		floor.material.map.repeat.set( 10, 10 );
		floor.material.map.anisotropy = 8;
		floor.material.normalMap.wrapS = floor.material.normalMap.wrapT = THREE.RepeatWrapping;
		floor.material.normalMap.repeat.set( 10, 10 );
		floor.material.specularMap.wrapS = floor.material.specularMap.wrapT = THREE.RepeatWrapping;
		floor.material.specularMap.repeat.set( 10, 10 );

		var rigid_body = new Goblin.RigidBody(
			new Goblin.BoxShape(25, 0.001, 25),
			Infinity
		);

		scene.add( floor );
		world.addRigidBody( rigid_body );
	}

	var letter_geometry = {};
	function initLetter(letter) {
		if ( letter_geometry.hasOwnProperty(letter) ) {
			return letter_geometry[letter];
		}

		var height = 0.5;
		var size = 4;
		var text_geometry = new THREE.TextGeometry(
			letter,
			{
				size: size,
				height: height,
				curveSegments: 4,

				font: 'droid sans',
				weight: 'normal',
				style: 'normal',

				bevelEnabled: false
			}
		);
		//text_geometry = new THREE.BoxGeometry( 1, 1, 1, 10, 10, 10 );
		text_geometry.center();
		//text_geometry.computeBoundingBox();
		text_geometry.computeVertexNormals();

		window.letter = text_geometry;

		return letter_geometry[letter] = text_geometry;
	}

	var text_material = new THREE.MeshFaceMaterial([
		new THREE.MeshPhongMaterial( { color: 0xff5533, shading: THREE.FlatShading } ), // front
		new THREE.MeshPhongMaterial( { color: 0xff5533, shading: THREE.SmoothShading } ) // side
	]);
	//text_material = new THREE.MeshLambertMaterial({ color: 0x4444FF });
	function initWord(word, spacing, position) {
		var letters = [];

		var letter_offset = 0;
		for ( var i = 0; i < word.length; i++ ) {
			var letter_geometry = initLetter( word[i] );
			var letter_mesh = new THREE.Mesh( letter_geometry, text_material );
			letter_mesh.receiveShadow = letter_mesh.castShadow = true;
			letter_offset += (letters.length > 0 ? letters[letters.length-1].geometry.boundingBox.max.x : 0) +
				letter_geometry.boundingBox.max.x +
				spacing;
			letter_mesh.position.x = letter_offset;

			// Add bounding frame
			var bounding_frame = new THREE.Mesh(
				new THREE.BoxGeometry( letter_geometry.boundingBox.max.x - letter_geometry.boundingBox.min.x, letter_geometry.boundingBox.max.y - letter_geometry.boundingBox.min.y, letter_geometry.boundingBox.max.z - letter_geometry.boundingBox.min.z ),
				new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true })
			);
			letter_mesh.add(bounding_frame);

			scene.add( letter_mesh );
			letters.push(letter_mesh);
		}

		var word_offset = letter_offset / 2;
		for ( i = 0; i < letters.length; i++ ) {
			letters[i].position.x += position.x - word_offset;
			letters[i].position.y = position.y;
			letters[i].position.z = position.z;
		}

		return letters;
	}

	function initWords() {
		var letters = initWord( 'JavaScript', 1, new THREE.Vector3(0, 2, 0) ),
			letter_shapes = letters.map(function(letter) {
				var physics_shape = goblinShapeFromGeometry(letter.geometry ),
					rigid_body = new Goblin.RigidBody(physics_shape, 1);
					//rigid_body = new Goblin.RigidBody(physics_shape, Infinity);

				rigid_body.mesh = letter;
				rigid_body.position.x = letter.position.x;
				rigid_body.position.y = letter.position.y;
				rigid_body.position.z = letter.position.z;

				world.addRigidBody( rigid_body );
				physics_objects.push( rigid_body );
			});
	}

	function goblinShapeFromGeometry(geometry) {
		/*return new Goblin.ConvexShape(geometry.vertices.map(function(vertex){
			return new Goblin.Vector3( vertex.x, vertex.y, vertex.z );
		}));*/
		return new Goblin.MeshShape(
			geometry.vertices.map(function( vertex ){
				return new Goblin.Vector3( vertex.x, vertex.y, vertex.z )
			}),
			geometry.faces.reduce(
				function( faces, face ) {
					faces.push( face.a, face.b, face.c );
					return faces;
				},
				[]
			)
		);
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.fov = ( 360 / Math.PI ) * Math.atan( tan_fov * ( window.innerHeight / 640 ) );
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function render() {
		requestAnimationFrame( render );

		world.step( 1 / 60 );
		physics_objects.forEach(function(body){
			body.mesh.position.x = body.position.x;
			body.mesh.position.y = body.position.y;
			body.mesh.position.z = body.position.z;

			body.mesh.rotation.x = body.rotation.x;
			body.mesh.rotation.y = body.rotation.y;
			body.mesh.rotation.z = body.rotation.z;
			body.mesh.rotation.w = body.rotation.w;
		});

		displayContacts();

		renderer.render( scene, camera );
	}

	var displayContacts = (function(){
		var contacts = [],
			sphere = new THREE.SphereGeometry( 0.4 ),
			material = new THREE.MeshNormalMaterial(),
			normal_material = new THREE.LineBasicMaterial({ color: 0x00ff00 });

		return function() {
			while ( contacts.length ) {
				scene.remove( contacts.pop() );
			}

			var manifold = world.narrowphase.contact_manifolds.first;
			while ( manifold ) {
				for ( var i = 0; i < manifold.points.length; i++ ) {
					var mesh = new THREE.Mesh( sphere, material );
					mesh.position.copy( manifold.points[i].contact_point );
					scene.add( mesh );
					contacts.push( mesh );

					var normal_geometry = new THREE.Geometry();
					normal_geometry.vertices.push( mesh.position.clone() );
					normal_geometry.vertices.push( new THREE.Vector3().copy( manifold.points[i].contact_normal ).multiplyScalar( 2 ).add( mesh.position ) );
					var normal = new THREE.Line( normal_geometry, normal_material );
					scene.add( normal );
					contacts.push( normal );
				}
				manifold = manifold.next_manifold;
			}
		};
	})();

	initGoblin();
	initThree();
	initLights();
	initFloor();
	initWords();

	onWindowResize();
	render();
})();