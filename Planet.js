//store radius and planet name
function PlanetData(name, radius) {
  this.name = name;
  this.radius = radius;
}
function getByValue(searchValue) {
    for (let i = 0; i < planetsData.length; i++) {
        if(planetsData[i].radius==searchValue) return i;
    }
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}
var planetsData = [];
planetsData.push(new PlanetData("水星 Mercury", 10)); // mercury and so on.. the last one is the sun
planetsData.push(new PlanetData("金星 Venus", 15));
planetsData.push(new PlanetData("地球 Earth", 19));
planetsData.push(new PlanetData("火星 Mars", 20));
planetsData.push(new PlanetData("木星 Jupiter", 70));
planetsData.push(new PlanetData("土星 Saturn", 60));
planetsData.push(new PlanetData("天王星 Uranus", 39));
planetsData.push(new PlanetData("海王星 Neptune", 40));
planetsData.push(new PlanetData("太阳 Sun", 150));

const canvaWidth = 350;
const canvaHeight = window.innerHeight;

var engine = Matter.Engine.create();

var render = Matter.Render.create({
  element: document.body,
  engine: engine,
  options: {
    height: canvaHeight,
    width: canvaWidth,
    wireframes:false,
  },
});

function Planet(x, y, id) {
  let radius = planetsData[id].radius;
  let imgScale;
  /*
  set the image larger for saturn since it has a ring (which dont have physic collision, of course)
  if i dont do this the collision box(or should i say ball?) is slightly bigger than the texture
  which will break the experience.
  */
  if(id == 5){
    imgScale = (radius+20)/1000;
  }
  else{
    imgScale = radius/1000
  }

  var options = {
    friction: 0.5,
    restitution: 0.5,
    label: "p" + planetsData[id].name,
    render:{
        sprite:{
            texture:`./img/${id+1}.png`,
            xScale:imgScale,
            yScale:imgScale,
        }
    }
  };
  this.body = Matter.Bodies.circle(x, y, radius, options);
  Matter.Composite.add(engine.world, this.body);
  return this.body;
}

var ground = Matter.Bodies.rectangle(
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
var wallLeft = Matter.Bodies.rectangle(-25, canvaHeight / 2, 50, 1000, {
  isStatic: true,
  label: "wall",
});
// create a wall on rightside
var wallRight = Matter.Bodies.rectangle(canvaWidth + 25, canvaHeight / 2, 50, 1000, {
  isStatic: true,
  label: "wall",
});
var endLine = Matter.Bodies.rectangle(canvaWidth/2, 100, canvaWidth, 1, {
  isSensor: true,
  isStatic: true,
  label: "endLine",
  render:{
    strokeStyle:"red"
  }
});
Matter.Composite.add(engine.world, [wallLeft, wallRight, ground, endLine]);

const droppedPlanetList = [];
Matter.Events.on(engine, "collisionStart", function (event) {
    var pairs = event.pairs;
    for (var i = 0; i < pairs.length; i++) {
        var pair = pairs[i];
        var _BodyA = Matter.Composite.get(engine.world, pair.bodyA.id, "body"); //save two body
        var _BodyB = Matter.Composite.get(engine.world, pair.bodyB.id, "body");
        if (_BodyA?.label.slice(0,1) == "p" && _BodyB?.label.slice(0,1) == "p") {
        // if two planet collide
            if (_BodyA.circleRadius == _BodyB.circleRadius) {
                // and have the same radius (planets will not have two same radius)
                let _id = getByValue(_BodyA.circleRadius) + 1; // temp id for new planet
                if (_id < 9) {
                    if( _BodyA.position.y >= 100){
                    // if not two sun collide each other
                    let _x = (_BodyA.position.x + _BodyB.position.x) / 2; //spawn new planet between two old planets
                    let _y = (_BodyA.position.y + _BodyB.position.y) / 2; //the old and clasic 中点公式
                    Matter.Composite.remove(engine.world, [pair.bodyA, pair.bodyB]); // remove two old planets
                    var _planet = Planet(_x, _y, _id);
                    droppedPlanetList.push(_planet.id); //add new planet and make them "dropped" (more explanation later..)
                    }
                }
                else{
                    win();
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
        if yes? then you're done. the game is over.
        */
        if (_BodyA?.label == "endLine") {
            if (droppedPlanetList.indexOf(_BodyB.id) == -1) {
              droppedPlanetList.push(_BodyB.id);
            } else {
              lose();
            }
        }
    }
});

let random = 0;

function updateNewReadyPlanet() {
  const img = document.getElementById("follow-img");
  currentReadyPlanet = Planet(canvaWidth / 2, 25, random);
  let tempRandom = getRandomInt(4);
  while(tempRandom == random){
    tempRandom = getRandomInt(4);
  }
  random = tempRandom;
  img.src = `./img/${random+1}.png`;
  img.style.width = `${planetsData[random].radius*2}px`
  updateHint(random);
  Matter.Body.setPosition(currentReadyPlanet, { x: X, y: 50 });
}
function updateHint(id){
    const hintName = document.querySelector("#hint-name");
    const hintImg = document.querySelector("#hint-img");
    hintName.innerHTML = planetsData[id].name;
    hintImg.src = `./img/${id+1}.png`;
}

const clock = document.querySelector("#count-down");
let remainSecond = 3;
function updateEverySecond(){
    clock.innerHTML = remainSecond;
    remainSecond -= 1;
    if(remainSecond < 0){
        updateNewReadyPlanet();
        remainSecond = 3;
    }
}
function stop(){
  runner.enabled = false;
  clearInterval(countDownTimer);
}
function win(){
  stop();
  var tl = gsap.timeline();
  tl.to(".win-page",1,{y:0},"+=1");
}
function lose(){
  stop();
  var tl = gsap.timeline();
  tl.to(".lose-page",1,{y:0},"+=1");
}
document.body.addEventListener("mousemove",(event)=>{
    const img = document.getElementById("follow-img");
    let _x = event.clientX - (window.innerWidth - canvaWidth) / 2;
    if (_x < 0) {
      _x = 0;
    }
    if (_x > canvaWidth) {
      _x = canvaWidth;
    }
    X = _x;
    img.style.left = _x + (window.innerWidth - canvaWidth) / 2 + "px";
});
gsap.fromTo(".starting-hint",0.75,{opacity:0.2},{opacity:0.75,repeat:-1,yoyo:true})
let countDownTimer;
function start(){
    gsap.to(".start-page",{y:"-100%"});
    updateHint(0);
    
    countDownTimer = setInterval(updateEverySecond,1000);
    setTimeout(function() {}, 200);
    document.body.addEventListener("click",()=>{
        updateNewReadyPlanet();
        clearInterval(countDownTimer);
        remainSecond = 3;
        countDownTimer = setInterval(updateEverySecond,1000);
    })
}
// run the renderer
Matter.Render.run(render);

// create runner
var runner = Matter.Runner.create();

// run the engine
Matter.Runner.run(runner, engine);