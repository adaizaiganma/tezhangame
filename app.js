function getRandomInt(max) {
  return Math.floor(Math.random() * max) + 1;
}
function getByValue(map, searchValue) {
  for (let [key, value] of map.entries()) {
    if (value === searchValue) return key;
  }
}

// module aliases
var Engine = Matter.Engine,
  Runner = Matter.Runner,
  Bodies = Matter.Bodies,
  Events = Matter.Events,
  Composite = Matter.Composite;
const canvaWidth = 350;
const canvaHeight = window.innerHeight;

var engine;
var runner;
var planets = [];
//store radius
const planetsData = new Map();
planetsData.set(1, 10); // mercury and so on.. the last one is the sun
planetsData.set(2, 15);
planetsData.set(3, 19);
planetsData.set(4, 20);
planetsData.set(5, 70);
planetsData.set(6, 60);
planetsData.set(7, 39);
planetsData.set(8, 40);
planetsData.set(9, 150);
// spawn planet function
function Planet(x, y, id) {
  var options = {
    friction: 0.5,
    restitution: 0.5,
    angle: PI,
    label: "planet",
  };
  let radius = planetsData.get(id);
  this.body = Bodies.circle(x, y, radius, options);
  Composite.add(engine.world, this.body);
  this.show = function () {
    var pos = this.body.position;
    var angle = this.body.angle;

    push();
    fill(21);
    translate(pos.x, pos.y);
    rotate(angle);
    ellipseMode(CENTER);
    circle(0, 0, radius * 2);

    pop();
  };
}

function setup() {
  createCanvas(canvaWidth, canvaHeight);
  engine = Engine.create();
  runner = Runner.create();
  Runner.run(runner, engine);
  initScene();
}
function draw() {
  background("#14151f");
  stroke("#ee3f4d");
  strokeWeight(2);
  line(0, 100, canvaWidth, 100);
  for (var i = 0; i < planets.length; i++) {
    planets[i].show();
  }
}
function mouseClicked() {
  planets.push(new Planet(mouseX, mouseY, 1));
  collision();
}
// init enviroment : two wall one ground and a end-line
function initScene() {
  // create a ground
  var ground = Bodies.rectangle(
    canvaWidth / 2, //make sure the ground is invisible
    canvaHeight + 50, //the anchor point is in the center of the body so we need some transform translate
    1000,
    100,
    {
      isStatic: true,
      label: "wall",
    }
  );
  // create a wall on leftside
  var wallLeft = Bodies.rectangle(-25, canvaHeight / 2, 50, 1000, {
    isStatic: true,
    label: "wall",
  });
  // create a wall on rightside
  var wallRight = Bodies.rectangle(canvaWidth + 25, canvaHeight / 2, 50, 1000, {
    isStatic: true,
    label: "wall",
  });
  var endLine = Bodies.rectangle(canvaWidth, 150, 1000, 1, {
    isSensor: true,
    isStatic: true,
    label: "endLine",
  });
  Composite.add(engine.world, [wallLeft, wallRight, ground, endLine]);
}
// add all of the walls to the world

// two test object and should be remove later
// Planet(0, 0, 5);
// Planet(400, 0, 5);

// temp mouse control----------------------------->
// var mouse = Mouse.create(render.canvas),
//   mouseConstraint = MouseConstraint.create(engine, {
//     mouse: mouse,
//     constraint: {
//       stiffness: 0.1,
//       render: {
//         visible: false,
//       },
//     },
//   });
// Composite.add(engine.world, mouseConstraint);
// render.mouse = mouse;
// remove until here------------------------------->
function collision() {
  //do things when collision happen
  const droppedPlanetList = [];
  Events.on(engine, "collisionStart", function (event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
      var pair = pairs[i];
      var _BodyA = Composite.get(engine.world, pair.bodyA.id, "body"); //save two body
      var _BodyB = Composite.get(engine.world, pair.bodyB.id, "body");

      if (_BodyA?.label == "planet" && _BodyB?.label == "planet") {
        // if two planet collide
        if (_BodyA.circleRadius == _BodyB.circleRadius) {
          // and have the same radius (planets will not have two same radius)
          let _id = getByValue(planetsData, pair.bodyA.circleRadius) + 1; // temp id for new planet
          if (_id < 10) {
            // if not two sun collide each other
            let _x = (pair.bodyA.position.x + pair.bodyB.position.x) / 2; //spawn new planet between two old planets
            let _y = (pair.bodyA.position.y + pair.bodyB.position.y) / 2; //the old and clasic 中点公式
            Composite.remove(engine.world, [pair.bodyA, pair.bodyB]); // remove two old planets
            var _planet = Planet(_x, _y, _id);
            droppedPlanetList.push(_planet.id); //add new planet and make them "dropped" (more explanation later..)
          } else {
            alert("you win!"); // win the game when two sun collide each other
          }
        }
      }
      /*
        here comes the tricky parts...
        the things is we should only end the game when the planet stack each other untill they touch the end-line
        but when spawning planet above the end-line, it sure will fire the end game function
        so what do we do?
        first we add an array to tell which planets had been dropped
        if the planet had been dropped we will find the unique id in the array
        so everytime a planet pass the end-line we check for the id in the array
        if not? add it into the array
        if yes? then you're done. the game is over
        it's that easy.
      */
      if (pair.bodyA.label == "endLine") {
        if (droppedPlanetList.indexOf(_BodyB.id) == -1) {
          droppedPlanetList.push(_BodyB.id);
        } else {
          console.log("you lose!");
        }
      }
    }
  });
}

// let currentReadyPlanet;
// let X = canvaWidth / 2;
// function moveReadyPlanet(event) {
//   const img = document.getElementById("follow-img");
//   let _x = event.clientX - (window.innerWidth - canvaWidth) / 2;
//   if (_x < 0) {
//     _x = 0;
//   }
//   if (_x > canvaWidth) {
//     _x = canvaWidth;
//   }
//   X = _x;
//   img.style.left = _x + (window.innerWidth - canvaWidth) / 2 + "px";
// }
// let random = 1;
// function updateNewReadyPlanet() {
//   const img = document.getElementById("follow-img");
//   currentReadyPlanet = Planet(canvaWidth / 2, 50, random);
//   random = getRandomInt(4);
//   img.src = `./img/${random}.png`;
//   Matter.Body.setPosition(currentReadyPlanet, { x: X, y: 50 });
// }
// let drop = setInterval(() => {
//   updateNewReadyPlanet();
// }, 3000);
