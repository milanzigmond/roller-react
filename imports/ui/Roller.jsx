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
      deskTexture: {},
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
    this.deskTexture;

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



    // init 
    this.dimensions.w = width / 4;
    this.dimensions.h = height / 4;

    // window.addEventListener('resize', () => {
    //   const newW = `${window.innerWidth - 1}px`;
    //   const newH = `${window.innerHeight - 1}px`;
    //   container.style.width = newW;
    //   container.style.height = newH;
    //   this.reinit(container);
    // });

    // this.use_adapvite_timestep = true;
    // this.animate_selector = true;
    this.world = new CANNON.World();
    this.dices = [];
    this.meshRefs = [];




    // reinit

    this.cw = width / 2;
    this.ch = height / 2;
    if (this.dimensions) {
      this.w = this.dimensions.w;
      this.h = this.dimensions.h;
    } else {
      this.w = this.cw;
      this.h = this.ch;
    }


    this.aspect = Math.min(this.cw / this.w, this.ch / this.h);
    this.scale = Math.sqrt((this.w * this.w) + (this.h * this.h)) / 8;

    this.wh = this.ch / this.aspect / Math.tan((10 * Math.PI) / 180);

    this.cameraPosition = new THREE.Vector3(0, 0, this.wh);

    // this.createLight();

    // this.camera.updateProjectionMatrix();
    // this.renderer.setSize(this.cw * 2, this.ch * 2);
    // this.renderer.render(this.scene, this.camera);
    
    



    // this.world.gravity.set(0, 0, -9.8 * 800);
    // this.world.broadphase = new CANNON.NaiveBroadphase();
    // this.world.solver.iterations = 16;

    // const ambientLight = new THREE.AmbientLight(0xd7ad59);
    // this.scene.add(ambientLight);

    // this.dice_body_material = new CANNON.Material();
    // const desk_body_material = new CANNON.Material();
    // const barrier_body_material = new CANNON.Material();
    // this.world.addContactMaterial(new CANNON.ContactMaterial(
    //   desk_body_material, this.dice_body_material, 0.01, 0.5));
    // this.world.addContactMaterial(new CANNON.ContactMaterial(
    //   barrier_body_material, this.dice_body_material, 0, 1.0));
    // this.world.addContactMaterial(new CANNON.ContactMaterial(
    //   this.dice_body_material, this.dice_body_material, 0, 0.5));

    // this.world.add(new CANNON.RigidBody(0, new CANNON.Plane(), desk_body_material));
    // let barrier;
    // barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    // barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    // barrier.position.set(0, this.h * 0.93, 0);
    // this.world.add(barrier);

    // barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    // barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    // barrier.position.set(0, -this.h * 0.93, 0);
    // this.world.add(barrier);

    // barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    // barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    // barrier.position.set(this.w * 0.93, 0, 0);
    // this.world.add(barrier);

    // barrier = new CANNON.RigidBody(0, new CANNON.Plane(), barrier_body_material);
    // barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    // barrier.position.set(-this.w * 0.93, 0, 0);
    // this.world.add(barrier);

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

  // createLight() {
  //   const mw = Math.max(this.w, this.h);
  //   if (this.light) this.scene.remove(this.light);
  //   this.light = new THREE.SpotLight(this.spot_light_color, 1.5);
  //   this.light.position.set(-mw / 2, mw / 2, mw * 2);
  //   this.light.target.position.set(0, 0, 0);
  //   this.light.distance = mw * 3;
  //   this.light.castShadow = true;
  //   this.light.shadow.camera.near = mw / 10;
  //   this.light.shadow.camera.far = mw * 5;
  //   this.light.shadow.camera.fov = 50;
  //   this.light.shadow.camera.visible = true;
  //   this.light.shadow.bias = 0.001;
  //   this.light.shadow.mapSize.width = 2048;
  //   this.light.shadow.mapSize.height = 2048;
  //   this.scene.add(this.light);
  // }

  // createDesk() {
  //   if (this.desk) return;

  //   this.deskGeometry = new THREE.PlaneGeometry(this.dimensions.w * 2, this.dimensions.h * 2, 1, 1);

  //   const deskTexture = new THREE.TextureLoader().load('./img/pattern.png', (texture) => {
  //     texture.wrapS = THREE.RepeatWrapping;
  //     texture.wrapT = THREE.RepeatWrapping;
  //     texture.repeat.set(40, 40);
  //   });

  //   this.deskMaterial = new THREE.MeshPhongMaterial({
  //     color: 'purple',
  //     specular: 'white',
  //     shininess: 2,
  //     map: deskTexture,
  //   });


  //   this.desk = new THREE.Mesh(this.deskGeometry, this.deskMaterial);
  //   // new THREE.MeshPhongMaterial({ color: that.desk_color }));
  //   this.desk.receiveShadow = true;
  //   this.scene.add(this.desk);
  // }
  componentDidMount() {

    const {
      desk
    } = this.refs;

    this.loader = new THREE.TextureLoader();
    const that = this;
    this.loader.load(
      // resource URL
      './img/pattern.png',
      // Function when resource is loadede
      function ( texture ) {
        // do something with the texture
        // that.deskTexture
        console.log('texture loaded');
        console.log(desk);
        console.log(desk.material);
        // desk.material.map = texture;
        // var material = new THREE.MeshBasicMaterial( {
        //   map: texture
        // } );
      },
      // Function called when download progresses
      function ( xhr ) {
        console.log( (xhr.loaded / xhr.total * 100) + '% loaded' );
      },
      // Function called when download errors
      function ( xhr ) {
        console.log( 'An error happened' );
      }
    );
  }


  render() {
    
    const {
      width,
      height,
    } = this.props;

    const {
      // clickMarkerVisible,
      // clickMarkerPosition,

      // meshStates,
    } = this.state;



    // PerspectiveCamera(20, this.cw / this.ch, 1, this.wh * 1.3);
    // // this.camera.position.z = this.wh;
    // this.cameraPosition = new THREE.Vector3(0, 0, this.wh);



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
          <resources>
            {/* <texture
              resourceId="deskTexture"
              url="./img/pattern.png"
              wrapS={this.wrapping}
              wrapT={this.wrapping}
              repeat={this.repeat}
            /> */}
            <meshPhongMaterial
              resourceId="deskMaterial"
              color={this.deskColor}
              specular={this.deskSpecular}
              shininess={this.deskShininess}
            />
          </resources>
          <scene>
            <perspectiveCamera
              name="camera"
              fov={20}
              aspect={this.cw / this.ch}
              near={1}
              far={this.wh*1.3}
              position={this.cameraPosition}
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
                width={this.dimensions.w * 2} 
                height={this.dimensions.h * 2}
                widthSegments={1}
                heightSegments={1}
              />
              <meshBasicMaterial color={0xff0000} />
            </mesh>
          </scene>
        </React3>
      </div>
    );
  }
}

