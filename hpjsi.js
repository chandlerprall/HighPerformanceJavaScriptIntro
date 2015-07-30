(function(){
	var scene, renderer, camera,
		camera_fov = 55,
		tan_fov = Math.tan( ( ( Math.PI / 180 ) * camera_fov / 2 ) );

	function initGoblin() {

	}

	function initThree() {
		// Setup scene, renderer, and camera
		scene = new THREE.Scene();

		renderer = new THREE.WebGLRenderer({ antialias: true });
		renderer.shadowMapEnabled = true;

		renderer.setSize( window.innerWidth, window.innerHeight );
		document.body.appendChild( renderer.domElement );

		camera = new THREE.PerspectiveCamera( camera_fov, 800 / 640, 1, 100 );
		camera.position.set( 0, 5, 20 );
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
			new THREE.PlaneBufferGeometry( 50, 50 ),
			new THREE.MeshPhongMaterial({
				map: THREE.ImageUtils.loadTexture('textures/floor_diffuse.jpg'),
				normalMap: THREE.ImageUtils.loadTexture('textures/floor_normal.png'),
				specularMap: THREE.ImageUtils.loadTexture('textures/floor_specular.jpg'),
				normalScale: new THREE.Vector2( 4, 4 )
			})
		);
		floor.receiveShadow = true;
		floor.quaternion.set( -1, 0, 0, 1 ).normalize();
		floor.material.map.wrapS = floor.material.map.wrapT = THREE.RepeatWrapping;
		floor.material.map.repeat.set( 10, 10 );
		floor.material.map.anisotropy = 8;
		floor.material.normalMap.wrapS = floor.material.normalMap.wrapT = THREE.RepeatWrapping;
		floor.material.normalMap.repeat.set( 10, 10 );
		floor.material.specularMap.wrapS = floor.material.specularMap.wrapT = THREE.RepeatWrapping;
		floor.material.specularMap.repeat.set( 10, 10 );

		scene.add( floor );
	}

	var letter_geometry = {};
	function initLetter(letter) {
		if ( letter_geometry.hasOwnProperty(letter) ) {
			return letter_geometry[letter];
		}

		var height = 0.5;
		var size = 2;
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

		text_geometry.computeBoundingBox();
		//text_geometry.applyMatrix(new THREE.Matrix4().setPosition( text_geometry.boundingBox.min ));
		//text_geometry.computeBoundingBox();
		text_geometry.computeVertexNormals();

		return letter_geometry[letter] = text_geometry;
	}

	var text_material = new THREE.MeshFaceMaterial([
		new THREE.MeshPhongMaterial( { color: 0xff5533, shading: THREE.FlatShading } ), // front
		new THREE.MeshPhongMaterial( { color: 0xff5533, shading: THREE.SmoothShading } ) // side
	]);
	function initWord(word, spacing, position) {
		var letters = [];

		var letter_offset = 0;
		for ( var i = 0; i < word.length; i++ ) {
			var letter_geometry = initLetter( word[i] );
			var letter_mesh = new THREE.Mesh( letter_geometry, text_material );
			letter_mesh.receiveShadow = letter_mesh.castShadow = true;
			letter_mesh.position.x = letter_offset;
			letter_offset += letter_geometry.boundingBox.max.x - letter_geometry.boundingBox.min.x + spacing;

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
		var letters = initWord( 'JavaScript', 0.15, new THREE.Vector3(0, 0.6, 0) );
	}

	function onWindowResize() {
		camera.aspect = window.innerWidth / window.innerHeight;
		camera.fov = ( 360 / Math.PI ) * Math.atan( tan_fov * ( window.innerHeight / 640 ) );
		camera.updateProjectionMatrix();
		renderer.setSize( window.innerWidth, window.innerHeight );
	}

	function render() {
		requestAnimationFrame( render );
		renderer.render( scene, camera );
	}

	initGoblin();
	initThree();
	initLights();
	initFloor();
	initWords();

	onWindowResize();
	render();
})();