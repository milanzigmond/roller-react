import React, { Component } from 'react';
import PropTypes from 'prop-types';

import React3 from 'react-three-renderer';
import * as THREE from 'three';
import CANNON from 'cannon';

export default class Roller extends Component {
  static propTypes = {
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    roll: PropTypes.array.isRequired,
  };

  constructor(props, context) {
    super(props, context);

    const {
      width,
      height
    } = props;

    this.dice = [];

    this.state = {
      deskTextureLoaded: false,
      cubeRotation: new THREE.Euler(),  
    };
    
    this._onAnimate = () => {
      this.setState({
        cubeRotation: new THREE.Euler(
          this.state.cubeRotation.x + 0.01,
          this.state.cubeRotation.y + 0.01,
          0,
        ),
      });
    };

    // settings
    this.dimensions = { w: 400, h: 300 }; // default
    this.use_true_random = true;
    this.frame_rate = 1 / 60;
    this.clear_color = '#666666';
    this.label_color = '#aaaaaa';
    this.dice_color = '#202020';
    this.spot_light_color = 'white';
    this.ambient_light_color = '#d7ad59';
    this.selector_back_colors = {
      color: 0x404040,
      shininess: 0,
      emissive: 0x858787,
    };
    this.dice_mass = 300;
    this.dice_inertia = 10;
    this.scale = 100;
    this.random_storage = [];
    this.throwData = {};
    this.throwVector = {};
    this.boost = 0;
    this.shadow_map_type = THREE.PCFSoftShadowMap;
    this.wrapping = THREE.RepeatWrapping;

    this.deskColor = 'purple';
    this.deskSpecular = 'white';
    this.deskShininess = 2;
    this.repeat = new THREE.Vector2(40, 40);

    this.test = false;

    this.create_geometry = function (radius) {
      const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
        [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
      return Roller.create_geom(vertices, faces, radius, -0.2, Math.PI / 4, 0.9);
    };

    this.create_mesh = function () {
      if (!this.d6_geometry) this.d6_geometry = this.create_geometry(this.scale);

      const specularColor = 'brown';
      const shineness = 5;
      const shading = THREE.FlatShading;

      const materials = [
        new THREE.MeshPhongMaterial({
          // map: new THREE.TextureLoader().load('./img/material.png'),
          map: new THREE.TextureLoader().load('./img/wood.jpg'),
          // color: 0x000000,
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          color: 0x00ff00,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/1.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/2.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/3.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/4.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/5.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/6.png'),
          specular: specularColor,
          shininess: shineness,
          shading,
        }),

      ];

      return new THREE.Mesh(this.d6_geometry, materials);
    };

    // window.addEventListener('resize', () => {
    //   const newW = `${window.innerWidth - 1}px`;
    //   const newH = `${window.innerHeight - 1}px`;
    //   container.style.width = newW;
    //   container.style.height = newH;
    //   this.reinit(container);
    // });
    
    // this.use_adapvite_timestep = true;
    // this.animate_selector = true;

    this.cw = width / 2;
    this.ch = height / 2;
    
    this.w = width / 4;
    this.h = height / 4;

    this.mw = Math.max(this.w, this.h);

    this.aspect = 2;
    this.scale = Math.sqrt((this.w * this.w) + (this.h * this.h)) / 8;

    this.wh = this.ch / this.aspect / Math.tan((10 * Math.PI) / 180);

    this.cameraPosition = new THREE.Vector3(0, 0, this.wh);
    this.lightPosition = new THREE.Vector3(-this.mw / 2, this.mw / 2, this.mw * 2);
    this.lightTarget = new THREE.Vector3(0, 0, 0);

    // cannon
    this.dices = [];
    this.meshRefs = [];
    
    const world = new CANNON.World();
    
    
    
    const initCannon = () => {
      world.gravity.set(0, 0, -9.8 * 800);
      world.broadphase = new CANNON.NaiveBroadphase();
      world.solver.iterations = 16;
      
      this.dice_body_material = new CANNON.Material();
      this.desk_body_material = new CANNON.Material();
      this.barrier_body_material = new CANNON.Material();
      world.addContactMaterial(
        new CANNON.ContactMaterial(
          this.desk_body_material, 
          this.dice_body_material, 
          { 
            friction: 0.01, 
            restitution: 0.5
          }
        )
      );
      // world.addContactMaterial(new CANNON.ContactMaterial(
      //   this.barrier_body_material, this.dice_body_material, 0, 1.0));
      // world.addContactMaterial(new CANNON.ContactMaterial(
      //   this.dice_body_material, this.dice_body_material, 0, 0.5));

      world.add(new CANNON.Body(0, new CANNON.Plane(), this.desk_body_material));
      let barrier;
      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
      barrier.position.set(0, this.h * 0.93, 0);
      world.add(barrier);

      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      barrier.position.set(0, -this.h * 0.93, 0);
      world.add(barrier);

      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
      barrier.position.set(this.w * 0.93, 0, 0);
      world.add(barrier);

      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
      barrier.position.set(-this.w * 0.93, 0, 0);
      world.add(barrier);



      // const mass = 5;

      // const boxShape = new CANNON.Box(new CANNON.Vec3(0.25, 0.25, 0.25));

      // for (let i = 0; i < N; ++i) {
      //   const boxBody = new CANNON.Body({
      //     mass,
      //   });

      //   boxBody.addShape(boxShape);
      //   boxBody.position.set(
      //     -2.5 + Math.random() * 5,
      //     2.5 + Math.random() * 5,
      //     -2.5 + Math.random() * 5);
      //   world.addBody(boxBody);
      //   bodies.push(boxBody);

      //   meshRefs.push((mesh) => {
      //     if (mesh) {
      //       mesh.userData._bodyIndex = i;

      //       this.meshes.push(mesh);
      //     }
      //   });
      // }

      // const groundShape = new CANNON.Plane();
      // const groundBody = new CANNON.Body({ mass: 0 });

      // groundBody.addShape(groundShape);
      // groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);

      // // WAIT A MINUTE I CAN CREATE A REACT RENDERER FOR CANNON
      // // patience is a virtue
      // // breathe in breathe out breathe in breathe out
      // // let's finish this one first

      // world.addBody(groundBody);

      // const shape = new CANNON.Sphere(0.1);
      // const jointBody = new CANNON.Body({ mass: 0 });
      // jointBody.addShape(shape);
      // jointBody.collisionFilterGroup = 0;
      // jointBody.collisionFilterMask = 0;

      // world.addBody(jointBody);

      // this.jointBody = jointBody;
    };

    initCannon();


    

    // this.last_time = 0;
    // this.running = false;



    // this.__animate(threadid) {
    //   const time = (new Date()).getTime();
    //   let time_diff = (time - this.last_time) / 1000;
    //   if (time_diff > 3) time_diff = this.frame_rate;
    //   ++this.iteration;
    //   if (this.use_adapvite_timestep) {
    //     while (time_diff > this.frame_rate * 1.1) {
    //       this.world.step(this.frame_rate);
    //       time_diff -= this.frame_rate;
    //     }
    //     this.world.step(time_diff);
    //   } else {
    //     this.world.step(this.frame_rate);
    //   }

    //   this.scene.children.forEach((child) => {
    //     if (child.body !== undefined) {
    //       child.position.copy(child.body.position);
    //       child.quaternion.copy(child.body.quaternion);
    //     }
    //   });

    //   this.renderer.render(this.scene, this.camera);
    //   this.last_time = this.last_time ? time : (new Date()).getTime();
    //   if (this.running === threadid && this.check_if_throw_finished()) {
    //     this.running = false;
    //     if (this.callback) this.callback.call(this, Roller.get_dice_values(this.dices));
    //   }
    //   const that = this;
    //   if (this.running === threadid) {
    //     (function (t, tid, uat) {
    //       if (!uat && time_diff < that.frame_rate) {
    //         setTimeout(() => {
    //           requestAnimationFrame(() => {
    //             t.__animate(tid);
    //             that.stats.update();
    //             // update stats
    //           });
    //         }, (that.frame_rate - time_diff) * 1000);
    //       } else {
    //         requestAnimationFrame(() => {
    //           t.__animate(tid);
    //           // update stats
    //           that.stats.update();
    //         });
    //       }
    //     }(this, threadid, this.use_adapvite_timestep));
    //   }
    // }

  }


  // componentDidMount() {
  //   const {
  //     desk,
  //   } = this.refs;

  //   this.loader = new THREE.TextureLoader();
  //   const that = this;
  //   this.loader.load(
  //     // resource URL
  //     './img/pattern.png',
  //     // Function when resource is loadede
  //     function ( texture ) {
  //       // do something with the texture
  //       // that.deskTexture

  //       // desk.material.map = texture;
  //       // var material = new THREE.MeshBasicMaterial( {
  //       //   map: texture
  //       // } );
  //     },
  //     // Function called when download progresses
  //     function ( xhr ) {
  //       console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
  //     },
  //     // Function called when download errors
  //     function ( xhr ) {
  //       console.log( 'An error happened' );
  //     }
  //   );
  // }


  render() {
    
    const {
      width,
      height,
    } = this.props;

    const {
      scene
    } = this.refs;
    
    const {
    } = this.state;

    return (
      <div ref="container">
        <React3 
          antialias
          mainCamera="camera" 
          width={width} 
          height={height}

          onAnimate={this._onAnimate}
          clearColor={this.clear_color}
          shadowMapEnabled
          shadowMapType={this.shadow_map_type}
        >
          <scene
            ref='scene'
          >
            <perspectiveCamera
              name="camera"
              fov={20}
              aspect={width / height}
              near={1}
              far={this.wh*1.3}
              position={this.cameraPosition}
            />
            <spotLight
              color={this.spot_light_color}
              intensity={1.5}
              distance={this.mw * 3}

              castShadow

              shadowMapWidth={1024}
              shadowMapHeight={1024}

              shadowBias={0.0001}
              shadowCameraFar={this.mw * 5}
              shadowCameraNear={this.mw / 10}
              shadowCameraFov={50}

              position={this.lightPosition}
              lookAt={this.lightTarget}
            />
            <ambientLight
              color={this.ambient_light_color}
            />
            <mesh rotation={this.state.cubeRotation}>
              <boxGeometry width={100} height={100} depth={50} />
              <meshBasicMaterial color={0x00ff00} wireframe />
            </mesh>
            <mesh
              ref='desk'
              receiveShadow
            >
              <planeGeometry
                width={this.w*2}
                height={this.h*2}
                widthSegments={1}
                heightSegments={1}
              />
              <meshPhongMaterial
                color={this.deskColor}
                specular={this.deskSpecular}
                shininess={this.deskShininess}
              >
                <texture 
                  url="img/pattern.png"
                  wrapS={this.wrapping}
                  wrapT={this.wrapping}
                  repeat={this.repeat}
                />
              </meshPhongMaterial>
            </mesh>
          </scene>
        </React3>
      </div>
    );
  }
}

