/*
function draw() {
  var canvas = document.getElementById("game");
  var context = canvas.getContext("2d");
  context.fillStyle = "black";
  for (var i = 0; i < 10; i++) {
    for (var j = 0; j < 10; j++) {
      if ((i + j)%2) {
        context.fillRect(i * canvas.width / 10, j * canvas.height / 10, canvas.width / 10, canvas.height / 10);
      }
    }
  }
  context.fill();
}

var PI = 3.1415926;
function resizeCanvas() {
  canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth - 4;
  canvas.height = window.innerHeight - 4;
}

function updateDisplay() {
  var canvas = document.getElementById("canvas");
  //resizeCanvas();
  draw();
  var context = canvas.getContext("2d");


  context.fillStyle = "white"; //black
  var width = canvas.width; //window.innerWidth
  var height = canvas.height; //window.innerHeight;
  var xCenter = width / 2;
  var yCenter = height / 2;

  context.fillRect(0, 0, width, height);


  var text = document.getElementById("text");
  var a = Math.random() - 0.5;
  var b = Math.random() - 0.5;
  var c = Math.random() - 0.5;
  //a = 0.10609288847872211;
  //b = -0.34661220969524353;
  //c = 0.3623379881661305;
  a = 0.0953857269262095;
  b = -0.23704857875661212;
  c = 0.4554840376964372;
  var n = Math.sqrt(a * a + b * b + c * c);
  a = a / n;
  b = b / n;
  c = c / n;
  d = Math.random() - 0.5;
  d *= 0.3;
  d = -0.09466447145896582;

  // This is our x axis
  var a2 = b;
  var b2 = -a;
  var c2 = 0;

  if (a2 === 0 && b2 === 0) {
    a2 = 1;
    b2 = 0;
    c2 = 0;
  }

  // This is our y axis
  var a4 = b * c2 - c * b2;
  var b4 = c * a2 - a * c2;
  var c4 = a * b2 - b * a2;


  // context.fillStyle = "white";
  // context.font = "bold 40px sans-serif";
  // context.textAlign = "center";
  // context.textBaseline = "middle";
  // context.fillText("a: " + a + "b: " + b + "c: " + c, xCenter, 100);
  // context.fillText("a2: " + a2 + "b2: " + b2 + "c2: " + c2, xCenter, 200);
  // context.fillText("a4: " + a4 + "b4: " + b4 + "c4: " + c4, xCenter, 300);

  for (var r = 0; r < 1; r += 0.0001) {
    var theta = 18222534.234 * PI * r;
    var x = Math.cos(theta);
    var y = Math.sin(theta);
    var a3 = r * (x * a4 + y * a2)+ d * a;
    var b3 = r * (x * b4 + y * b2)+ d * b;
    var c3 = r * (x * c4 + y * c2)+ d * c;


    var red = 0.5 + a3;
    var green = 0.5 + b3;
    var blue = 0.5 + c3;


    red *= 255;
    green *= 255;
    blue *= 255;

    red = Math.floor(red);
    blue = Math.floor(blue);
    green = Math.floor(green);

    var cropping = "kaleidoscope";
    if (cropping == "crop") {
      if (red < 0||blue < 0||green < 0||red > 255||blue > 255||green > 255) {
        red = 0;
        blue = 0;
        green = 0;
      }
    } else if (cropping == "limit") {
      if (red < 0) red = 0;
      if (blue < 0) blue = 0;
      if (green < 0) green = 0;

      if (red > 255) red = 255;
      if (blue > 255) blue = 255;
      if (green > 255) green = 255;
    } else if (cropping == "wrap") {
      red %= 256;
      green %= 256;
      blue %=256;
      if (red < 0) red += 256;
      if (green < 0) green += 256;
      if (blue < 0) blue += 256;
    } else if (cropping == "kaleidoscope") {
      red %= 512;
      green %=512;
      blue %= 512;
      if (red < 0) red += 512;
      if (green < 0) green += 512;
      if (blue < 0) blue += 512;
      if (red > 255) red = 511 - red;
      if (green > 255) green = 511 - green;
      if (blue > 255) blue = 511 - blue;

    }



    context.fillStyle = "rgb(" + red + "," + green+", "+blue+")";
    //context.strokeStyle = "rgb(255, 255, 255)";
    //context.strokeStyle = "white";
    context.beginPath();
    context.arc(xCenter + 300 * r * x, yCenter + 300 * r * y, r * 6, 0, 2 * PI, false);
    context.fill();
  }
  context.strokeStyle = "white";
  context.lineWidth = 15;
  context.beginPath();
  context.arc(xCenter, yCenter, 300, 0, 2 * PI, false);
  context.stroke();
}*/

var debug_message = "";
var HEIGHT = 20;
var WIDTH = 90;
var DEPTH = 90;
var VIEWPORT_HEIGHT, VIEWPORT_WIDTH;
var z_center, x_center, y_center;
z_center = HEIGHT / 2;
x_center = WIDTH / 2;
y_center = DEPTH / 2;
var render_x, render_y;
render_x = -3 * x_center + 2 * y_center;
render_y = -2 * z_center + y_center;
var RENDERING_BASEPOINT_X, RENDERING_BASEPOINT_Y;
var player_x_rendering_offset = 0; // should be 0, 1  or 2
var render_x_offset = 0;
var render_z_offset = 0;
var player_z_rendering_offset = 0;

var px = 0.0;
var py = 0.0;
var pz = 10.0;
var pvx = 0.02;
var pvy = 0.02;
var pvz = 0.0;


// These offsets are the offset of the "world" in "blocks" coordinates.
var offsetZ = 0;
var offsetX = 30;
var offsetY = 20;

// This is the coordinate of the player in world coordinates.
var playerpos = [HEIGHT -1 /* z */, 0 /* x */, 0 /* y */];

var LEVEL = 0;

var setDisplayParameters = function(w, h){
  // var VIEWPORT_HEIGHT = 1 + 2 * HEIGHT + DEPTH ;
  // var VIEWPORT_WIDTH = 10 + 3*WIDTH + 2 * DEPTH ;
  // VIEWPORT_HEIGHT = 40;
  // VIEWPORT_WIDTH = 80;
  var needBufferResize = (VIEWPORT_WIDTH !== w || VIEWPORT_HEIGHT !== h);
  VIEWPORT_HEIGHT = h;
  VIEWPORT_WIDTH = w; // was 89

  // I want to automatically set these so that the middle of the render box is at the middle of the display.




  RENDERING_BASEPOINT_X = VIEWPORT_WIDTH / 2 - render_x;
  RENDERING_BASEPOINT_Y = VIEWPORT_HEIGHT / 2 - render_y;
  // this is to coerce the float into integers
  RENDERING_BASEPOINT_X = ~~(RENDERING_BASEPOINT_X);
  RENDERING_BASEPOINT_Y = ~~(RENDERING_BASEPOINT_Y);
  if (needBufferResize) {
    console.log("resizing buffers.");
    resizeBuffers();
  }
  //RENDERING_BASEPOINT_X = 100;
  //RENDERING_BASEPOINT_Y = -1;
};

setDisplayParameters(139, 49);

function getSortedCoordinates(blocks){
  var coordinates =[];
  var X = blocks[0].length;
  var Y = blocks[0][0].length;
  var Z = blocks.length;

  //                                       z  x  y
  // want a shape aligned with the vector [3, 4, 6]
  for (var x = 0; x < X; x++) {
    for (var y = 0; y < Y; y++) {
      for (var z = 0; z < Z; z++) {
        /*x_projected = x - 0.666666 * y;
        z_projected = z - 0.5 * y;
        if (x_projected * x_projected + z_projected * z_projected < 20 * 20) {
          coordinates.push([z,x,y]);
        }*/

        var YY = RENDERING_BASEPOINT_Y -2*z      +  y;
        var XX = RENDERING_BASEPOINT_X      -3*x + 2*y;
        // YY >= 1 is because cropping may move
        // Similar for VIEWPORT_HEIGHT - 1
        if ( XX -1  >= 0 && XX + 4 < VIEWPORT_WIDTH && YY >= 1 && YY + 3 < VIEWPORT_HEIGHT - 1) {
          coordinates.push([z,x,y]);
        }
      }
    }
  }
  //coordinates.sort(function(a,b){return a[0] + a[1] + a[2] - b[0] - b[1] - b[2]})
  return coordinates;
}

function setAll(lines, value) {
  for (var i = 0; i < lines.length; i++) {
    for (var j = 0; j < lines[i].length; j++) {
      lines[i][j] = value;
    }
  }
}

function clear(lines) {
  setAll(lines, " ");
}

function render(blocks, sortedCoordinates) {
  render_x_offset = player_x_rendering_offset;
  render_z_offset = player_z_rendering_offset;
  var X = RENDERING_BASEPOINT_X + render_x_offset; // rightward shift of basepoint
  var Y = RENDERING_BASEPOINT_Y + render_z_offset; // downward shift of basepoint
  clear(lines);
  /*setAll(depthBuffer, -1);*/
  for (var i = 0; i < sortedCoordinates.length; i++) {
    var c = sortedCoordinates[i];
    var z = c[0];
    var x = c[1];
    var y = c[2];
    var depth = x + y + z;
    if (blocks[z][x][y] !== 0) {
      var hasXNeighbor = (x > 0 && blocks[z][x-1][y] == 1);
      var hasYNeighbor = (y > 0 && blocks[z][x][y-1] == 1);
      var hasZNeighbor = (z > 0 && blocks[z-1][x][y] == 1);
      var hasXZNeighbor = (x > 0)  && (z + 1 < HEIGHT) && (blocks[z+1][x-1][y] == 1);
      var hasXYNeighbor = (x > 0)  && (y + 1 < DEPTH) && (blocks[z][x-1][y+1] == 1);
      var hasYXNeighbor = (y > 0)  && (x + 1 < WIDTH) && (blocks[z][x+1][y-1] == 1);
      var hasYZNeighbor = (y > 0)  && (z + 1 < HEIGHT) && (blocks[z+1][x][y-1] == 1);
      var hasZXNeighbor = (z > 0)  && (x + 1 < WIDTH) && (blocks[z-1][x+1][y] == 1);
      var hasZYNeighbor = (z > 0)  && (y + 1 < DEPTH) && (blocks[z-1][x][y+1] == 1);

      var hasYZXNeighbor = (y > 0) && (x > 0) && (z + 1 < HEIGHT) && (blocks[z+1][x-1][y-1] == 1);

      var hasYXBehindNeighbor = (y > 0) && (x > 0) && (blocks[z][x-1][y-1] == 1);

      //var hasXPlusYPlusNeighbor = (x+1 < WIDTH) && (y+1 < DEPTH) $$ ( blocks[z][x+1][y+1] == 1);

      var YY = Y -2*z      +  y;
      var XX = X      -3*x + 2*y;

      if (YY + 3 > lines.length) {
        throw RangeError("index " + (YY+3) +" out of range.");
      }

      if (blocks[z][x][y] == 1){
        /*depthBuffer[YY][XX] = depth;
        depthBuffer[YY][XX + 1] = depth;
        depthBuffer[YY][XX+2] = depth;

        depthBuffer[YY+1][XX-1] = depth;
        depthBuffer[YY+1][XX  ] = depth;
        depthBuffer[YY+1][XX+1] = depth;
        depthBuffer[YY+1][XX+2] = depth;
        depthBuffer[YY+1][XX+3] = depth;

        depthBuffer[YY+2][XX-1] = depth;
        depthBuffer[YY+2][XX  ] = depth;
        depthBuffer[YY+2][XX+1] = depth;
        depthBuffer[YY+2][XX+2] = depth;
        depthBuffer[YY+2][XX+3] = depth;
        depthBuffer[YY+2][XX+4] = depth;

        depthBuffer[YY+3][XX-1] = depth;
        depthBuffer[YY+3][XX  ] = depth;
        depthBuffer[YY+3][XX+1] = depth;
        depthBuffer[YY+3][XX+2] = depth;
        depthBuffer[YY+3][XX+3] = depth;
        depthBuffer[YY+3][XX+4] = depth;*/


        lines[YY][XX] = (hasYNeighbor && !hasYZNeighbor) ? " " :"_";     //str(i)
        lines[YY][XX + 1] = (hasYNeighbor && !hasYZNeighbor) ? (hasYZXNeighbor ? lines[YY][XX + 1] : " ") :(hasYXBehindNeighbor? lines[YY][XX+1]:"_");

        if (hasXZNeighbor) {
          lines[YY][XX + 2] = "|";
        } else {
          if (hasYNeighbor && !hasYZNeighbor) {
            if (!hasYZXNeighbor) {
              if (!hasYXBehindNeighbor) {
                lines[YY][XX + 2] = "\\";
              } else {
                lines[YY][XX + 2] = " ";
                }
            }
          } else {
            lines[YY][XX + 2] = "_";
          }
        }

        lines[YY + 1][XX - 1] = (hasYNeighbor && !hasYXNeighbor) ? " " :"|";
        lines[YY + 1][XX] = "\\";
        lines[YY + 1][XX + 1] = "_";
        lines[YY + 1][XX + 2] = "_";
        lines[YY + 1][XX + 3] = (hasXNeighbor && !hasXZNeighbor) ? "_" : "\\";
        lines[YY + 2][XX - 1] = (hasYNeighbor && !hasYXNeighbor) ? " " :"|";
        lines[YY + 2][XX]     = " ";
        lines[YY + 2][XX + 1] = "|";

        lines[YY + 2][XX + 2] = " ";
        lines[YY + 2][XX + 3] = " ";
        if (hasXNeighbor && !hasXYNeighbor){
          lines[YY + 2][XX + 4] = " ";
        } else{
          lines[YY + 2][XX + 4] = "|";
      }
        lines[YY + 3][XX]     = (hasZNeighbor && !hasZXNeighbor) ? " " : "\\"; //should be " " and "\\"
        lines[YY + 3][XX + 1] = "|";
        if (hasZNeighbor && !hasZYNeighbor) {
          lines[YY + 3][XX + 2] = " ";
          lines[YY + 3][XX + 3] = " ";
        } else {
          lines[YY + 3][XX + 2] = "_";
          lines[YY + 3][XX + 3] = "_";
        }
        if (hasXYNeighbor) {
          lines[YY + 3][XX + 4] = "|";
        } else if (hasXNeighbor){
          if (hasZNeighbor && !hasZYNeighbor) {
            lines[YY + 3][XX + 4] = " ";
          } else {
            lines[YY + 3][XX + 4] = "_";
          }
        } else {
          lines[YY + 3][XX + 4] = "|";
        }
      } else if (blocks[z][x][y] == 3){

        /*depthBuffer[YY + 1][XX + 2] = depth;
        depthBuffer[YY + 1][XX + 3] = depth;
        depthBuffer[YY + 1][XX + 4] = depth;
        depthBuffer[YY + 2][XX + 2] = depth;
        depthBuffer[YY + 2][XX + 3] = depth;
        depthBuffer[YY + 2][XX + 4] = depth;
        depthBuffer[YY + 3][XX + 2] = depth;
        depthBuffer[YY + 3][XX + 3] = depth;
        depthBuffer[YY + 3][XX + 4] = depth;*/


        lines[YY + 1][XX + 2] = ":";
        //lines[YY + 1][XX + 3] = "<span style = \"color:yellow\">*</span>";
        lines[YY + 1][XX + 3] = "*";
        lines[YY + 1][XX + 4] = ":";
        lines[YY + 2][XX + 2] = " ";
        lines[YY + 2][XX + 3] = "|";
        lines[YY + 2][XX + 4] = " ";
        lines[YY + 3][XX + 2] = " ";
        lines[YY + 3][XX + 3] = "|";
        lines[YY + 3][XX + 4] = " ";
      } else if (blocks[z][x][y] == 4){
          //lines[YY+2][XX-1] = "~";
          //lines[YY+2][XX+0] = "<span style = \"color:blue\">s</span>";
          //lines[YY+2][XX+1] = "<span style = \"color:blue\">e</span>";
          //lines[YY+2][XX+2] = "<span style = \"color:blue\">a</span>";

          lines[YY+2][XX+0] = "~";
          lines[YY+2][XX+1] = "~";
          lines[YY+2][XX+2] = "~";

          //lines[YY+2][XX+1] = "<span style = \"color:cyan\">~</span>";
          //lines[YY+2][XX+3] = "~";
        }
      else {
        lines[YY + 2 - player_z_rendering_offset][XX + 0 + 2 - player_x_rendering_offset] = "<span style = \"color:white\">u</span>";
        // lines[YY + 2 - player_z_rendering_offset][XX + 1 + 2 - player_x_rendering_offset] = "<span style = \"color:white\">o</span>";
        // lines[YY + 2 - player_z_rendering_offset][XX + 2 + 2 - player_x_rendering_offset] = "<span style = \"color:white\">u</span>";

        //lines[YY + 2][XX + 0] = "<span style = \"color:#00FF00; background-color:black\">y</span>";
        //lines[YY + 2][XX + 1] = "<span style = \"color:#00FF00; background-color:black\">o</span>";
        //lines[YY + 2][XX + 2] = "<span style = \"color:#00FF00; background-color:black\">u</span>";


        // lines[YY + 2][XX + 0] = "<span style = \"color:#C3834C; background-color:black\">d</span>";
        // lines[YY + 2][XX + 1] = "<span style = \"color:#C3834C; background-color:black\">o</span>";
        // lines[YY + 2][XX + 2] = "<span style = \"color:#C3834C; background-color:black\">g</span>";

        /*
        for (var u = -2; u < 3; u++) {
          for (var v = -4; v < 5; v++) {
            var distance = Math.abs(player_x_rendering_offset - v - (3 * (px - Math.floor(px)) - 2 * (py - Math.floor(py)))) / 1.5 +
                           Math.abs(player_z_rendering_offset - u - (2 * (pz - Math.floor(pz)) - (py - Math.floor(py))));
            var symbol = " ";
            if (distance <= 1.5) {
              symbol = "+";
            } else if (distance <= 3.5) {
              symbol = "-";
            }
            if (symbol != " ") {
              //lines[YY + 2 - player_z_rendering_offset + u][XX + 2 - player_x_rendering_offset + v] = "<span style = \"color:#C3834C; background-color:black\">"+symbol+"</span>";
             lines[YY + 2 - player_z_rendering_offset + u][XX + 2 - player_x_rendering_offset + v] = symbol;
            }
          }
        }
        */

/*
        lines[YY][XX+1] = "*";
        lines[YY+1][XX-1] = "_";
        lines[YY+1][XX] = "/";
        lines[YY+1][XX+1] = "|";
        lines[YY+1][XX+2] = "\\";
        lines[YY+1][XX+3] = "_";

        lines[YY+2][XX] = "/";
        lines[YY+2][XX+1] = "\\";

        lines[YY+3][XX-1] = "_";
        lines[YY+3][XX] = "|";
        lines[YY+3][XX+2] = "\\";
        lines[YY+3][XX+3] = "_";
 */   }
    }
  }
}


function physics(blocks) {
  for (var y = 0; y < blocks[0][0].length; y++) {
    for (var x = 0; x < blocks[0].length; x++) {
      for (var z = 0; z < blocks.length - 1; z++) {
        if (blocks[z+1][x][y]==2 && !blocks[z][x][y]) {
          blocks[z][x][y] = blocks[z+1][x][y];
          blocks[z+1][x][y] = 0;
        }
      }
    }
  }
}
var keyStates = [false, false, false, false, false];

function setString() {
  var displayText = document.getElementById('active-text');
  displayText.innerHTML = debug_message + "<br>Controls: WASD to move, J to jetpack";
  //displayText.innerHTML = "";

  var partialJoin = [];
  skipInitial = 4;
  skipEnd = 5;
  if (LEVEL == 1) {
    skipInitial = 16;
    skipEnd = 14;
  }
  var leftcut = 0;
  var rightcut = 0;
  for (var i = skipInitial; i < lines.length-skipEnd; i++) {
    partialJoin.push ('<br>' + lines[i].slice(5 + leftcut, VIEWPORT_WIDTH - 4 - rightcut).join(""));
  }
  displayText.innerHTML += partialJoin.join("");
  displayText.innerHTML += "<br>" + (keyStates[0] ? "<" : "*") +
                                    (keyStates[1] ? "^" : "*") +
                                    (keyStates[2] ? ">" : "*") +
                                    (keyStates[3] ? "v" : "*") +
                                    "<br>" +
                                    (keyStates[4] ? "[JETPACK]":"[       ]") +
                                    "<br>WASD to move, J to jetpack";
}

function generateBlockArray(height, width, depth) {
  blocks = [];
  for (var z = 0; z < height; z++) {
    layer = [];
    for (var x = 0; x < width; x++) {
      line = [];
      for (var y = 0; y < depth; y++) {
        line.push(0);
      }
      layer.push(line);
    }
    blocks.push(layer);
  }
  return blocks;
}

function generateArrayWithEntries(rows, cols, value) {
  var lines = []
  for (var i = 0; i < rows; i++) {
    line = [];
    for (var j = 0; j < cols; j++) {
      line.push(value)
    }
    lines.push(line);
  }
  return lines;
}

function generateLines(rows, cols) {
  return generateArrayWithEntries(rows, cols, " ");
}

var LOOP_ACTIVE = false;

function generateDepthBuffer(rows, cols) {
  return generateArrayWithEntries(rows, cols, -1);
}

var lines, renderBuffer, depthBuffer;
function resizeBuffers() {
  lines = generateLines(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
  renderBuffer = generateLines(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
  depthBuffer = generateDepthBuffer(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
}

function manipulateText() {
  if (LOOP_ACTIVE === false){
    LOOP_ACTIVE = true;
    blocks = generateBlockArray(HEIGHT, WIDTH, DEPTH);
    resizeBuffers();
    sortedCoordinates = getSortedCoordinates(blocks);
    setWaves(blocks, sortedCoordinates);
    update(blocks, sortedCoordinates);
  }
}

/*
Modify this function to change the level
*/
function getWorldTile(z,x,y) {
  //var t = 0;
  //height =/* - 0.2*(x-offsetX) - 0.2*(y-offsetY) */ + Math.sin(t * 0.005 + (x - offsetX) * 0.04) * 2 + Math.sin( (y - offsetY) * 0.04)*2;
  var output = 0;
  if (LEVEL == 0) {
    var height = 0;

    if (z < 0) {
      return 0;
    }
    if (~~(z-height) == 0 ) {
      output = 1;
    } else {
      var waterLevel = 3;
      var terrainSurface = ( (  Math.sin(x*0.05 + y*0.1) +  Math.sin(x*0.05 + y * 0.08) + Math.sin(x*0.1) + Math.sin(y *0.1  ))) + waterLevel;
      if (z <= terrainSurface && terrainSurface > waterLevel) {
        output = 1;
      } else if (z == waterLevel) {
        // draw water
        if (x % 4 == 0 && y % 4 == 0) {
          output = 4;
        }
      } /*else if (z < terrainSurface + 2 * (terrainSurface - waterLevel)) {
        output = 1;
      }*/
    }

    if (z <= 4) {
      if ( (~~(x/5)) % 20 == 0 || (~~(y / 5)) % 20 == 0 ) {
        X = ~~(x/100);
        Y = ~~(y/100);
        if (Math.sin(X*X) + Math.cos(Y*Y) > 0) {
          output = 1;
        }

      }
    }

    if (x % WIDTH == 0 && y%DEPTH == 0 && Math.abs(z - height) < 10 ) {
      output = 3;
    }

    if (z > 60 && Math.abs(Math.abs(x) % 20 - 10 ) + Math.abs(Math.abs(y) % 20 - 10) + Math.abs(z % 20 - 10) < (z-60)/20  ) {
      output = 1;
    }

    if (z > 90) {
      var a =  ((x-10) % 20) == 0;
      var b =  ((y-10) % 20) == 0;
      var c =  ((z-10) % 20) == 0;
      //if ((a&&(b || c)) || (b&&c)) {
      if (a + b + c > 1) {
        output = 1;
      }
    }
  } else if (LEVEL == 1) {
    if (x*x + y*y + z*z < 64 && x*x + y*y + z*z > 16) {
      date = new Date()
      t = date.getTime()

      /*if (Math.abs(z - 2 * Math.sin( (x - y) / 10 + t / 500)) < 0.5) {
        output = 1
      }*/

      /*if (Math.abs( (x + y) * Math.cos(t / 500) + (z) * Math.sin(t / 500)) < 1.2) {
        output = 1
      }*/

      height = 0;
      l = Math.sqrt(x*x + y*y);
      dot = x * Math.cos(t/500) + y * Math.sin(t / 500);
      if (dot / l > 0.9 || dot / l < -0.9) {
        height += 1;
      }

      /*if (dot / l > 0.7) {
        height += 1;
      }*/

      /*if (dot / l < -0.8) {
        height -= 1;
      }*/

      if (z <= height && z >= 0) {
        output = 1;
        if (dot / l < 0.4 && dot / l > -0.4) {
          output = 0;
        }
      }
    }
    if (z==0 && y==0 && x==0) {
      output = 2;
    }
  } else if (LEVEL == 2) {
    if (z == 0) {
      return 1;
    } else if (z == 1) {
      var xxx = Math.abs(x);
      var yyy = Math.abs(y);
      if ((xxx >= yyy && xxx % 5 == 4) || (yyy >= xxx && yyy % 10 == 5) ) {
        return 1;
      } else {
        return 0;
      }
    } else if (z==playerpos[0] && x==playerpos[1] && y==playerpos[2]) {
      return 2;
    } else {
      return 0;
    }
    if (Math.abs(z) == Math.abs(~~(x/2)) || Math.abs(z) == Math.abs(~~(y/2))) {
      return 1;
    } else {
      return 0;
    }
  } else {
    if (z == 0) {
      output = 1;
    } else{
      d = 13
      D = 26

      x = ((((x + d) % D) + D) % D) - d
      y = ((((y + d) % D) + D) % D) - d
      a = Math.abs(x) == 5;
      b = Math.abs(z - 6) == 5;
      c = Math.abs(y) == 5;
      A = Math.abs(x) <= 5;
      B = Math.abs(z - 6) <= 5;
      C = Math.abs(y) <= 5;
      if (a && b && C || a && B && c || A && b && c) {
        output = 1;
      }
    }
  }
  if (z==playerpos[0]-offsetZ && x==playerpos[1]-offsetX && y==playerpos[2]-offsetY) {
      output = 2;
      console.log("player still here");
  }
  return output;
}

function getTile(z,x,y) {
  return getWorldTile(z-offsetZ, x-offsetX, y-offsetY);
}


// Populates |blocks| with tiles by converting to world coordinates
// and the calculating the tile in world coordinates.
function setWaves(blocks, sortedCoordinates) {
  for(var i = 0; i < sortedCoordinates.length; i++) {
    c = sortedCoordinates[i];
    blocks[c[0]][c[1]][c[2]] = getTile(c[0],c[1],c[2]);
  }
}

function tryToMovePlayer(dz, dx, dy) {
  if (getTile(playerpos[0] + dz, playerpos[1] + dx, playerpos[2] + dy) % 2 == 0) {
    playerpos = [playerpos[0] + dz, playerpos[1] + dx, playerpos[2] + dy];
    blocks[playerpos[0]-dz][playerpos[1]-dx][playerpos[2]-dy] = getTile(playerpos[0]-dz,playerpos[1]-dx,playerpos[2]-dy);
    z = playerpos[0];
    x = playerpos[1];
    y = playerpos[2];
    blocks[z][x][y] = 2;
  }
}
/*
function tryToMovePlayer(dz, dx, dy) {
  newpos = [playerpos[0] + dz, playerpos[1] + dx, playerpos[2] + dy]
  if (0 <= newpos[0] && newpos[0] < HEIGHT && 0 <= newpos[1] && newpos[1] < WIDTH && 0<= newpos[2] && newpos[2] < DEPTH) {
    if (blocks[newpos[0]][newpos[1]][newpos[2]] % 2 == 0 )
    {
      blocks[newpos[0]][newpos[1]][newpos[2]] = blocks[playerpos[0]][playerpos[1]][playerpos[2]];
      blocks[playerpos[0]][playerpos[1]][playerpos[2]] = 0;
      playerpos = newpos;
    }
  }
}
*/



function projectOut(blocks) {
  width = 0.3;


  for (var i = 0; i < 6; i++) {
    var pushed = false;

    var mz = Math.floor(pz - width);
    var Mz = Math.floor(pz + width);
    var mx = Math.floor(px - width);
    var Mx = Math.floor(px + width);
    var my = Math.floor(py - width);
    var My = Math.floor(py + width);

    l = []
    for (var z = mz; z <= Mz; z+=1) {
    for (var x = mx; x <= Mx; x+=1) {
    for (var y = my; y <= My; y+=1) {
      l.push({distance: Math.abs(z + 0.5 - pz) + Math.abs(x + 0.5 - px) + Math.abs(y + 0.5 - py), value:[z,x,y]});
    }}}

    l.sort(function(a, b){return a.distance - b.distance});
    l = l.map(function(a){return a.value});

    for (var i = 0; i < l.length && !pushed; i+=1) {
      z = l[i][0];
      x = l[i][1];
      y = l[i][2];
      a = getWorldTile(z, x, y);
      if (a == 1) {
        // push in minimum valid direction
        //console.log(pz, px, py);
        //console.log(mz, Mz, mx, Mx, my, My);
        var z_plus_move = getWorldTile(z+1, x, y) == 1 ? 10 : z + 1 + width - pz;
        var z_minus_move = getWorldTile(z-1, x, y) == 1 ? -10 : z - width - pz;
        var x_plus_move = getWorldTile(z, x+1, y) == 1 ? 10 : x + 1 + width - px;
        var x_minus_move = getWorldTile(z, x-1, y) == 1 ? -10 : x - width - px;
        var y_plus_move = getWorldTile(z, x, y+1) == 1 ? 10 : y + 1 + width - py;
        var y_minus_move = getWorldTile(z, x, y-1) == 1 ? -10 : y - width - py;
        var z_off = z_plus_move < -z_minus_move ? z_plus_move : z_minus_move;
        var x_off = x_plus_move < -x_minus_move ? x_plus_move : x_minus_move;
        var y_off = y_plus_move < -y_minus_move ? y_plus_move : y_minus_move;
        //console.log(z_off, x_off, y_off);
        if (Math.abs(z_off) < Math.abs(x_off) && Math.abs(z_off) < Math.abs(y_off)) {
          pz += z_off;
          pvz = 0.0;
          if (z_off != 0.0) {
            pushed = true;
          }
        } else if (Math.abs(x_off) < Math.abs(y_off)) {
          px += x_off;
          pvx = 0.0;
          if (x_off != 0.0) {
            pushed = true;
          }
        } else {
          py += y_off;
          pvy = 0.0;
          if (y_off != 0.0) {
            pushed = true;
          }
        }
      }
    }
    if (pushed == false) {
      break;
    }
  }

  /*sif (pz < 1.3) {
    pz = 1.3;
    pvz = 0.0;
  }*/

  /*if (a % 2 == 1) {
    var z_rem = (pz - ~~pz);
    var x_rem = (px - ~~px);
    var y_rem = (py - ~~py);
    var z_off = 1.0 - z_rem;// Always push up
    var x_off = x_rem > 0.5 ? 1 - x_rem : - x_rem;
    var y_off = y_rem > 0.5 ? 1 - y_rem : - y_rem;
    if (Math.abs(z_off) < Math.abs(x_off) && Math.abs(z_off) < Math.abs(y_off)) {
      pz += z_off;
      pvz = 0.0;
      console.log("pushed vertically");
    } else if (Math.abs(x_off) < Math.abs(y_off)) {
      px += x_off;
      pvx = 0.0;
      console.log("pushed in x direction");
    } else {
      py += y_off;
      pvy = 0.0;
      console.log("pushed in y direction");
    }
  }*/
}


function update(blocks, sortedCoordinates) {
  var displayText = document.getElementById('active-text');
  w = Math.round(displayText.offsetWidth / 8) + 14;
  old_viewport_width = ~~VIEWPORT_WIDTH;
  h = Math.round(50);
  setDisplayParameters(w, h);
  var displayChanged = false;
  if (VIEWPORT_WIDTH !== old_viewport_width) {
    console.log("display parameters were changed from " + old_viewport_width + " to " + VIEWPORT_WIDTH);
    displayChanged = true;
  }

  var oldpos = playerpos.slice(0);
  var oldoffset = [offsetZ, offsetX, offsetY];
  var old_player_x_rendering_offset = player_x_rendering_offset;
  var old_player_z_rendering_offset = player_z_rendering_offset;

  // Position and velocity update
  if (LEVEL != 1) {
    pvz += -0.01;
    var a = 0.01;
    if (keyStates[0]) { // A
      pvx += a;
    }
    if (keyStates[2]) { // D
      pvx -= a;
    }
    if (keyStates[1]) { // W
      pvy -= a;
    }
    if (keyStates[3]) { // S
      pvy += a;
    }
    if (keyStates[4]) {
      pvz += 2 * a;
    }

    if (!keyStates[0] && !keyStates[1] && !keyStates[2] && !keyStates[3] && !keyStates[4]) {
      pvx *= 0.9;
      pvy *= 0.9;
      pvz *= 0.9;
    }

    if (pvz >= 1.0) {
      pvz = 1.0;
    }
    if (pvz <= -1.0) {
      pvz = -1.0;
    }

    if (pvx >= 1.0) {
      pvx = 1.0;
    }
    if (pvx <= -1.0) {
      pvx = -1.0;
    }

    if (pvy >= 1.0) {
      pvy = 1.0;
    }
    if (pvy <= -1.0) {
      pvy = -1.0;
    }




    mini_vx = pvx / 10;
    mini_vy = pvy / 10;
    mini_vz = pvz / 10;
    for (var _ = 0; _ < 10; ++_) {
      px += pvx;
      py += pvy;
      pz += pvz;
      /*if (pz < 2.5) {
        pz = 2.5;
      }*/

      // Collision detection and pushing the player out of blocks
      projectOut(blocks);
    }



    playerpos[0] = Math.floor(pz);
    playerpos[1] = Math.floor(px);
    playerpos[2] = Math.floor(py);


    player_z_rendering_offset = Math.round(2 * (pz - Math.floor(pz)) - (py - Math.floor(py)));
    player_x_rendering_offset = Math.round(3 * (px - Math.floor(px)) - 2 * (py - Math.floor(py)));
  }



  var resetblocks = false;

  var x_space = WIDTH / 2 - 4;
  var y_space = DEPTH / 2 - 4;
  var z_space = HEIGHT / 2 - 4;
  offsetX = 30;
  offsetY = 20;
  offsetZ = 0;

  resetblocks = true;

  if (LEVEL == 1) {
    playerpos = [0,0,0];
    offsetZ = z_center;
    offsetX = x_center;
    offsetY = y_center;
  } else {
    offsetZ = 6 - playerpos[0];
    offsetY = 30 - playerpos[2];
    offsetX = 35 - playerpos[1];
  }

  // #*+-

  var positionChanged = oldpos[0] != playerpos[0] || oldpos[1] != playerpos[1] || oldpos[2] != playerpos[2];
  var offsetChanged = offsetZ != oldoffset[0] || offsetX != oldoffset[1] || offsetY != oldoffset[2];
  var player_x_rendering_offset_changed = player_x_rendering_offset != old_player_x_rendering_offset;
  var player_z_rendering_offset_changed = player_z_rendering_offset != old_player_z_rendering_offset;


  var needRedraw = /*positionChanged ||*/ offsetChanged || player_z_rendering_offset_changed || player_x_rendering_offset_changed || (LEVEL==1) || displayChanged;
  if (needRedraw) {
    if (resetblocks) {
      setWaves(blocks, sortedCoordinates);
    }

    if (1 || offsetChanged) {
      try {
        //console.log(playerpos[0], playerpos[1], playerpos[2]);
        blocks[playerpos[0] + offsetZ][playerpos[1] + offsetX][playerpos[2]+offsetY] = 2;
        render(blocks, sortedCoordinates);
      } catch (e){
        console.log(e.message);
      } finally {
      }
      // renderBuffer should contain a map of the non-player environment here.
    } else {
      // old renderBuffer can still be used
      // clean up lines
    }
    // add player here
      setString();
  }
  setTimeout(function(){
    update(blocks, sortedCoordinates);
  }, 20);
}

function initialize() {
  document.addEventListener("keydown", keyDownHandler, false);
  document.addEventListener("keyup", keyUpHandler, false);
  manipulateText();
}

function keyDownHandler(event)
{
  setKey(event, true);
}

function keyUpHandler(event)
{
  setKey(event, false);
}

function setKey(event, state)
{
  var keyPressed = String.fromCharCode(event.keyCode);
  if (keyPressed == "A") {       // left arrow
    keyStates[0] = state;
  } else if (keyPressed == "W") { // up arrow
    keyStates[1] = state;
  } else if (keyPressed == "D") { // right arrow
    keyStates[2] = state;
  } else if (keyPressed == "S") { // down arrow
    keyStates[3] = state;
  } else if (keyPressed == "J") { //jump
    keyStates[4] = state;
  }
}