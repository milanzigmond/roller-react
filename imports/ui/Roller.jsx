import React, { Component } from 'react';
import PropTypes from 'prop-types';

import React3 from 'react-three-renderer';
import * as THREE from 'three';
import CANNON from 'cannon';

import Die from './Die'

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
      rolling: false,
      deskTextureLoaded: false,
      cubeRotation: new THREE.Euler(),
      meshStates: [],  
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
    this.dieSpecular = 'brown';
    this.dieShineness = 5;
    this.dieShading = THREE.FlatShading;



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
    this.throwVector = {};
    this.boost = 0;

    this.test = false;

    // window.addEventListener('resize', () => {
    //   const newW = `${window.innerWidth - 1}px`;
    //   const newH = `${window.innerHeight - 1}px`;
    //   container.style.width = newW;
    //   container.style.height = newH;
    //   this.reinit(container);
    // });
    
    // this.use_adapvite_timestep = true;
    // this.animate_selector = true;
    
    this.w = width / 4;
    this.h = height / 4;
    this.aspect = 2;
    this.scale = Math.sqrt((this.w * this.w) + (this.h * this.h)) / 8;
    this.wh = (height / 2) / this.aspect / Math.tan((10 * Math.PI) / 180);

    this.cameraPosition = new THREE.Vector3(0, 0, this.wh);
    this.mw = Math.max(this.w, this.h);
    this.lightPosition = new THREE.Vector3(-this.mw / 2, this.mw / 2, this.mw * 2);
    this.lightTarget = new THREE.Vector3(0, 0, 0);

    this.last_time = 0;
    this.running = false;

    // cannon
    this.dices = [];
    this.bodies = [];
    this.meshRefs = [];
    this.geometries = [];
    
    this.world = new CANNON.World();
      
    const initCannon = () => {
      
      // setup world

      this.world.gravity.set(0, 0, -9.8 * 800);
      this.world.broadphase = new CANNON.NaiveBroadphase();
      this.world.solver.iterations = 16;

      // create barriers to prevent dice to fall off

      // create materials
      
      this.dice_body_material = new CANNON.Material();
      this.desk_body_material = new CANNON.Material();
      this.barrier_body_material = new CANNON.Material();
      
      // materials contact setup

      this.world.addContactMaterial(
        new CANNON.ContactMaterial(
          this.desk_body_material, 
          this.dice_body_material, 
          { 
            friction: 0.01, 
            restitution: 0.5
          }
        )
      );
      this.world.addContactMaterial(
        new CANNON.ContactMaterial(
          this.barrier_body_material, 
          this.dice_body_material, 
          {
            friction: 0.01,
            restitution: 0.5
          }
        )
      );
      this.world.addContactMaterial(
        new CANNON.ContactMaterial(
          this.dice_body_material, 
          this.dice_body_material, 
          {
            friction: 0,
            restitution:  0.5
          }
        )
      );

      // create barriers

      this.world.add(new CANNON.Body(0, new CANNON.Plane(), this.desk_body_material));
      
      let barrier;
      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
      barrier.position.set(0, this.h * 0.93, 0);
      this.world.add(barrier);

      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
      barrier.position.set(0, -this.h * 0.93, 0);
      this.world.add(barrier);

      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
      barrier.position.set(this.w * 0.93, 0, 0);
      this.world.add(barrier);

      barrier = new CANNON.Body(0, new CANNON.Plane(), this.barrier_body_material);
      barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
      barrier.position.set(-this.w * 0.93, 0, 0);
      this.world.add(barrier);

    };

    initCannon();
 
    this.make_geom = (vertices, faces, radius, tab, af) => {
      const geom = new THREE.Geometry();
      for (let i = 0; i < vertices.length; ++i) {
        const vertex = vertices[i].multiplyScalar(radius);
        vertex.index = geom.vertices.push(vertex) - 1;
      }
      for (let i = 0; i < faces.length; ++i) {
        const ii = faces[i];
        const fl = ii.length - 1;
        const aa = (Math.PI * 2) / fl;
        for (let j = 0; j < fl - 2; ++j) {
          geom.faces.push(new THREE.Face3(ii[0], ii[j + 1], ii[j + 2], [geom.vertices[ii[0]],
            geom.vertices[ii[j + 1]], geom.vertices[ii[j + 2]]], 0, ii[fl] + 1));
          geom.faceVertexUvs[0].push([
            new THREE.Vector2((Math.cos(af) + 1 + tab) / 2 / (1 + tab),
              (Math.sin(af) + 1 + tab) / 2 / (1 + tab)),
            new THREE.Vector2((Math.cos((aa * (j + 1)) + af) + 1 + tab) / 2 / (1 + tab),
              (Math.sin((aa * (j + 1)) + af) + 1 + tab) / 2 / (1 + tab)),
            new THREE.Vector2((Math.cos((aa * (j + 2)) + af) + 1 + tab) / 2 / (1 + tab),
              (Math.sin((aa * (j + 2)) + af) + 1 + tab) / 2 / (1 + tab))]);
        }
      }
      geom.computeFaceNormals();
      geom.boundingSphere = new THREE.Sphere(new THREE.Vector3(), radius);
      return geom;
    }

    this.create_cannon_shape = (vertices, faces, radius) => {
      const cv = new Array(vertices.length);
      const cf = new Array(faces.length);
      for (let i = 0; i < vertices.length; ++i) {
        const v = vertices[i];
        cv[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
      }
      for (let i = 0; i < faces.length; ++i) {
        cf[i] = faces[i].slice(0, faces[i].length - 1);
      }
      return new CANNON.ConvexPolyhedron(cv, cf);
    }

    this.create_geom = (vertices, faces, radius, tab, af, chamfer) => {
      const vectors = new Array(vertices.length);
      for (let i = 0; i < vertices.length; ++i) {
        vectors[i] = (new THREE.Vector3()).fromArray(vertices[i]).normalize();
      }
  
      const cg = this.chamfer_geom(vectors, faces, chamfer);
  
      const geom = this.make_geom(cg.vectors, cg.faces, radius, tab, af);
      geom.cannon_shape = this.create_cannon_shape(vectors, faces, radius);
      return geom;
    }
    
    this.chamfer_geom = (vectors, faces, chamfer) => {
      const chamfer_vectors = [];
      const chamfer_faces = [];
      const corner_faces = new Array(vectors.length);
      for (let i = 0; i < vectors.length; ++i) corner_faces[i] = [];
      for (let i = 0; i < faces.length; ++i) {
        const ii = faces[i];
        const fl = ii.length - 1;
        const center_point = new THREE.Vector3();
        const face = new Array(fl);
        for (let j = 0; j < fl; ++j) {
          const vv = vectors[ii[j]].clone();
          center_point.add(vv);
          corner_faces[ii[j]].push(face[j] = chamfer_vectors.push(vv) - 1);
        }
        center_point.divideScalar(fl);
        for (let j = 0; j < fl; ++j) {
          const vv = chamfer_vectors[face[j]];
          vv.subVectors(vv, center_point).multiplyScalar(chamfer).addVectors(vv, center_point);
        }
        face.push(ii[fl]);
        chamfer_faces.push(face);
      }
      for (let i = 0; i < faces.length - 1; ++i) {
        for (let j = i + 1; j < faces.length; ++j) {
          const pairs = [];
          let lastm = -1;
          for (let m = 0; m < faces[i].length - 1; ++m) {
            const n = faces[j].indexOf(faces[i][m]);
            if (n >= 0 && n < faces[j].length - 1) {
              if (lastm >= 0 && m !== lastm + 1) pairs.unshift([i, m], [j, n]);
              else pairs.push([i, m], [j, n]);
              lastm = m;
            }
          }
          // if (pairs.length !== 4) continue;
          if (pairs.length === 4) {
            chamfer_faces.push([chamfer_faces[pairs[0][0]][pairs[0][1]],
              chamfer_faces[pairs[1][0]][pairs[1][1]],
              chamfer_faces[pairs[3][0]][pairs[3][1]],
              chamfer_faces[pairs[2][0]][pairs[2][1]], -1]);
          }
        }
      }
      for (let i = 0; i < corner_faces.length; ++i) {
        const cf = corner_faces[i];
        const face = [cf[0]];
        let count = cf.length - 1;
        while (count) {
          for (let m = faces.length; m < chamfer_faces.length; ++m) {
            let index = chamfer_faces[m].indexOf(face[face.length - 1]);
            if (index >= 0 && index < 4) {
              if (--index === -1) index = 3;
              const next_vertex = chamfer_faces[m][index];
              if (cf.indexOf(next_vertex) >= 0) {
                face.push(next_vertex);
                break;
              }
            }
          }
          --count;
        }
        face.push(-1);
        chamfer_faces.push(face);
      }
      return { vectors: chamfer_vectors, faces: chamfer_faces };
    }

    this.create_geometry = (radius) => {
      const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
      const faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
        [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
      return this.create_geom(vertices, faces, radius, -0.2, Math.PI / 4, 0.9);
    }

    this.create_mesh = () => {
      if (!this.d6_geometry) this.d6_geometry = this.create_geometry(this.scale);

      const specularColor = 'brown';
      const shineness = 5;
      const shading = THREE.FlatShading;

      const materials = [
        new THREE.MeshPhongMaterial({
          map: new THREE.TextureLoader().load('./img/material.png'),
          // map: new THREE.TextureLoader().load('./img/wood.jpg'),
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
    }
    
    this.getMeshStates = () => {
      const states = [];
      
      if(this.bodies.length > 0) {
        const states = this.bodies.map((body, bodyIndex) => ({
          position: new THREE.Vector3().copy(body.position),
          quaternion: new THREE.Quaternion().copy(body.quaternion),
          // ref: meshRefs[bodyIndex],
        }));
  
        console.log(states[0].position);
      }
      return states;
    }

    this._onAnimate = () => {
      this.world.step(this.frame_rate);
      this.getMeshStates();
      this.setState({
        cubeRotation: new THREE.Euler(
          this.state.cubeRotation.x + 0.01,
          this.state.cubeRotation.y + 0.01,
          0,
        ),
        meshStates: this.getMeshStates(),
      });

      // console.log(this.state.meshStates[3].position.x);
    };




    this.__animate = () => {
      // const time = (new Date()).getTime();
      // let time_diff = (time - this.last_time) / 1000;
      
      // if (time_diff > 3) time_diff = this.frame_rate;
      
      ++this.iteration;
      
      this.world.step(this.frame_rate);
  
      // this.scene.children.forEach((child) => {
      //   if (child.body !== undefined) {
      //     child.position.copy(child.body.position);
      //     child.quaternion.copy(child.body.quaternion);
      //   }
      // });
      
      // this.last_time = this.last_time ? time : (new Date()).getTime();
      if (this.check_if_throw_finished()) {
        this.running = false;
        // if (this.callback) this.callback.call(this, Roller.get_dice_values(this.dices));
      }
      // const that = this;
      // if (this.running === threadid) {
      //   (function (t, tid, uat) {
      //     if (!uat && time_diff < that.frame_rate) {
      //       setTimeout(() => {
      //         requestAnimationFrame(() => {
      //           t.__animate(tid);
      //           that.stats.update();
      //           // update stats
      //         });
      //       }, (that.frame_rate - time_diff) * 1000);
      //     } else {
      //       requestAnimationFrame(() => {
      //         t.__animate(tid);
      //         // update stats
      //         that.stats.update();
      //       });
      //     }
      //   }(this, threadid, this.use_adapvite_timestep));
      // }
    };
  }

  rnd() {
    return Math.random();
  }

  make_random_vector(vector) {
    const random_angle = ((this.rnd() * Math.PI) / 5) - (Math.PI / 5 / 2);
    const vec = {
      x: (vector.x * Math.cos(random_angle)) - (vector.y * Math.sin(random_angle)),
      y: (vector.x * Math.sin(random_angle)) + (vector.y * Math.cos(random_angle)),
    };
    if (vec.x === 0) vec.x = 0.01;
    if (vec.y === 0) vec.y = 0.01;
    return vec;
  }

  generate_vectors() {
    const vectors = [];

    this.props.roll.forEach((item) => {
      const vec = this.make_random_vector(this.throwVector);
      const pos = {
        x: this.w * (vec.x > 0 ? -1 : 1) * 0.9,
        y: this.h * (vec.y > 0 ? -1 : 1) * 0.9,
        z: (this.rnd() * 200) + 200,
      };
      const projector = Math.abs(vec.x / vec.y);
      if (projector > 1.0) pos.y /= projector; else pos.x *= projector;
      const velvec = this.make_random_vector(this.throwVector);
      const velocity = { x: velvec.x * this.boost, y: velvec.y * this.boost, z: -10 };
      const inertia = this.dice_inertia;
      const angle = {
        x: -((this.rnd() * vec.y * 5) + (inertia * vec.y)),
        y: (this.rnd() * vec.x * 5) + (inertia * vec.x),
        z: 0,
      };
      const axis = { x: this.rnd(), y: this.rnd(), z: this.rnd(), a: this.rnd() };
      vectors.push({ set: item, pos, velocity, angle, axis });
    });

    return vectors;
  }

  clear() {
    this.running = false;
    while (this.dices.length !== 0) {
      const dice = this.dices.pop();
      this.refs.scene.remove(dice);
      if (dice.body) this.world.remove(dice.body);
    }
    // setTimeout(() => { box.renderer.render(box.scene, box.camera); }, 100);
  }

  create_dice(type, pos, velocity, angle, axis) {
    // const die = this.create_mesh();
    // die.castShadow = true;
    // die.receiveShadow = true;
    // die.dice_type = type;

    const geo = this.create_geometry(this.scale);
    this.geometries.push(geo);

    const body =  new CANNON.Body(
      this.dice_mass,
      geo.cannon_shape, 
      this.dice_body_material
    );
    body.position.set(pos.x, pos.y, pos.z);
    body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(axis.x, axis.y, axis.z), axis.a * Math.PI * 2,
    );
    body.angularVelocity.set(angle.x, angle.y, angle.z);
    body.velocity.set(velocity.x, velocity.y, velocity.z);
    body.linearDamping = 0.01;
    body.angularDamping = 0.01;
    // console.log(dice);
    // this.refs.scene.add(die);
    this.bodies.push(body);
    // this.dices.push(die);
    this.world.add(body);
  }

  prepare_dices_for_roll(vectors) {
    console.log(vectors);
    this.clear();
    this.iteration = 0;
    vectors.forEach((vector) => {
      this.create_dice(
        vector.set, 
        vector.pos, 
        vector.velocity,
        vector.angle, 
        vector.axis
      );
    });
  }

  get_dice_value(geometry, body) {
    const vector = new THREE.Vector3(0, 0, 1);
    let closest_face;
    let closest_angle = Math.PI * 2;
    for (let i = 0, l = geometry.faces.length; i < l; ++i) {
      const face = geometry.faces[i];
      if (face.materialIndex !== 0) {
        const angle = face.normal.clone().applyQuaternion(body.quaternion).angleTo(vector);
        if (angle < closest_angle) {
          closest_angle = angle;
          closest_face = face;
        }
      }
    }
    const matindex = closest_face.materialIndex - 1;
    return matindex;
  }

  get_dice_values() {
    const values = [];
    for (let i = 0, l = this.geometries.length; i < l; ++i) {
      values.push(this.get_dice_value(this.geometries[i], this.bodies[i]));
    }
    return values;
  }

  check_if_throw_finished() {
    let res = true;
    const e = 2;
    if (this.iteration < 10 / this.frame_rate) {
      for (let i = 0; i < this.dices.length; ++i) {
        const dice = this.dices[i];
        if (dice.dice_stopped !== true) {
          const a = dice.body.angularVelocity;
          const v = dice.body.velocity;
          if (Math.abs(a.x) < e && Math.abs(a.y) < e && Math.abs(a.z) < e &&
            Math.abs(v.x) < e && Math.abs(v.y) < e && Math.abs(v.z) < e) {
            if (dice.dice_stopped) {
              if (this.iteration - dice.dice_stopped > 3) {
                dice.dice_stopped = true;
              }
            } else dice.dice_stopped = this.iteration;
            res = false;
          } else {
            dice.dice_stopped = undefined;
            res = false;
          }
        }
      }
    }
    return res;
  }

  emulate_throw() {
    while (!this.check_if_throw_finished()) {
      ++this.iteration;
      this.world.step(this.frame_rate);
    }
    return this.get_dice_values();
  }

  checkDicePosition() {
    // get average y
    let rollOk = true;
    const values = [];
    this.dices.forEach((dice) => {
      values.push(dice.body.position.z);
    });
    const sum = values.reduce((previous, current) => {
      const newCurrent = current + previous;
      return newCurrent;
    });
    const avg = sum / values.length;
    // console.log('checkDicePosition');
    // check if any dice is above the avg
    this.dices.forEach((dice) => {
      // console.log(`dice.body.position.z:${dice.body.position.z}`);
      if (dice.body.position.z > (avg + 1)) {
        rollOk = false;
        // console.error('this dice has\'t rolled properly');
      }
    });
    return rollOk;
  }

  shift_dice_faces(geometry, value, res, index) {
    // console.log('geometry:'+geometry);
    // console.log('value:' + value);
    // console.log('result:' + res);

    const r = [1, 6];
    if (!(value >= r[0] && value <= r[1])) return;
    const num = value - res;
    const geom = geometry.clone();
    for (let i = 0, l = geom.faces.length; i < l; ++i) {
      let matindex = geom.faces[i].materialIndex;
      if (matindex !== 0) {
        matindex += num - 1;
        while (matindex > r[1]) matindex -= r[1];
        while (matindex < r[0]) matindex += r[1];
        geom.faces[i].materialIndex = matindex + 1;
      }
    }
    this.geometries[index] = geom;
  }

  roll(vectors, callback) {
    // console.log('FUNCTION CALL : roll');
    // console.log(vectors);

    this.prepare_dices_for_roll(vectors);
    const {
      roll
    } = this.props;

    if (roll !== undefined && roll.length) {
      const res = this.emulate_throw();
      console.log('res');
      console.log(res);
      // if (!this.checkDicePosition()) {
      //   // console.log('getting new vectors');
      //   const newVectors = this.generate_vectors();
      //   this.roll(newVectors, roll, callback);
      //   return;
      // }

      // console.log(res);
      this.prepare_dices_for_roll(vectors);

      console.log(this.bodies);

      for (let i = 0; i < res.length; i++) {
        this.shift_dice_faces(this.geometries[i], roll[i], res[i], i);
      }
    }

    this.callback = callback;
    this.running = (new Date()).getTime();
    this.last_time = 0;
    // this.__animate(this.running);
  }

  throw_dices(vector, boost, dist) {

    vector.x /= dist;
    vector.y /= dist;
    this.boost = boost;
    this.throwVector = vector;

    if (this.props.roll.length === 0) return;
    const vectors = this.generate_vectors();
    this.rolling = true;

    const roll = (request_results) => {
      this.clear();
      this.roll(vectors, (result) => {
        this.rolling = false;
      });
    };

    roll();

    // const snd = new Audio('./sound/die.wav');
    // snd.play();
  }

  start_throw() {
    if (this.state.rolling) return;

    // get random values simulating mouse drag

    const vector = { x: ((this.rnd() * 2) - 1) * this.w, y: -((this.rnd() * 2) - 1) * this.h };
    const dist = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
    const boost = (this.rnd() + 3) * dist;

    this.throw_dices(vector, boost, dist);
  }

  componentDidMount() {
    this.start_throw();
  }

  render() {
    
    const {
      width,
      height,
    } = this.props;

    const {
      scene
    } = this.refs;
    
    const {
      meshStates
    } = this.state;

    const diceMeshes = meshStates.map(({position, quaternion}, i) => 
    (<Die
      key={i}
      dices={this.dices}

      position={position}
      quaternion={quaternion}
      geometry={this.geometries[i]}
    />));

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
            {/* textures */}
            <texture
              resourceId="materialTexture"
              url="img/material.png"
            />
            <texture
              resourceId="oneTexture"
              url="img/1.png"
            />
            <texture
              resourceId="twoTexture"
              url="img/2.png"
            />
            <texture
              resourceId="threeTexture"
              url="img/3.png"
            />
            <texture
              resourceId="fourTexture"
              url="img/4.png"
            />
            <texture
              resourceId="fiveTexture"
              url="img/5.png"
            />
            <texture
              resourceId="sixTexture"
              url="img/6.png"
            />
            <texture
              resourceId="deskTexture"
              url="img/pattern.png"
              wrapS={this.wrapping}
              wrapT={this.wrapping}
              repeat={this.repeat}
            />
            <meshPhongMaterial
              resourceId="deskMaterial"
              color={this.deskColor}
              specular={this.deskSpecular}
              shininess={this.deskShininess}
            >
              <textureResource
                resourceId="deskTexture"
              />
            </meshPhongMaterial>
            <meshPhongMaterial
              resourceId="dieMaterial"
              specular={this.dieSpecular}
              shininess={this.dieShininess}
              shading={this.dieShading}
            >
               <textureResource resourceId="materialTexture" />
               <textureResource resourceId="oneTexture" />
               <textureResource resourceId="twoTexture" />
               <textureResource resourceId="threeTexture" />
               <textureResource resourceId="fourTexture" />
               <textureResource resourceId="fiveTexture" />
               <textureResource resourceId="sixTexture" />
            </meshPhongMaterial>
          </resources>
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
            {diceMeshes}
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
              <materialResource resourceId='deskMaterial' />
            </mesh>
          </scene>
        </React3>
      </div>
    );
  }
}

