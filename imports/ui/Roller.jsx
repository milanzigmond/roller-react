import React, { Component } from 'react'
import PropTypes from 'prop-types'
import React3 from 'react-three-renderer'

import * as THREE from 'three'
import CANNON from 'cannon'

import Die from './Die'

import OrbitControls from 'three-orbitcontrols'

// Alternatively, can you rotate your scene by 90 degrees as a work-around?

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
      height,
    } = props;

    
    // settings
    this.rolling = false;
    this.bodies = [];
    this.geometries = [];
    this.frame_rate = 1 / 60;
    this.clear_color = 'black';
    this.spot_light_color = 'white';
    this.ambient_light_color = '#0034AF';
    this.dice_mass = 300;
    this.dice_inertia = 10;
    this.scale = 100;
    this.boost = 0;
    this.deskColor = 'green';
    this.deskSpecular = 'yellow';
    this.deskShininess = 2;
    this.repeat = new THREE.Vector2(10, 20);
    this.throwVector = {};
    this.boost = 0;
    this.w = width / 4;
    this.h = height / 4;
    this.aspect = 2;
    this.scale = Math.sqrt((this.w * this.w) + (this.h * this.h)) / 8;
    this.wh = (height / 2) / this.aspect / Math.tan((10 * Math.PI) / 180);
    this.cameraPosition = new THREE.Vector3(0, 0, this.wh);
    this.mw = Math.max(this.w, this.h);
    this.lightPosition = new THREE.Vector3(-this.mw / 2, this.mw / 2, this.mw * 2);
    this.lightTarget = new THREE.Vector3(0, 0, 0);
    this.shadow_map_type = THREE.PCFSoftShadowMap;
    this.wrapping = THREE.RepeatWrapping;
    this.selector_back_colors = {
      color: 0x404040,
      shininess: 0,
      emissive: 0x858787,
    };
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.dice = [];
    
    this.state = {
      meshStates: []
    }
  }

  _onAnimate = () => {
    this.stats.begin();

    // only animate when dice are moving
    if(this.rolling) {
      // update at the frame rate
      ++this.iteration;
      this.world.step(this.frame_rate);
      // get dice states form the changing world
      this.setState({
        meshStates: this.getDiceStates(),
      });
  
      // check if the throw is done
      if (this.check_if_throw_finished()) {
        if (this.callback) this.callback.call(this);
      } 
    }

    this.stats.end();
  };

  initCannon = () => {
    this.world = new CANNON.World();
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
        { friction: 0.01, restitution: 0.5}
      )
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(
        this.barrier_body_material, 
        this.dice_body_material, 
        { friction: 0.01, restitution: 0.5}
      )
    );
    this.world.addContactMaterial(
      new CANNON.ContactMaterial(
        this.dice_body_material, 
        this.dice_body_material, 
        { friction: 0, restitution: 0.5}
      )
    );
    
    // create barriers

    this.world.add(new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.desk_body_material
    }));
    
    let barrier;
    barrier = new CANNON.Body({
      mass: 0, 
      shape: new CANNON.Plane(),
      material: this.barrier_body_material,
      position: new THREE.Vector3(0, this.h * 0.93, 0),
    });
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), Math.PI / 2);
    this.world.add(barrier);

    barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.barrier_body_material,
      position: new THREE.Vector3(0, -this.h * 0.93, 0),
    });
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.add(barrier);

    barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.barrier_body_material,
      position: new THREE.Vector3(this.w * 0.93, 0, 0),
    });
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), -Math.PI / 2);
    this.world.add(barrier);

    barrier = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
      material: this.barrier_body_material,
      position: new THREE.Vector3(-this.w * 0.93, 0, 0),
    });
    barrier.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), Math.PI / 2);
    this.world.add(barrier);
  };

  rnd1to6 = () => {
    return Math.floor((Math.random() * 6) + 1);
  }

  randomRoll = () => {
    // get random number of dice 1 - 6
    const numberOfDice = this.rnd1to6();
    const roll = [];
    for (let i = numberOfDice - 1; i >= 0; i--) {
      roll.push(this.rnd1to6());
    }
    return roll;
  }

  make_geom = (vertices, faces, radius, tab, af) => {
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

  create_cannon_shape = (vertices, faces, radius) => {
    const shapePoints = new Array(vertices.length);
    const shapeFaces = new Array(faces.length);
    for (let i = 0; i < vertices.length; ++i) {
      const v = vertices[i];
      shapePoints[i] = new CANNON.Vec3(v.x * radius, v.y * radius, v.z * radius);
    }
    for (let i = 0; i < faces.length; ++i) {
      shapeFaces[i] = faces[i].slice(0, faces[i].length - 1);
    }
    return new CANNON.ConvexPolyhedron(shapePoints, shapeFaces);
  }

  create_geom = (vertices, faces, radius, tab, af, chamfer) => {
    const vectors = new Array(vertices.length);
    for (let i = 0; i < vertices.length; ++i) {
      vectors[i] = (new THREE.Vector3()).fromArray(vertices[i]).normalize();
    }

    const cg = this.chamfer_geom(vectors, faces, chamfer);

    const geom = this.make_geom(cg.vectors, cg.faces, radius, tab, af);
    geom.cannon_shape = this.create_cannon_shape(vectors, faces, radius);
    return geom;
  }
  
  chamfer_geom = (vectors, faces, chamfer) => {
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

  create_geometry = (radius) => {
    const vertices = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
      [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
    const faces = [[0, 3, 2, 1, 1], [1, 2, 6, 5, 2], [0, 1, 5, 4, 3],
      [3, 7, 6, 2, 4], [0, 4, 7, 3, 5], [4, 5, 6, 7, 6]];
    return this.create_geom(vertices, faces, radius, -0.2, Math.PI / 4, 0.9);
  }
  
  getDiceStates = () => {
    let states = [];
    
    if(this.bodies.length > 0) {
      states = this.bodies.map(
        (body) => ({
          position: new THREE.Vector3().copy(body.position),
          quaternion: new THREE.Quaternion().copy(body.quaternion),
        })
      );
    }
    return states;
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

    this.diceToRoll.forEach((item) => {
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
      vectors.push({ pos, velocity, angle, axis });
    });

    return vectors;
  }

  clear() {
    while (this.bodies.length !== 0) {
      const body = this.bodies.pop();
      this.geometries.pop();
      this.world.remove(body);
    }
  }

  create_dice(pos, velocity, angle, axis) {
    const geo = this.create_geometry(this.scale);

    const body =  new CANNON.Body({
      mass: this.dice_mass,
      shape:  geo.cannon_shape,
      material: this.dice_body_material,
      position: new THREE.Vector3(pos.x, pos.y, pos.z),
      angularVelocity: new THREE.Vector3(angle.x, angle.y, angle.z),
      velocity: new THREE.Vector3(velocity.x, velocity.y, velocity.z),
    });
    body.quaternion.setFromAxisAngle(
      new CANNON.Vec3(axis.x, axis.y, axis.z), 
      axis.a * Math.PI * 2
    );

    this.bodies.push(body);
    this.geometries.push(geo);
    this.world.add(body);
  }

  prepare_dices_for_roll(vectors) {
    this.clear();
    this.iteration = 0;
    vectors.forEach((vector) => {
      this.create_dice(
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
      for (let i = 0; i < this.bodies.length; ++i) {
        const body = this.bodies[i];
        if (body.stopped !== true) {
          const a = body.angularVelocity;
          const v = body.velocity;
          if (Math.abs(a.x) < e && Math.abs(a.y) < e && Math.abs(a.z) < e &&
            Math.abs(v.x) < e && Math.abs(v.y) < e && Math.abs(v.z) < e) {
            if (body.stopped) {
              if (this.iteration - body.stopped > 3) {
                body.stopped = true;
              }
            } else body.stopped = this.iteration;
            res = false;
          } else {
            body.stopped = undefined;
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
    this.bodies.forEach((body) => {
      values.push(body.position.z);
    });
    const sum = values.reduce((previous, current) => {
      const newCurrent = current + previous;
      return newCurrent;
    });
    const avg = sum / values.length;
    // check if any dice is above the avg
    this.bodies.forEach((body) => {
      if (body.position.z > (avg + 1)) {
        rollOk = false;
      }
    });
    return rollOk;
  }

  get_face_values = (filter) => {
    let values = [];
    // top, bottom, left, right, front, back
    switch (filter) {
      case 1: 
      values = [1, 6, 2, 5, 3, 4]
      break;
      case 2: 
      values = [2, 5, 6, 1, 3, 4]
      break;
      case 3: 
      values = [3, 4, 6, 1, 5, 2]
      break;
      case 4: 
      values = [4, 3, 6, 1, 2, 5]
      break;
      case 5: 
      values = [5, 2, 6, 1, 4, 3]
      break;
      case 6: 
      values = [6, 1, 2, 5, 4, 3]
      break;
    }
    return values;
  }
  
  shift_dice_faces(geometry, value, res, index) {
    const r = [1, 6];
    const matIndexes = [2,3,4,5,6,7];
    if (!(value >= r[0] && value <= r[1])) return;
    const num = value - res;
    const geom = geometry.clone();
    
    const presentValues = this.get_face_values(res);
    const newValues = this.get_face_values(value);
   
    for (let i = 0, l = geom.faces.length; i < l; ++i) {
      let matindex = geom.faces[i].materialIndex;
      // if face has a material and it needs to change
      if (matindex !== 0 && num !==0) {
        if (matIndexes.indexOf(matindex) != (-1)) {
          
          const faceIndex = presentValues.indexOf(matindex-1)
          geom.faces[i].materialIndex = newValues[faceIndex]+1;
        }
      }
    }
    this.geometries[index] = geom;
  }
    
  roll(vectors, callback) {
    this.prepare_dices_for_roll(vectors);
    
    if (this.diceToRoll !== undefined && this.diceToRoll.length) {
      const res = this.emulate_throw();

      // make sure all dices fell on the full side
      if (!this.checkDicePosition()) {
        const newVectors = this.generate_vectors();
        this.roll(newVectors, callback);
        return;
      }

      this.prepare_dices_for_roll(vectors);

      for (let i = 0; i < res.length; i++) {
        this.shift_dice_faces(this.geometries[i], this.diceToRoll[i], res[i], i);
      }
      // start animation
      this.rolling = true;
    }

    this.callback = callback;
  }

  throw_dices(vector, boost, dist) {

    vector.x /= dist;
    vector.y /= dist;
    this.boost = boost;
    this.throwVector = vector;

    if (this.diceToRoll.length === 0) return;

    const vectors = this.generate_vectors();
    
    this.roll(
      vectors, 
      (result) => {
        this.rolling = false;
      }
    );

    const snd = new Audio('/sound/die.wav');
    snd.play();
  }

  get_mouse_coords(event) {
    const touches = event.changedTouches;
    if (touches) return { x: touches[0].clientX, y: touches[0].clientY };
    return { x: event.clientX, y: event.clientY };
  }

  onMouseDown = (event) => {
    event.preventDefault();
    this.mouse_time = (new Date()).getTime();
    this.mouse_start = this.get_mouse_coords(event);
  };

  onMouseUp = (event) => {
    if (this.rolling) return;
    if (this.mouse_start === undefined) return;
    event.stopPropagation();
    
    const m = this.get_mouse_coords(event);
    
    const vector = { x: m.x - this.mouse_start.x, y: -(m.y - this.mouse_start.y) };
    this.mouse_start = undefined;
    
    const dist = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
    if (dist < Math.sqrt(this.w * this.h * 0.01)) {
      return;
    }
    
    let time_int = (new Date()).getTime() - this.mouse_time;
    if (time_int > 2000) time_int = 2000;
    const boost = Math.sqrt((2500 - time_int) / 2500) * dist * 2;

    this.diceToRoll = this.randomRoll();

    this.throw_dices(vector, boost, dist);
  };

  onMouseMove = (event) => {
    const {
      camera,
      scene
    } = this.refs;

    this.mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    this.mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    this.raycaster.setFromCamera( this.mouse, camera );
    
    // calculate objects intersecting the picking ray
    const intersects = this.raycaster.intersectObjects( this.dice );
    console.log(intersects);
  
    // for ( var i = 0; i < intersects.length; i++ ) {
    //   console.log(intersects[i].object.name);
    //   // intersects[i].object.material.color.set( 0xff0000 );
    // }
  }

  onKeyUp = (event) => {
    if(this.rolling) return;
    event.stopPropagation();6
    // throw 1 - 6 dice after pressing 1 - 6 on a keyboard
    switch (event.keyCode) {
      case 49:
        this.diceToRoll = [1];
        break;
      case 50:
        this.diceToRoll = [2,2];
        break;
      case 51:
        this.diceToRoll = [3,3,3];
        break;
      case 52:
        this.diceToRoll = [4,4,4,4];
        break;
      case 53:
        this.diceToRoll = [5,5,5,5,5];
        break;
      case 54:
        this.diceToRoll = [6,6,6,6,6,6];
        break;
    }

    this.start_throw();
  }

  start_throw() {
    if (this.rolling) return;

    // get random values simulating mouse drag

    const vector = { x: ((this.rnd() * 2) - 1) * this.w, y: -((this.rnd() * 2) - 1) * this.h };
    const dist = Math.sqrt((vector.x * vector.x) + (vector.y * vector.y));
    const boost = (this.rnd() + 1) * dist;

    this.throw_dices(vector, boost, dist);
  }

  addOrbitControls() {
    const {
      renderer,
      camera
    } = this.refs;

    this.controls = new OrbitControls( camera, renderer.domElement );
  }

  addStats() {
    this.stats = new Stats();
    this.stats.setMode(0); // 0: fps, 1: ms 
     
    // align top-left 
    this.stats.domElement.style.position = 'absolute';
    this.stats.domElement.style.left = '0px';
    this.stats.domElement.style.top = '0px';

    document.body.appendChild( this.stats.domElement );
  }

  listenToKeyboard() {
    document.addEventListener("keyup", this.onKeyUp, false);
  }

  componentDidMount() {
    const {
      scene
    } = this.refs;

    // this.addOrbitControls();
    this.addStats();
    this.listenToKeyboard();
    
    this.initCannon();
    
    this.diceToRoll = [1];
    this.start_throw();
    
  }

  componentWillUnmount() {
    this.controls.dispose();
    delete this.controls;
  }

  render() {
    
    const {
      width,
      height,
    } = this.props;
    
    const {
      meshStates
    } = this.state;

    const diceMeshes = meshStates.map(({position, quaternion}, i) => 
    (<Die
      key={i}
      index={i}
      position={position}
      quaternion={quaternion}
      geometry={this.geometries[i]}
      dice={this.dice}
    />));

    return (
      
      <div 
        ref="container" 
        onMouseDown={this.onMouseDown}
        onMouseUp={this.onMouseUp}
        onMouseMove={this.onMouseMove}
        onTouchStart={this.onMouseDown}
        onTouchEnd={this.onMouseUp}
      >  
        <React3 
          ref="renderer"
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
            <texture 
              resourceId="materialTexture"
              url="img/material.png" 
            />
            <texture 
              resourceId="1Texture"
              url="img/1.png" 
            />
            <texture 
              resourceId="2Texture"
              url="img/2.png" 
            />
            <texture 
              resourceId="3Texture"
              url="img/3.png" 
            />
            <texture 
              resourceId="4Texture"
              url="img/4.png" 
            />
            <texture 
              resourceId="5Texture"
              url="img/5.png" 
            />
            <texture 
              resourceId="6Texture"
              url="img/6.png" 
            />
            <texture
              resourceId="deskTexture"
              url="img/pattern2.png"
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
          </resources>

          <scene
            ref='scene'
          >
            <perspectiveCamera
              ref="camera"
              name="camera"
              fov={20}
              aspect={width / height}
              near={1}
              far={this.wh*3}
              position={this.cameraPosition}
            />
            
            <spotLight
              color={this.spot_light_color}
              intensity={1}
              distance={this.mw * 4}

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
              intensity={1.5}
            />
            
            {diceMeshes}
            
            <mesh 
              name='desk'
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

