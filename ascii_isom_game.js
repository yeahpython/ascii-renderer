// Debug message to show above the main scene.
var debug_message = "";

// 3D buffer storing block data
var blocks;

// The dimensions of the three-dimensional buffer used to store a slice
// of the world map.
var HEIGHT = 20;
var WIDTH = 90;
var DEPTH = 90;

// The three-dimensional center of the buffer area.
var z_center = HEIGHT / 2;
var x_center = WIDTH / 2;
var y_center = DEPTH / 2;

// The two-dimensional offset of the three-dimensional center from the
// two-dimensional rendered position of the [0,0,0].
var render_x = -3 * x_center + 2 * y_center;
var render_y = -2 * z_center + y_center;

// Uncropped dimensions of the two-dimensional buffer used to store renderings
// of the 3D scene. This may have roughness around the edges.
var VIEWPORT_HEIGHT, VIEWPORT_WIDTH;

// Reference coordinate from which to render all 3D objects.
var RENDERING_BASEPOINT_X, RENDERING_BASEPOINT_Y;

// Fine-grained offset of player from their cube coordinate, used to enable sub-
// block-sized motion.
var horizontal_player_correction = 0; // should be 0, 1  or 2
var vertical_player_correction = 0;

// Fine-grained offset of camera from their cube coordinate, used to enable sub-
// block-sized motion.
var horizontal_camera_correction = 0; // should be 0, 1  or 2
var vertical_camera_correction = 0;

// Fine-grained offset of rendering from the rendering basepoint, used to enable
// sub-block-sized motion
var render_x_offset = 0;
var render_z_offset = 0;

// Float coordinates of the user relative to the world coordinates.
var px = 0.0;
var py = 0.0;
var pz = 10.0;

// Float coordinates of the camera relative to the world coordinates.
var cx = px;
var cy = py;
var cz = pz;

// Velocity of the user.
var pvx = 0.02;
var pvy = 0.02;
var pvz = 0.0;

// These offsets are the offset of the world coordinates from the buffer slice coordinates.
var offsetZ = 0;
var offsetX = 30;
var offsetY = 20;

// This is the (block) coordinate of the player in world coordinates.
var playerpos = [HEIGHT -1 /* z */, 0 /* x */, 0 /* y */];
// This is the (block) coordinate of the camera in world coordinates.
var camerapos = [0,0,0]

// Available levels
var WETLANDS = 0;
var SPINNING_SECTORS = 1;
var RECTANGLES = 2;
var CUBE_FRAME = 3;

// Hardcoded level.
var LEVEL = WETLANDS;

// Enumeration of block types.
var EMPTY = 0;
var SOLID_BLOCK = 1;
var PLAYER = 2;
var STREET_LIGHT = 3;
var WAVE = 4;

var force_redraw = true;

// Modify buffer sizes and change rendering parameters according to the provided dimensions.
function handle2DBufferDimensionChange(w, h){
  if (VIEWPORT_WIDTH == w && VIEWPORT_HEIGHT == h) {
    return;
  }

  VIEWPORT_HEIGHT = h;
  VIEWPORT_WIDTH = w;

  // Put the middle of the render box in the middle of the display.
  RENDERING_BASEPOINT_X = ~~(VIEWPORT_WIDTH / 2 - render_x);
  RENDERING_BASEPOINT_Y = ~~(VIEWPORT_HEIGHT / 2 - render_y);

  sortedCoordinates = getSortedCoordinates(blocks);
  resizeBuffers();
};

// handle2DBufferDimensionChange(139, 49);

// Returns a list of 3D coordinates corresponding to the blocks that will be rendered completely
// into the 2D buffer, sorted so that blocks always appear earlier than any blocks that cover them.
function getSortedCoordinates(blocks){
  var coordinates = [];
  var X = blocks[0].length;
  var Y = blocks[0][0].length;
  var Z = blocks.length;

  for (var x = 0; x < X; x++) {
    for (var y = 0; y < Y; y++) {
      for (var z = 0; z < Z; z++) {
        var YY = RENDERING_BASEPOINT_Y -2*z      +  y;
        var XX = RENDERING_BASEPOINT_X      -3*x + 2*y;
        // YY >= 1 is because cropping may move
        // Similar for VIEWPORT_HEIGHT - 1
        if ( XX -1  >= 0 && XX + 4 < VIEWPORT_WIDTH && YY >= 1 && YY + 3 < VIEWPORT_HEIGHT - 2) {
          coordinates.push([z,x,y]);
        }
      }
    }
  }
  console.log("getSortedCoordinates");
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
  render_x_offset = horizontal_camera_correction;
  render_z_offset = vertical_camera_correction;
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

      if (blocks[z][x][y] == SOLID_BLOCK){
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
      } else if (blocks[z][x][y] == STREET_LIGHT){

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
      } else if (blocks[z][x][y] == WAVE){
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
        // Render the player
        lines[YY + 2 - vertical_player_correction][XX + 0 + 2 - horizontal_player_correction] = "<span style = \"color:white\">u</span>";
        // lines[YY + 2 - vertical_player_correction][XX + 1 + 2 - horizontal_player_correction] = "<span style = \"color:white\">o</span>";
        // lines[YY + 2 - vertical_player_correction][XX + 2 + 2 - horizontal_player_correction] = "<span style = \"color:white\">u</span>";

        //lines[YY + 2][XX + 0] = "<span style = \"color:#00FF00; background-color:black\">y</span>";
        //lines[YY + 2][XX + 1] = "<span style = \"color:#00FF00; background-color:black\">o</span>";
        //lines[YY + 2][XX + 2] = "<span style = \"color:#00FF00; background-color:black\">u</span>";


        // lines[YY + 2][XX + 0] = "<span style = \"color:#C3834C; background-color:black\">d</span>";
        // lines[YY + 2][XX + 1] = "<span style = \"color:#C3834C; background-color:black\">o</span>";
        // lines[YY + 2][XX + 2] = "<span style = \"color:#C3834C; background-color:black\">g</span>";

        /*
        for (var u = -2; u < 3; u++) {
          for (var v = -4; v < 5; v++) {
            var distance = Math.abs(horizontal_player_correction - v - (3 * (px - Math.floor(px)) - 2 * (py - Math.floor(py)))) / 1.5 +
                           Math.abs(vertical_player_correction - u - (2 * (pz - Math.floor(pz)) - (py - Math.floor(py))));
            var symbol = " ";
            if (distance <= 1.5) {
              symbol = "+";
            } else if (distance <= 3.5) {
              symbol = "-";
            }
            if (symbol != " ") {
              //lines[YY + 2 - vertical_player_correction + u][XX + 2 - horizontal_player_correction + v] = "<span style = \"color:#C3834C; background-color:black\">"+symbol+"</span>";
             lines[YY + 2 - vertical_player_correction + u][XX + 2 - horizontal_player_correction + v] = symbol;
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
  if (LEVEL == SPINNING_SECTORS) {
    skipInitial = 16;
    skipEnd = 14;
  }
  var leftcut = 0;
  var rightcut = 0;
  for (var i = skipInitial; i < lines.length-skipEnd; i++) {
    partialJoin.push ('<br>' + lines[i].slice(5 + leftcut, VIEWPORT_WIDTH - 4 - rightcut).join(""));
  }
  displayText.innerHTML += partialJoin.join("");
  displayText.innerHTML += "<br>" + (keyStates[1] ? "^" : "w") + "<br>" +
                                    (keyStates[0] ? "&lt;" : "a") +
                                    (keyStates[3] ? "v" : "s") +
                                    (keyStates[2] ? "&gt;" : "d") +
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
  console.log("Resizing buffers.");
  lines = generateLines(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
  renderBuffer = generateLines(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
  depthBuffer = generateDepthBuffer(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
}

function startAnimationLoop() {
  if (LOOP_ACTIVE === false){
    LOOP_ACTIVE = true;
    blocks = generateBlockArray(HEIGHT, WIDTH, DEPTH);
    auto_resize();
    update(blocks, sortedCoordinates);
  }
}

/*
Modify this function to change the level
*/
function getWorldTile(z,x,y) {
  //var t = 0;
  //height =/* - 0.2*(x-offsetX) - 0.2*(y-offsetY) */ + Math.sin(t * 0.005 + (x - offsetX) * 0.04) * 2 + Math.sin( (y - offsetY) * 0.04)*2;
  var output = EMPTY;
  if (LEVEL == WETLANDS) {
    var height = 0;

    if (z < 0) {
      output = EMPTY;
    }
    if (~~(z-height) == 0 ) {
      output = SOLID_BLOCK;
    } else {
      var waterLevel = 3;
      var terrainSurface = ( (  Math.sin(x*0.05 + y*0.1) +  Math.sin(x*0.05 + y * 0.08) + Math.sin(x*0.1) + Math.sin(y *0.1  ))) + waterLevel;
      if (z <= terrainSurface && terrainSurface > waterLevel) {
        output = SOLID_BLOCK;
      } else if (z == waterLevel) {
        // draw water
        if (x % 4 == 0 && y % 4 == 0) {
          output = WAVE;
        }
      } /*else if (z < terrainSurface + 2 * (terrainSurface - waterLevel)) {
        output = SOLID_BLOCK;
      }*/
    }

    if (z <= 4) {
      if ( (~~(x/5)) % 20 == 0 || (~~(y / 5)) % 20 == 0 ) {
        X = ~~(x/100);
        Y = ~~(y/100);
        if (Math.sin(X*X) + Math.cos(Y*Y) > 0) {
          output = SOLID_BLOCK;
        }

      }
    }

    if (x % WIDTH == 0 && y%DEPTH == 0 && Math.abs(z - height) < 10 ) {
      output = STREET_LIGHT;
    }

    if (z > 60 && Math.abs(Math.abs(x) % 20 - 10 ) + Math.abs(Math.abs(y) % 20 - 10) + Math.abs(z % 20 - 10) < (z-60)/20  ) {
      output = SOLID_BLOCK;
    }

    if (z > 90) {
      var a =  ((x-10) % 20) == 0;
      var b =  ((y-10) % 20) == 0;
      var c =  ((z-10) % 20) == 0;
      //if ((a&&(b || c)) || (b&&c)) {
      if (a + b + c > 1) {
        output = SOLID_BLOCK;
      }
    }
    return output;
  } else if (LEVEL == SPINNING_SECTORS) {
    if (x*x + y*y + z*z < 64 && x*x + y*y + z*z > 16) {
      date = new Date()
      t = date.getTime()

      /*if (Math.abs(z - 2 * Math.sin( (x - y) / 10 + t / 500)) < 0.5) {
        output = SOLID_BLOCK
      }*/

      /*if (Math.abs( (x + y) * Math.cos(t / 500) + (z) * Math.sin(t / 500)) < 1.2) {
        output = SOLID_BLOCK
      }*/

      height = 0;
      l = Math.sqrt(x*x + y*y);
      dot = x * Math.cos(t/500) + y * Math.sin(t / 500);
      if (dot / l > 0.9 || dot / l < -0.9) {
        height += 1;
      }

      /*if (dot / l > 0.7) {
        height += SOLID_BLOCK;
      }*/

      /*if (dot / l < -0.8) {
        height -= SOLID_BLOCK;
      }*/

      if (z <= height && z >= 0) {
        output = SOLID_BLOCK;
        if (dot / l < 0.4 && dot / l > -0.4) {
          output = EMPTY;
        }
      }
    }
    if (z==0 && y==0 && x==0) {
      output = PLAYER;
    }
  } else if (LEVEL == RECTANGLES) {
    if (z == 0) {
      return SOLID_BLOCK;
    } else if (z == 1) {
      var xxx = Math.abs(x);
      var yyy = Math.abs(y);
      if ((xxx >= yyy && xxx % 5 == 4) || (yyy >= xxx && yyy % 10 == 5) ) {
        return SOLID_BLOCK;
      } else {
        return EMPTY;
      }
    } else if (z==playerpos[0] && x==playerpos[1] && y==playerpos[2]) {
      return PLAYER;
    } else {
      return EMPTY;
    }
    if (Math.abs(z) == Math.abs(~~(x/2)) || Math.abs(z) == Math.abs(~~(y/2))) {
      return SOLID_BLOCK;
    } else {
      return EMPTY;
    }
  } else {
    console.assert(LEVEL == CUBE_FRAME);
    if (z == 0) {
      output = SOLID_BLOCK;
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
        output = SOLID_BLOCK;
      }
    }
  }
  if (z==playerpos[0]-offsetZ && x==playerpos[1]-offsetX && y==playerpos[2]-offsetY) {
      output = PLAYER;
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

function auto_resize() {
  var displayText = document.getElementById('active-text');
  w = Math.round(displayText.offsetWidth / 8) + 14;
  h = 50;
  var displayChanged = false;
  if (VIEWPORT_WIDTH !== w) {
    console.log("Display width was changed from " + VIEWPORT_WIDTH + " to " + w);
    displayChanged = true;
  }
  handle2DBufferDimensionChange(w, h);
  return displayChanged;
}

function physics_update() {
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
}

function toTileCoordinate(x, y, z) {
  return [Math.floor(z), Math.floor(x), Math.floor(y)];
}

// Calculate fine 2D vertical correction in render position from 3D float coordinates.
function verticalCorrection(x, y, z) {
  return Math.round(2 * (z - Math.floor(z)) - (y - Math.floor(y)));
}

// Calculate fine 2D horizontal correction in render position from 3D float coordinates.
function horizontalCorrection(x, y , z) {
  return Math.round(3 * (x - Math.floor(x)) - 2 * (y - Math.floor(y)));
}

function update_discrete_coordinates() {

  // Note that camera contraints need to align with fine rendering, which probably(?) means they need to be integers.
  if (cz - pz > 5.0) {
    cz = pz + 5.0;
  } else if (cz - pz < -5.0) {
    cz = pz - 5.0;
  }
  if (cx - px > 3.0) {
    cx = px + 3.0;
  } else if (cx - px < -3.0) {
    cx = px - 3.0;
  }
  if (cy - py > 3.0) {
    cy = py + 3.0;
  } else if (cy - py < -3.0) {
    cy = py - 3.0;
  }
  // cx = px;
  // cy = py;
  // cz = pz;

  playerpos = toTileCoordinate(px, py, pz);
  camerapos = toTileCoordinate(cx, cy, cz);

  vertical_player_correction = verticalCorrection(px, py, pz);
  horizontal_player_correction = horizontalCorrection(px, py, pz);

  vertical_camera_correction = verticalCorrection(cx, cy, cz);
  horizontal_camera_correction = horizontalCorrection(cx, cy, cz);
}

function update(blocks, sortedCoordinates) {
  var displayChanged = auto_resize();

  var oldpos = playerpos.slice(0);
  var oldoffset = [offsetZ, offsetX, offsetY];
  var old_horizontal_player_correction = horizontal_player_correction;
  var old_vertical_player_correction = vertical_player_correction;

  // Position and velocity update
  if (LEVEL != 1) {
    physics_update();
    update_discrete_coordinates();
  }


  if (LEVEL == SPINNING_SECTORS) {
    playerpos = [0,0,0];
    offsetZ = z_center;
    offsetX = x_center;
    offsetY = y_center;
  } else {
    offsetZ = 6 - camerapos[0];
    offsetY = 30 - camerapos[2];
    offsetX = 35 - camerapos[1];
  }

  // Detect if redraw is necessary. Checking for camera changes is unnecessary since all camera changes are induced by
  // player position changes.
  var positionChanged = oldpos[0] != playerpos[0] || oldpos[1] != playerpos[1] || oldpos[2] != playerpos[2];
  var offsetChanged = offsetZ != oldoffset[0] || offsetX != oldoffset[1] || offsetY != oldoffset[2];
  var horizontal_player_correction_changed = horizontal_player_correction != old_horizontal_player_correction;
  var vertical_player_correction_changed = vertical_player_correction != old_vertical_player_correction;
  var needRedraw = /*positionChanged ||*/ offsetChanged || vertical_player_correction_changed || horizontal_player_correction_changed || (LEVEL==SPINNING_SECTORS) || displayChanged || force_redraw;
  force_redraw = false;


  if (needRedraw) {
    setWaves(blocks, sortedCoordinates);

    if (1 || offsetChanged) {
      // try {
        //console.log(playerpos[0], playerpos[1], playerpos[2]);
        blocks[playerpos[0] + offsetZ][playerpos[1] + offsetX][playerpos[2]+offsetY] = 2;
        render(blocks, sortedCoordinates);
      // } catch (e){
      //   console.log(e.message);
      // } finally {
      // }
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
  startAnimationLoop();
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
    if (keyStates[0] != state) {
      keyStates[0] = state;
      force_redraw = true;
    }
  } else if (keyPressed == "W") { // up arrow
    if (keyStates[1] != state) {
      keyStates[1] = state;
      force_redraw = true;
    }
  } else if (keyPressed == "D") { // right arrow
    if (keyStates[2] != state) {
      keyStates[2] = state;
      force_redraw = true;
    }
  } else if (keyPressed == "S") { // down arrow
    if (keyStates[3] != state) {
      keyStates[3] = state;
      force_redraw = true;
    }
  } else if (keyPressed == "J") { //jump
    if (keyStates[4] != state) {
      keyStates[4] = state;
      force_redraw = true;
    }
  }
}