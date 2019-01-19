// The dimensions of the three-dimensional buffer used to store a slice
// of the world map.
var HEIGHT = 20;
var WIDTH = 90;
var DEPTH = 90;

// The three-dimensional center of the buffer area.
var z_center = HEIGHT / 2;
var x_center = WIDTH / 2;
var y_center = DEPTH / 2;

// Available levels
var INTRO = 0;
var CUBE_FRAME = 1;
var FIGURE_EIGHT = 2;
var MOVING_MAP = 3;
var TESTER = 4;
var WETLANDS = 5;
var RECTANGLES = 6;
var SPINNING_SECTORS = 7;


// Enumeration of block types.
var EMPTY = 0;
var SOLID_BLOCK = 1;
var PLAYER = 2;
var STREET_LIGHT = 3;
var WAVE = 4;
var INVISIBLE_BLOCK = 5;
var INVISIBLE_SCAFFOLDING = 6;

var MAX_FUEL = 10

///////////////////////////////////////////////////
//                                               //
// The things that follow aren't constants.      //
// They should be moved out of the global scope. //
//                                               //
///////////////////////////////////////////////////

// Debug message to show above the main scene.
var debug_message = "";

// 3D buffer storing block data
var blocks;

// The two-dimensional offset of the three-dimensional center from the
// two-dimensional rendered position of the [0,0,0].
var render_x = -3 * x_center + 2 * y_center;
var render_y = -2 * z_center + y_center;

// Uncropped dimensions of the two-dimensional buffer used to store renderings
// of the 3D scene. This may have roughness around the edges.
var VIEWPORT_HEIGHT, VIEWPORT_WIDTH;

// Reference coordinate from which to render all 3D objects.
var RENDERING_BASEPOINT_X, RENDERING_BASEPOINT_Y;

// Fine-grained offset of rendering from the rendering basepoint, used to enable
// sub-block-sized motion
var render_x_offset = 0;
var render_z_offset = 0;

// These offsets are the offset of the world coordinates from the buffer slice coordinates.
var offsetZ = 0;
var offsetX = 30;
var offsetY = 20;

function getFlagInfo(level, z, x, y){
  if (level.map_id === INTRO) {
    if (x < 40) {
      return {message: ["Welcome!", "WASD to move,", "J to jetpack."],
              finished: false};
    } else {
      return {message:["Congratulations,", "you made it!"], finished:true};
    }
  }

  if (level.map_id === CUBE_FRAME) {
    if (Math.abs(x) < 100 && Math.abs(y) < 100) {
      let seed = Math.abs((x + y)%3);
      if (seed == 0) {
        return {message: ["You'll have to look", "a little further", "than this!"],
              finished: false};
      }
      if (seed == 1) {
        return {message: ["I hear you need", "to go far out..."],
              finished: false};
      }
      if (seed == 2) {
        return {message: ["Not here!"],
              finished: false};
      }
    } else {
      return {message: ["You made it!"],
              finished: true};
    }
  }
  if (level.map_id === FIGURE_EIGHT) {
    let flag_number;
    if (y > 0) {
      flag_number = 2;
    }
    else if (x > 5) {
      flag_number = 1;
    } else {
      flag_number = 3;
    }
    let difference_code = (((flag_number - level.figureEightState) % 3) + 3) % 3;
    if (difference_code == 1) {
      level.figureEightState += 1;
    }
    // if (difference_code == 2) {
    //   level.figureEightState -= 1;
    // }
    if (level.figureEightState >= 10) {
      return {message:["You made it!", "(" + level.figureEightState + " / 10)"], finished:true};
    }

    if (difference_code != 2) {
      return {message:["Keep going!", "(" + level.figureEightState + " / 10)"], finished:false};
    }
    if (difference_code == 2) {
      return {message:["Wrong flag!", "(" + level.figureEightState + " / 10)"], finished:false};
    }

  }
  return {message:["Finish!"], finished:true}
};

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

  resizeBuffers();
};

function keyForCoord(z, x, y) {
	return z.toString() + " " + x.toString() + " " + y.toString();
}

function tileIsVisible(tile) {
  return tile != EMPTY && tile != INVISIBLE_BLOCK;
}

function coordinateComparison(a, b) {
  return a[1] - b[1] || a[2] - b[2] || a[0] - b[0];
}

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

// Fills in |lines| by iterating through |blocks| using |sortedCoordinates|
//  - lines: Buffer to which we will render the text
//  - level: Container for all the information associated with a given map.
function render(lines, level, found_end_callback) {
  var X = RENDERING_BASEPOINT_X + level.horizontal_camera_correction; // rightward shift of basepoint
  var Y = RENDERING_BASEPOINT_Y + level.vertical_camera_correction; // downward shift of basepoint
  clear(lines);

  // Extra coordinates to be injected into the loop. Should be sorted in the
  // same way as sortedCoordinates.
  var extra_coordinates = [level.playerpos.slice(0)];

  var block_index = 0;
  var extra_index = 0;

  var get_next = level.getFreshIterator();

  while (true) {
    var c = get_next();
    if (c === null) {
      return;
    }

    var z = c[0];
    var x = c[1];
    var y = c[2];
    var depth = x + y + z;
    var tile = level.getWorldTile(z, x, y);
    if (!tileIsVisible(tile) || tile == INVISIBLE_SCAFFOLDING) {
    	continue;
    }

    var hasXNeighbor = level.getWorldTile(z, x-1, y) == SOLID_BLOCK;
    var hasYNeighbor = level.getWorldTile(z, x, y-1) == SOLID_BLOCK;
    var hasZNeighbor = level.getWorldTile(z-1, x, y) == SOLID_BLOCK;
    var hasXZNeighbor = level.getWorldTile(z+1, x-1, y) == SOLID_BLOCK;
    var hasXYNeighbor = level.getWorldTile(z, x-1, y+1) == SOLID_BLOCK;
    var hasYXNeighbor = level.getWorldTile(z, x+1, y-1) == SOLID_BLOCK;
    var hasYZNeighbor = level.getWorldTile(z+1, x, y-1) == SOLID_BLOCK;
    var hasZXNeighbor = level.getWorldTile(z-1, x+1, y) == SOLID_BLOCK;
    var hasZYNeighbor = level.getWorldTile(z-1, x, y+1) == SOLID_BLOCK;

    var hasYZXNeighbor = level.getWorldTile(z+1, x-1, y-1) == SOLID_BLOCK;

    var hasYXBehindNeighbor = level.getWorldTile(z, x-1, y-1) == SOLID_BLOCK;


    // World coordinates -> "block" coordinates -> Screen coordinates
    var YY = Y -2*(z + offsetZ)                  +   (y + offsetY);
    var XX = X                  -3*(x + offsetX) + 2*(y + offsetY);

    if (YY < 0 || YY + 3 >= VIEWPORT_HEIGHT || XX <= 1 || XX + 4 > VIEWPORT_WIDTH) {
      continue;
    }
    if (tile == SOLID_BLOCK){

      //   -101234
      // 0   __
      // 1  |\__\
      // 2  | |  |
      // 3   \|__|

      lines[YY][XX] = (hasYNeighbor && !hasYZNeighbor) ? " " :"_";
      lines[YY][XX + 1] = (hasYNeighbor && !hasYZNeighbor) ? (hasYZXNeighbor ? lines[YY][XX + 1] : " ") :(hasYXBehindNeighbor? lines[YY][XX+1]:"_");

      if (hasXZNeighbor && !hasYXBehindNeighbor) {
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
      lines[YY + 1][XX + 3] = (!hasXZNeighbor) ? "_" : "\\";
      if (!hasXZNeighbor && !hasXNeighbor) {
        lines[YY + 1][XX + 4] = "\\"
      }
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
      lines[YY + 3][XX]     = (hasZNeighbor && !hasZXNeighbor) ? " " : "\\";
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
    } else if (tile == STREET_LIGHT){
      var distance = Math.max(Math.abs(level.playerpos[1] - x), Math.abs(level.playerpos[2] - y));


      var height = 0;
      for (var test_height_offset = 0; test_height_offset < 10; test_height_offset++) {
        if (level.getWorldTile(z - test_height_offset, x, y) == STREET_LIGHT) {
          height = test_height_offset;
        } else {
          break;
        }
      }


      var close = distance + height < 10;
      var bright = close;// && (Math.sin(new Date().getTime() * 3.14 / 300 - z / 2) > 0.0);

      lines[YY + 1][XX + 3] = bright ? "<span style = \"color:white\">!</span>" : "?";
      if (bright && level.getWorldTile(z + 1, x, y) != STREET_LIGHT && level.getWorldTile(z + 1, x, y) != PLAYER) {
        var flag_info = getFlagInfo(level, z, x, y);
        var msg = flag_info.message;
        for (var row = 0; row < msg.length; row++) {
          for (var col = 0; col < msg[row].length; col++) {
            try {
              lines[YY + 1 + row][XX + 5 + col] = msg[row][col];
            } catch (err) {
              // ignore
            }
          }
        }
        if (flag_info.finished) {
          found_end_callback();
        }
      }

      lines[YY + 2][XX + 3] = bright ? "<span style = \"color:white\">|</span>" : ".";
      lines[YY + 3][XX + 3] = bright ? "<span style = \"color:white\">|</span>" : ".";
    } else if (tile == WAVE){
        lines[YY+2][XX+0] = "~";
        lines[YY+2][XX+1] = "~";
        lines[YY+2][XX+2] = "~";
      }
    else {
      // Render the player
      lines[YY + 2 - level.vertical_player_correction][XX + 0 + 2 - level.horizontal_player_correction] = "<span style = \"color:white\">" + ( (level.pvx - 0.66 * level.pvy) > 0.15 ? "\\" : ((level.pvx - 0.66 * level.pvy) < -0.15 ? "/" : "|")) + "</span>";
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

var keyStates = {};

function setString(element, lines) {
  // element.innerHTML = debug_message;
  //element.innerHTML = "";

  var partialJoin = [];
  // partialJoin.push(debug_message);
  skipInitial = 4;
  skipEnd = 5;
  // if (LEVEL == SPINNING_SECTORS) {
  //   skipInitial = 16;
  //   skipEnd = 14;
  // }
  var leftcut = 0;
  var rightcut = 0;
  for (var i = skipInitial; i < lines.length-skipEnd; i++) {
    partialJoin.push (lines[i].slice(5 + leftcut, VIEWPORT_WIDTH - 4 - rightcut).join(""));
  }
  element.innerHTML = partialJoin.join("<br>");
  // element.innerHTML += "<br>" + (keyStates["W"] ? "^" : "w") + "<br>" +
  //                                   (keyStates["A"] ? "&lt;" : "a") +
  //                                   (keyStates["S"] ? "v" : "s") +
  //                                   (keyStates["D"] ? "&gt;" : "d") +
  //                                   "<br>" +
  //                                   (keyStates["J"] ? "[JETPACK]":"[       ]") +
  //                                   "<br>WASD to move, J to jetpack";
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

function getWetlandTile(z, x, y) {
  var output = EMPTY;
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
}

function getSpinningSectorsTile(z, x, y) {
  var output = EMPTY;
  if (z == 0) {
    return SOLID_BLOCK
  }
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
  return output;
}

function getFigureEightWorldTile(z, x, y) {
  var tile = getFigureEightWorldTileInternal(z, x, y);
  if (tile == INVISIBLE_BLOCK) {
    return EMPTY;
  }
  return tile;
}
function getFigureEightWorldTileInternal(z, x, y) {
  if (x < -20 || x > 20 || y < -20 || y > 20 || z < 0) {
    return INVISIBLE_BLOCK;
  }

  if (x <= 18 && y <= 18 && x >= 2 && y >= 2) {
    return INVISIBLE_BLOCK;
  }

  if (-x <= 18 && -y <= 18 && -x >= 2 && -y >= 2) {
    return INVISIBLE_BLOCK;
  }

  if (x >= 2 && y <= -2) {
    return INVISIBLE_BLOCK;
  }

  if (x <= -2 && y >= 2) {
    return INVISIBLE_BLOCK;
  }

  if (z == 0) {
    if (x > -2 && y > 18) {
      return SOLID_BLOCK;
    }

    if (x < 2 && y < -18) {
      return SOLID_BLOCK;
    }

    if (x > -2 && x < 2) {
      return SOLID_BLOCK;
    }
    return INVISIBLE_BLOCK;
  }

  if (z > 0 && z < 5) {
    if (x == 0 && y == 19) {
      return STREET_LIGHT;
    }

    if (x == 0 && y == -19) {
      return STREET_LIGHT;
    }

    if (x < -18 && y < -18) {
      return SOLID_BLOCK;
    }
    if (x > 18 && y > 18) {
      return SOLID_BLOCK;
    }
    if (x > -2 && y > 18) {
      return EMPTY;
    }

    if (x < 2 && y < -18) {
      return EMPTY;
    }

    if (x > -2 && x < 2) {
      return EMPTY;
    }
    return INVISIBLE_BLOCK;
  }

  if (z == 5) {
    if (y > -2 && x > 18) {
      return SOLID_BLOCK;
    }

    if (y < 2 && x < -18) {
      return SOLID_BLOCK;
    }

    if (y > -2 && y < 2) {
      return SOLID_BLOCK;
    }
    if (x > -2 && y > 18) {
      return EMPTY;
    }

    if (x < 2 && y < -18) {
      return EMPTY;
    }

    if (x > -2 && x < 2) {
      return EMPTY;
    }
    return INVISIBLE_BLOCK;
  }

  if (z < 10 && x == 19 && y == 0) {
    return STREET_LIGHT;
  }

  return EMPTY;
}

function getMovingMapTile(z, x, y) {
  date = new Date()
  t = date.getTime()
  if ((x % 10 == 0) && (y % 10 == 0) && x * x + y * y > 40000 && z < 10 && z > 0) {
    if (Math.sin(t / 2000 + x / 10 + y / 10) + Math.cos(t / 4000 + x / 10 - y / 7) <= 0.1) {
      return STREET_LIGHT;
    }
  }

  if (z != 0) {
    return EMPTY;
  }

  if (x * x + y * y < 25) {
    return SOLID_BLOCK;
  }

  // if ((x % 10 == 0) && (y % 10 == 0)) {
  //   return SOLID_BLOCK;
  // }

  if ((x % 10 == 0) || (y % 10 == 0)) {
    if (Math.sin(t / 2000 + x / 10 + y / 10) + Math.cos(t / 4000 + x / 10 - y / 7) > 0.1) {
      return INVISIBLE_SCAFFOLDING;
    }
    return SOLID_BLOCK;
  }
  return EMPTY;
}

function getRectanglesLevelTile(z, x, y) {
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
}

function getCubeFrameTile(z, x, y) {
  var output = EMPTY;
  if (z == 0) {
    output = SOLID_BLOCK;
  } else{
    d = 11
    D = 22

    // Extra ((... + D) % D) is to handle negative numbers
    x = ((((x + d) % D) + D) % D) - d
    y = ((((y + d) % D) + D) % D) - d
    a = Math.abs(x) == 4;
    b = Math.abs(z - 5) == 4;
    c = Math.abs(y) == 4;
    A = Math.abs(x) <= 4;
    B = Math.abs(z - 5) <= 4;
    C = Math.abs(y) <= 4;
    if (x == y && y == 0 && z > 0 && z < 10) {
      output = STREET_LIGHT;
    }
    if (a && b && C || a && B && c || A && b && c) {
      output = SOLID_BLOCK;
    }
  }
  return output;
}


function getIntroTile(z, x, y) {
  var val = getIntroTileInternal(z, x, y);
  if (val == INVISIBLE_BLOCK) {
    return EMPTY;
  }
  return val;
}
function getIntroTileInternal(z,x,y) {
  if (x <= 3) { // earliest section of map
    if (Math.abs(x) >= 4 || Math.abs(y) >= 4 || z < 0) {
      return INVISIBLE_BLOCK;
    }

    if (z >= 3 && z <= 9 && x == 0 && y == 0) {
      return STREET_LIGHT;
    }

    if (z <= 2) {
      return SOLID_BLOCK;
    }
    return EMPTY;
  } else if (x <= 20) { // first bridge
    if (Math.abs(y) > 1) {
      return INVISIBLE_BLOCK;
    }
    if (z == 2) {
      return SOLID_BLOCK;
    }
    if (z < 2) {
      return INVISIBLE_BLOCK;
    }
    return EMPTY;
  }
  if (x <= 21) { // vertical drop
    if (Math.abs(y) > 1) {
      return INVISIBLE_BLOCK;
    }
    if (z <= 2 && z >= -3) {
      return SOLID_BLOCK;
    }
    return EMPTY;
  }
  if (x <= 35) { // second bridge
    if (Math.abs(y) > 1) {
      return INVISIBLE_BLOCK;
    }
    if (z == -3) {
      return SOLID_BLOCK;
    }
    return EMPTY;
  }
  if (x <= 40) { // perpendicular
    if (y < -1) {
      return INVISIBLE_BLOCK;
    }
    if (y > 20) {
      return INVISIBLE_BLOCK;
    }
    if (z == -3) {
      return SOLID_BLOCK;
    }
    return EMPTY;
  }
  if (y < 28) {
    if (x < 80) {
      if (y <= 20) {
        if (y < 17) {
          return INVISIBLE_BLOCK;
        }
        if (z == -3) {
          return SOLID_BLOCK;
        }
        if (x > 75 && z >= -12 && z <= -3 && y == 20) {
          return SOLID_BLOCK;
        }
        if (z < -3) {
          return INVISIBLE_BLOCK;
        }
        return EMPTY;
      }

      if (x <= 75) {
        return INVISIBLE_BLOCK;
      }
      if (x > 75 && z == -12) {
        return SOLID_BLOCK;
      }
      return EMPTY;
    }
    return INVISIBLE_BLOCK;
  }
  if (y < 34) {
    if (x == 78 && y == 31 && z>= -11 && z <= -5) {
      return STREET_LIGHT;
    }
    if (x > 81) {
      return INVISIBLE_BLOCK;
    }
    if (x < 75) {
      return INVISIBLE_BLOCK;
    }
    if (z >= -15 && z <= -12) {
      return SOLID_BLOCK;
    }
    return EMPTY;
  }
  return INVISIBLE_BLOCK;
}

function getTesterTile(z, x, y) {
  d = new Date();
  if (x * x + y * y + z * z + 20 * Math.sin(0.004 * d.getTime()) < 25) {
    return SOLID_BLOCK;
  }

  if (Math.abs(x) < 20 && Math.abs(y) < 20 && (Math.abs(x) > 14 || Math.abs(y) > 14 || x == 0)) {
    if (z == 2) {
      return SOLID_BLOCK;
    } else {
      return EMPTY;
    }
  }
  return INVISIBLE_BLOCK;
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

function tileIsSolid(tile) {
	return tile == SOLID_BLOCK || tile == INVISIBLE_BLOCK;
}

function autoResize() {
  var displayText = document.getElementById('active-text');
  w = Math.round(displayText.offsetWidth / 8) + 14;
  h = Math.round(displayText.offsetHeight / 16) + 14;
  var displayChanged = false;
  if (VIEWPORT_WIDTH !== w || VIEWPORT_HEIGHT !== h) {
    console.log("Display width was changed from " + VIEWPORT_WIDTH + " to " + w);
    displayChanged = true;
  }
  handle2DBufferDimensionChange(w, h);
  return displayChanged;
}

// Note that this involves a reordering.
function toTileCoordinate(x, y, z) {
  return [Math.floor(z), Math.floor(x), Math.floor(y)];
}

// Calculate fine 2D vertical correction in render position from 3D float coordinates.
// Note that we consider the various coordinates independently, since combining them
// results in jitter.
function verticalCorrection(x, y, z) {
  return Math.floor(2 * (z - Math.floor(z))) - Math.floor((y - Math.floor(y)));
}

// Calculate fine 2D horizontal correction in render position from 3D float coordinates.
// Note that we consider the various coordinates independently, since combining them
// results in jitter.
function horizontalCorrection(x, y , z) {
  return Math.floor(3 * (x - Math.floor(x))) - Math.floor(2 * (y - Math.floor(y)));
}

function getMapFetcher(map_id) {
  switch (map_id) {
    case WETLANDS:
      return getWetlandTile;
    case SPINNING_SECTORS:
      return getSpinningSectorsTile;
    case RECTANGLES:
      return getRectanglesLevelTile;
    case FIGURE_EIGHT:
      return getFigureEightWorldTile;
    case MOVING_MAP:
      return getMovingMapTile;
    case CUBE_FRAME:
      return getCubeFrameTile;
    case INTRO:
      return getIntroTile;
    case TESTER:
      return getTesterTile;
    default:
      console.assert(false);
  }
}

function createIteratorGenerator(sorted_coordinates, level) {
  return function() {
    // Extra coordinates to be injected into the loop. Should be sorted in the
    // same way as sorted_coordinates.
    var extra_coordinates = [level.playerpos.slice(0)];

    var block_index = 0;
    var extra_index = 0;

    return function() {
      console.assert(block_index <= sorted_coordinates.length);
      console.assert(extra_index <= extra_coordinates.length);
      if (block_index == sorted_coordinates.length && extra_index == extra_coordinates.length) {
        return null;
      }

      // This logic basically mixes the two arrays together.
      if (block_index >= sorted_coordinates.length) {
        return extra_coordinates[extra_index++].slice(0);
      } else if (extra_index >= extra_coordinates.length) {
        return sorted_coordinates[block_index++].slice(0);
      }

      if (coordinateComparison(extra_coordinates[extra_index], sorted_coordinates[block_index]) < 0) {
        return extra_coordinates[extra_index++].slice(0);
      } else {
        return sorted_coordinates[block_index++].slice(0);
      }

    }
  }
}

class Level {
  constructor(map_id, level_failed_cb) {
    this.map_id = map_id;
    this.level_failed_cb = level_failed_cb;

    // Fine-grained offset of player from their cube coordinate, used to enable sub-
    // block-sized motion.
    this.horizontal_player_correction = 0; // should be 0, 1  or 2
    this.vertical_player_correction = 0;

    // Fine-grained offset of camera from their cube coordinate, used to enable sub-
    // block-sized motion.
    this.horizontal_camera_correction = 0; // should be 0, 1  or 2
    this.vertical_camera_correction = 0;

    this.currently_leaving_level = false;
    this.currently_dying = false;

    // Float coordinates of the user relative to the world coordinates.
    if (this.map_id === INTRO || this.map_id === FIGURE_EIGHT || this.map_id === MOVING_MAP) {
      this.px = 0.0;
    } else {
      this.px = 15.0;
    }
    this.py = 0.0;
    this.pz = 10.0;

    // Float coordinates of the camera relative to the world coordinates.
    this.cx = this.px;
    this.cy = this.py;
    this.cz = this.pz;

    // Velocity of the user.
    this.pvx = 0.02;
    this.pvy = 0.02;
    this.pvz = 0.0;

    this.jetpack_fuel = 0;

    // This is the (block) coordinate of the player in world coordinates.
    this.playerpos = [HEIGHT -1 /* z */, 0 /* x */, 0 /* y */];
    // This is the (block) coordinate of the camera in world coordinates.
    this.camerapos = [0,0,0]

    this.getMapTile = getMapFetcher(this.map_id);

    this.timestep = 0;

    // Only used by FIGURE_EIGHT level.
    this.figureEightState = 0;
    if (this.map_id === INTRO) {
      let sorted_coordinates = this.getSortedCoordinatesFromConnectedComponent(3, 0, 0);
      this.getFreshIterator = createIteratorGenerator(sorted_coordinates, this);
    } else if (this.map_id === FIGURE_EIGHT) {
      let sorted_coordinates = this.getSortedCoordinatesFromConnectedComponent(0, 0, 0);
      this.getFreshIterator = createIteratorGenerator(sorted_coordinates, this);
    } else if (this.map_id === MOVING_MAP) {
      this.getFreshIterator = function() {
        let sorted_coordinates = this.getSortedCoordinatesFromConnectedComponent(0, 10 * Math.round(this.playerpos[1] / 10), 10 * Math.round(this.playerpos[2] / 10) );
        return createIteratorGenerator(sorted_coordinates, this)();
      }
    } else {
      this.getFreshIterator = function() {
        for (var i = this.playerpos[0]; i > this.playerpos[0] - 50; i--) {
          if (tileIsSolid(this.getMapTile(i, this.playerpos[1], this.playerpos[2]))) {
            break;
          }
        }
        let sorted_coordinates = this.getSortedCoordinatesFromConnectedComponent(i, this.playerpos[1], this.playerpos[2]);

        return createIteratorGenerator(sorted_coordinates, this)();
      }
    }
  }

  physicsUpdate() {
    // Gravity
    this.pvz += -0.1;

    // User input
    var a = 0.02;
    if (keyStates["A"] === true) {
      this.pvx += a;
    }
    if (keyStates["D"] === true) {
      this.pvx -= a;
    }
    if (keyStates["W"] === true) {
      this.pvy -= a;
    }
    if (keyStates["S"] === true) {
      this.pvy += a;
    }
    if (keyStates["J"] === true) {
      if (this.jetpack_fuel) {
        this.pvz += 0.2;
        this.jetpack_fuel -= 1;
      }
    } else {
      this.jetpack_fuel = 0;
    }

    // Velocity decay
    if (!keyStates["A"] && !keyStates["D"] && !keyStates["W"] && !keyStates["S"] && !keyStates["J"]) {
      this.pvx *= 0.9;
      this.pvy *= 0.9;
      this.pvz *= 0.9;
    }

    // Velocity cap
    var max_speed = 4.5;

    if (this.pvz >= max_speed) {
      this.pvz = max_speed;
    }
    if (this.pvz <= -max_speed) {
      this.pvz = -max_speed;
    }

    if (this.pvx >= max_speed) {
      this.pvx = max_speed;
    }
    if (this.pvx <= -max_speed) {
      this.pvx = -max_speed;
    }

    if (this.pvy >= max_speed) {
      this.pvy = max_speed;
    }
    if (this.pvy <= -max_speed) {
      this.pvy = -max_speed;
    }



    // Split large motion into many small motions.
    var mini_vx = this.pvx / 10;
    var mini_vy = this.pvy / 10;
    var mini_vz = this.pvz / 10;
    var n_steps = this.currently_dying ? 1 : 10;
    for (var _ = 0; _ < n_steps; ++_) {
      this.px += mini_vx;
      this.py += mini_vy;
      this.pz += mini_vz;
      this.projectOut(blocks);
    }
  }

  projectOut(blocks) {
    var width = 0.3;

    var any_vertical_push = false;

    for (var projection_iteration = 0; projection_iteration < 6; projection_iteration++) {
      var pushed = false;

      var mz = Math.floor(this.pz - width);
      var Mz = Math.floor(this.pz + width);
      var mx = Math.floor(this.px - width);
      var Mx = Math.floor(this.px + width);
      var my = Math.floor(this.py - width);
      var My = Math.floor(this.py + width);

      var l = []
      for (var iz = mz; iz <= Mz; iz+=1) {
      for (var ix = mx; ix <= Mx; ix+=1) {
      for (var iy = my; iy <= My; iy+=1) {
        l.push({distance: Math.abs(iz + 0.5 - this.pz) + Math.abs(ix + 0.5 - this.px) + Math.abs(iy + 0.5 - this.py), value:[iz,ix,iy]});
      }}}

      l.sort(function(a, b){return a.distance - b.distance});
      l = l.map(function(a){return a.value});

      for (var i = 0; i < l.length && !pushed; i+=1) {
        var z = l[i][0];
        var x = l[i][1];
        var y = l[i][2];
        let a = this.getWorldTile(z, x, y);
        if (a == SOLID_BLOCK || a == INVISIBLE_BLOCK) {
          // A block can push out of any exposed surface. Out of these directions, we pick the smallest displacement.
          var z_plus_move  = tileIsSolid(this.getWorldTile(z+1, x,   y  )) ?  10 : z + 1 + width - this.pz;
          var z_minus_move = tileIsSolid(this.getWorldTile(z-1, x,   y  )) ? -10 : z     - width - this.pz;
          var x_plus_move  = tileIsSolid(this.getWorldTile(z,   x+1, y  )) ?  10 : x + 1 + width - this.px;
          var x_minus_move = tileIsSolid(this.getWorldTile(z,   x-1, y  )) ? -10 : x     - width - this.px;
          var y_plus_move  = tileIsSolid(this.getWorldTile(z,   x,   y+1)) ?  10 : y + 1 + width - this.py;
          var y_minus_move = tileIsSolid(this.getWorldTile(z,   x,   y-1)) ? -10 : y     - width - this.py;
          var z_off = z_plus_move < -z_minus_move ? z_plus_move : z_minus_move;
          var x_off = x_plus_move < -x_minus_move ? x_plus_move : x_minus_move;
          var y_off = y_plus_move < -y_minus_move ? y_plus_move : y_minus_move;
          if (Math.abs(z_off) > 9 && Math.abs(x_off) > 9 && Math.abs(y_off) > 9) {
            continue;
          }
          if (Math.abs(z_off) < Math.abs(x_off) && Math.abs(z_off) < Math.abs(y_off)) {
            this.pz += z_off;
            this.pvz = 0.0;
            if (z_off != 0.0) {
              pushed = true;
              any_vertical_push = true;
            }
          } else if (Math.abs(x_off) < Math.abs(y_off)) {
            this.px += x_off;
            this.pvx = 0.0;
            if (x_off != 0.0) {
              pushed = true;
            }
          } else {
            this.py += y_off;
            this.pvy = 0.0;
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


    if (any_vertical_push) {
      this.jetpack_fuel = MAX_FUEL;
    }
  }

  /*
  Modify this function to change the level
  */
  getWorldTile(z, x, y) {
    if (z === this.playerpos[0] && x === this.playerpos[1] && y === this.playerpos[2]) {
      return PLAYER;
    }
    return this.getMapTile(z, x, y);
  }

  getTile(z,x,y) {
    return this.getWorldTile(z-offsetZ, x-offsetX, y-offsetY);
  }

  // Convert float coordinates in to integer values, and update the camera.
  updateDiscreteCoordinates() {

    // Note that camera contraints need to align with fine rendering, which probably(?) means they need to be integers.
    if (this.cz - this.pz > 3.0) {
      this.cz = this.pz + 3.0;
    } else if (this.cz - this.pz < -5.0) {
      this.cz = this.pz - 5.0;
    }
    if (this.cx - this.px > 3.0) {
      this.cx = this.px + 3.0;
    } else if (this.cx - this.px < -3.0) {
      this.cx = this.px - 3.0;
    }
    if (this.cy - this.py > 3.0) {
      this.cy = this.py + 3.0;
    } else if (this.cy - this.py < -3.0) {
      this.cy = this.py - 3.0;
    }

    this.playerpos = toTileCoordinate(this.px, this.py, this.pz);
    this.camerapos = toTileCoordinate(this.cx, this.cy, this.cz);

    this.vertical_player_correction = verticalCorrection(this.px, this.py, this.pz);
    this.horizontal_player_correction = horizontalCorrection(this.px, this.py, this.pz);

    this.vertical_camera_correction = verticalCorrection(this.cx, this.cy, this.cz);
    this.horizontal_camera_correction = horizontalCorrection(this.cx, this.cy, this.cz);
  }

  getSortedCoordinatesFromConnectedComponent(z, x, y) {
    var found_coordinate = {};
    var to_search = [];
    to_search.push([z, x, y]);
    found_coordinate[keyForCoord(z,x,y)] = true;
    var selected_coordinates = [];

    var dz;
    var dx;
    var dy;
    var nz;
    var nx;
    var ny;
    for (var queue_index = 0; queue_index < to_search.length; queue_index++) {
      if (selected_coordinates.length > 1500) {
        break;
      }
      var coord = to_search[queue_index];

      var is_exposed = false;

      var n_added = 0;

      for (dz = -1; dz <= 1; dz++) {
      for (dx = -1; dx <= 1; dx++) {
      for (dy = -1; dy <= 1; dy++) {
        // neighboring coordinate
        nz = coord[0] + dz;
        nx = coord[1] + dx;
        ny = coord[2] + dy;
        var tile = this.getWorldTile(nz, nx, ny);
        if (tileIsVisible(tile)) {
          let coord_string = keyForCoord(nz, nx, ny);
          if (found_coordinate[coord_string] !== true) {
            to_search.push([nz, nx, ny]);
            n_added++;
          }
        } else {
          is_exposed = is_exposed || (Math.abs(dz) + Math.abs(dx) + Math.abs(dy) == 1);
        }
      }
      }
      }

      if (is_exposed) {
        selected_coordinates.push(coord);
        // Mark the last few candidates as found.
        for (var i = to_search.length - n_added; i < to_search.length; i++) {
          found_coordinate[keyForCoord(to_search[i][0], to_search[i][1], to_search[i][2])] = true;
        }
      } else {
        // Remove the last few candidates
        to_search.splice(to_search.length - n_added, n_added);
      }
    }
    return selected_coordinates.sort(coordinateComparison);
  }

  update() {
    var oldpos = this.playerpos.slice(0);
    var oldoffset = [offsetZ, offsetX, offsetY];
    var old_horizontal_player_correction = this.horizontal_player_correction;
    var old_vertical_player_correction = this.vertical_player_correction;

    // Position and velocity update
    if (this.map_id != SPINNING_SECTORS && !(this.currently_leaving_level && !this.currently_dying)) {
      this.physicsUpdate();
      this.updateDiscreteCoordinates();
    }


    if (this.map_id == SPINNING_SECTORS) {
      this.playerpos = [0,0,0];
      offsetZ = z_center;
      offsetX = x_center;
      offsetY = y_center;
    } else {
      offsetZ = 6 - this.camerapos[0];
      offsetY = 30 - this.camerapos[2];
      offsetX = 35 - this.camerapos[1];
    }

    if (this.playerpos[0] < -20) {
      this.level_failed_cb();
    }

    // Detect if redraw is necessary. Checking for camera changes is unnecessary since all camera changes are induced by
    // player position changes.
    var positionChanged = oldpos[0] != this.playerpos[0] || oldpos[1] != this.playerpos[1] || oldpos[2] != this.playerpos[2];
    var offsetChanged = offsetZ != oldoffset[0] || offsetX != oldoffset[1] || offsetY != oldoffset[2];
    var horizontal_player_correction_changed = this.horizontal_player_correction != old_horizontal_player_correction;
    var vertical_player_correction_changed = this.vertical_player_correction != old_vertical_player_correction;
    var demanded_refresh = (this.timestep % 10 == 0);
    this.timestep += 1;
    return demanded_refresh || positionChanged || offsetChanged || vertical_player_correction_changed || horizontal_player_correction_changed || (this.map_id==SPINNING_SECTORS);
  }
}

// Singleton class for managing the entire flow.
class Game {
  constructor(blocks) {
    this.blocks = blocks;
    this.level = null;
    this.force_redraw = true;
    this.frame_id = 0;
  }

  goToNextLevel() {
    this.loadLevel((this.level.map_id + 1) % 4); // Only first four levels are good
  }

  goToNextLevelSoon() {
    if (this.level.currently_leaving_level === false) {
      this.level.currently_leaving_level = true;
      document.getElementById('active-text').classList.add("levelDone");
      var that = this;
      setTimeout(function(){
        that.goToNextLevel();
        document.getElementById('active-text').classList.remove("levelDone");
      }, 3000);
    }
  }

  retryLevel() {
    this.loadLevel(this.level.map_id); // Only first three levels are good
  }

  retryLevelSoon() {
    if (this.level.currently_leaving_level === false) {
      this.level.currently_leaving_level = true;
      this.level.currently_dying = true;
      document.getElementById('active-text').classList.add("levelFailed");
      var that = this;
      setTimeout(function(){
        that.retryLevel();
        document.getElementById('active-text').classList.remove("levelFailed");
      }, 1200);
    }
  }

  updateLoop() {
    var displayChanged = autoResize();

    var level_changed = this.level.update();

    var needRedraw = level_changed || displayChanged || this.force_redraw/* || !(this.frame_id++ % 2)*/;

    this.force_redraw = false;

    var that = this;
    if (needRedraw) {
      render(lines, this.level, function () {that.goToNextLevelSoon()});
      setString(document.getElementById('active-text'), lines);
    }
    var that = this;
    window.requestAnimationFrame(function() {
      that.updateLoop();
    });
  }

  loadLevel(id) {
    var that = this;
    this.level = new Level(id, function() {that.retryLevelSoon()});
  }
}

function initialize() {
  blocks = generateBlockArray(HEIGHT, WIDTH, DEPTH);
  autoResize();

  var game = new Game(blocks);
  game.loadLevel(INTRO);

  document.addEventListener("keydown", function(event) {
    keyStates[String.fromCharCode(event.keyCode)] = true;
  }, false);

  document.addEventListener("keyup", function(event) {
    keyStates[String.fromCharCode(event.keyCode)] = false;

    if (String.fromCharCode(event.keyCode) == "N") {
      game.goToNextLevel();
    }
  }, false);

  game.updateLoop();

}