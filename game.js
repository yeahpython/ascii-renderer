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
var WETLANDS = 0;
var SPINNING_SECTORS = 1;
var RECTANGLES = 2;
var CUBE_FRAME = 3;
var INTRO = 4

// Hardcoded level.
var LEVEL = INTRO;

// Enumeration of block types.
var EMPTY = 0;
var SOLID_BLOCK = 1;
var PLAYER = 2;
var STREET_LIGHT = 3;
var WAVE = 4;
var INVISIBLE_BLOCK = 5;

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

var force_redraw = true;

var LOOP_ACTIVE = false;

var sortedCoordinates;

level_messages = {};
level_messages[INTRO] = function(z, x, y){
  if (x < 40) {
    return ["Welcome!", "WASD to move,", "J to jetpack."];
  } else {
    return ["Congratulations,", "you made it!"];
  }
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

  if (LEVEL != INTRO) {
  	console.log("You're going to have a bad time...");
  }
  sortedCoordinates = getSortedCoordinatesFromConnectedComponent(2, 0, 0);
  resizeBuffers();
};

function keyForCoord(z, x, y) {
	return z.toString() + " " + x.toString() + " " + y.toString();
}

function tileIsVisible(tile) {
  return tile != EMPTY && tile != INVISIBLE_BLOCK;
}

function coordinateComparison(a, b) {
	var x_diff = a[1] - b[1];
	if (x_diff) {
		return x_diff;
	}
	var y_diff = a[2] - b[2];
	if (y_diff) {
		return y_diff;
	}
	return a[0] - b[0];
}

function getSortedCoordinatesFromConnectedComponent(z, x, y) {
  var found_coordinate = {};
  var coordinates = [];
  coordinates.push([z, x, y]);
  found_coordinate[keyForCoord(z,x,y)] = true;
  for (var queue_index = 0; queue_index < coordinates.length; queue_index++) {
  	if (queue_index > 10000) {
  	  console.log("Infinite loop? Breaking");
  	  break;
  	}
  	var coord = coordinates[queue_index];
  	for (var dz = -1; dz <= 1; dz++) {
  	for (var dx = -1; dx <= 1; dx++) {
  	for (var dy = -1; dy <= 1; dy++) {
  	  // neighboring coordinate
  	  var nz = coord[0] + dz;
  	  var nx = coord[1] + dx;
  	  var ny = coord[2] + dy;
  	  var tile = getWorldTile(nz, nx, ny);
  	  if (tileIsVisible(tile)) {
  	  	var coord_string = keyForCoord(nz, nx, ny);
  	  	if (found_coordinate[coord_string] !== true) {
  	  		coordinates.push([nz, nx, ny]);
  	  		found_coordinate[coord_string] = true;
  	  	}
  	  }
  	}
  	}
  	}
  }
  console.log("Sorted coordinates have length " + coordinates.length);
  return coordinates.sort(coordinateComparison);
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

// Fills in |lines| by iterating through |blocks| using |sortedCoordinates|
//  - sortedCoordinates: Sorted list of coordinates to render.
//  - lines: Buffer to which we will render the text
//  - horizontal_camera_correction: horizontal offset caused by camera position
//  - vertical_camera_correction: vertical offset caused by camera position
//  - player position: position of player in world coordinates.
//  - horizontal_player_correction: horiztonal correction of player based on float position
//  - vertical_player_correction: vertical correction of player based on float position.
function render(sortedCoordinates, lines, horizontal_camera_correction, vertical_camera_correction, player_position, horizontal_player_correction, vertical_player_correction) {
  var X = RENDERING_BASEPOINT_X + horizontal_camera_correction; // rightward shift of basepoint
  var Y = RENDERING_BASEPOINT_Y + vertical_camera_correction; // downward shift of basepoint
  clear(lines);

  // Extra coordinates to be injected into the loop. Should be sorted in the
  // same way as sortedCoordinates.
  var extra_coordinates = [player_position];

  var block_index = 0;
  var extra_index = 0;
  while (block_index < sortedCoordinates.length || extra_index < extra_coordinates.length) {

  	// This logic basically mixes the two arrays together.
  	if (block_index >= sortedCoordinates.length) {
  		var c = extra_coordinates[extra_index];
  		extra_index++;
  	} else if (extra_index >= extra_coordinates.length) {
  		var c = sortedCoordinates[block_index];
  		block_index++;
  	} else {
  		if (coordinateComparison(extra_coordinates[extra_index], sortedCoordinates[block_index]) < 0) {
  			var c = extra_coordinates[extra_index];
  			extra_index++;
  		} else {
  			var c = sortedCoordinates[block_index];
  			block_index++;
  		}
  	}

    var z = c[0];
    var x = c[1];
    var y = c[2];
    var depth = x + y + z;

    if (!tileIsVisible(getWorldTile(z, x, y))) {
    	continue;
    }

    var hasXNeighbor = getWorldTile(z, x-1, y) == SOLID_BLOCK;
    var hasYNeighbor = getWorldTile(z, x, y-1) == SOLID_BLOCK;
    var hasZNeighbor = getWorldTile(z-1, x, y) == SOLID_BLOCK;
    var hasXZNeighbor = getWorldTile(z+1, x-1, y) == SOLID_BLOCK;
    var hasXYNeighbor = getWorldTile(z, x-1, y+1) == SOLID_BLOCK;
    var hasYXNeighbor = getWorldTile(z, x+1, y-1) == SOLID_BLOCK;
    var hasYZNeighbor = getWorldTile(z+1, x, y-1) == SOLID_BLOCK;
    var hasZXNeighbor = getWorldTile(z-1, x+1, y) == SOLID_BLOCK;
    var hasZYNeighbor = getWorldTile(z-1, x, y+1) == SOLID_BLOCK;

    var hasYZXNeighbor = getWorldTile(z+1, x-1, y-1) == SOLID_BLOCK;

    var hasYXBehindNeighbor = getWorldTile(z, x-1, y-1) == SOLID_BLOCK;

    // World coordinates -> "block" coordinates -> Screen coordinates
    var YY = Y -2*(z + offsetZ)                  +   (y + offsetY);
    var XX = X                  -3*(x + offsetX) + 2*(y + offsetY);

    if (YY < 0 || YY + 3 >= VIEWPORT_HEIGHT || XX <= 1 || XX + 4 > VIEWPORT_WIDTH) {
      continue;
    }
    var tile = getWorldTile(z, x, y);
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
      var distance = Math.max(Math.abs(playerpos[1] - x), Math.abs(playerpos[2] - y));


      var height = 0;
      for (var test_height_offset = 0; test_height_offset < 10; test_height_offset++) {
        if (getWorldTile(z - test_height_offset, x, y) == STREET_LIGHT) {
          height = test_height_offset;
        } else {
          break;
        }
      }


      var close = distance + height < 10;
      // if (close) {
      //   force_redraw = true;
      // }
      var bright = close;// && (Math.sin(new Date().getTime() * 3.14 / 300 - z / 2) > 0.0);

      lines[YY + 1][XX + 3] = bright ? "<span style = \"color:white\">!</span>" : "?";
      if (bright && getWorldTile(z + 1, x, y) != STREET_LIGHT && getWorldTile(z + 1, x, y) != PLAYER) {
        var msg = level_messages[LEVEL](z, x, y );
        for (var row = 0; row < msg.length; row++) {
          for (var col = 0; col < msg[row].length; col++) {
            try {
              lines[YY + 1 + row][XX + 5 + col] = msg[row][col];
            } catch (err) {
              // ignore
            }
          }
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
      lines[YY + 2 - vertical_player_correction][XX + 0 + 2 - horizontal_player_correction] = "<span style = \"color:white\">" + ( (pvx - 0.66 * pvy) > 0.15 ? "\\" : ((pvx - 0.66 * pvy) < -0.15 ? "/" : "|")) + "</span>";
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
  if (LEVEL == SPINNING_SECTORS) {
    skipInitial = 16;
    skipEnd = 14;
  }
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

function startAnimationLoop() {
  if (LOOP_ACTIVE === false){
    LOOP_ACTIVE = true;
    blocks = generateBlockArray(HEIGHT, WIDTH, DEPTH);
    auto_resize();
    update(blocks, sortedCoordinates);
  }
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
  return output;
}


function getIntroTile(z, x, y) {
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

/*
Modify this function to change the level
*/
function getWorldTile(z,x,y) {
  if (z === playerpos[0] && x === playerpos[1] && y === playerpos[2]) {
  	return PLAYER;
  }
  var output = EMPTY;
  if (LEVEL == WETLANDS) {
    return getWetlandTile(z, x, y);
  } else if (LEVEL == SPINNING_SECTORS) {
    return getSpinningSectorsTile(z, x, y);
  } else if (LEVEL == RECTANGLES) {
    return getRectanglesLevelTile(z, x, y);
  } else if (LEVEL == CUBE_FRAME) {
    return getCubeFrameTile(z, x, y);
  } else if (LEVEL == INTRO) {
    return getIntroTile(z, x, y);
  } else {
    assert(false);
  }
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

function tileIsSolid(tile) {
	return tile == SOLID_BLOCK || tile == INVISIBLE_BLOCK;
}

function projectOut(blocks) {
  var width = 0.3;


  for (var projection_iteration = 0; projection_iteration < 6; projection_iteration++) {
    var pushed = false;

    var mz = Math.floor(pz - width);
    var Mz = Math.floor(pz + width);
    var mx = Math.floor(px - width);
    var Mx = Math.floor(px + width);
    var my = Math.floor(py - width);
    var My = Math.floor(py + width);

    l = []
    for (var iz = mz; iz <= Mz; iz+=1) {
    for (var ix = mx; ix <= Mx; ix+=1) {
    for (var iy = my; iy <= My; iy+=1) {
      l.push({distance: Math.abs(iz + 0.5 - pz) + Math.abs(ix + 0.5 - px) + Math.abs(iy + 0.5 - py), value:[iz,ix,iy]});
    }}}

    l.sort(function(a, b){return a.distance - b.distance});
    l = l.map(function(a){return a.value});

    for (var i = 0; i < l.length && !pushed; i+=1) {
      var z = l[i][0];
      var x = l[i][1];
      var y = l[i][2];
      a = getWorldTile(z, x, y);
      if (a == SOLID_BLOCK || a == INVISIBLE_BLOCK) {
        // A block can push out of any exposed surface. Out of these directions, we pick the smallest displacement.
        var z_plus_move  = tileIsSolid(getWorldTile(z+1, x,   y  )) ?  10 : z + 1 + width - pz;
        var z_minus_move = tileIsSolid(getWorldTile(z-1, x,   y  )) ? -10 : z     - width - pz;
        var x_plus_move  = tileIsSolid(getWorldTile(z,   x+1, y  )) ?  10 : x + 1 + width - px;
        var x_minus_move = tileIsSolid(getWorldTile(z,   x-1, y  )) ? -10 : x     - width - px;
        var y_plus_move  = tileIsSolid(getWorldTile(z,   x,   y+1)) ?  10 : y + 1 + width - py;
        var y_minus_move = tileIsSolid(getWorldTile(z,   x,   y-1)) ? -10 : y     - width - py;
        var z_off = z_plus_move < -z_minus_move ? z_plus_move : z_minus_move;
        var x_off = x_plus_move < -x_minus_move ? x_plus_move : x_minus_move;
        var y_off = y_plus_move < -y_minus_move ? y_plus_move : y_minus_move;
        if (Math.abs(z_off) > 9 && Math.abs(x_off) > 9 && Math.abs(y_off) > 9) {
        	continue;
        }
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
}

function auto_resize() {
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

function physics_update() {
  // Gravity
  pvz += -0.1;

  // User input
  var a = 0.1;
  if (keyStates["A"] === true) {
    pvx += a;
  }
  if (keyStates["D"] === true) {
    pvx -= a;
  }
  if (keyStates["W"] === true) {
    pvy -= a;
  }
  if (keyStates["S"] === true) {
    pvy += a;
  }
  if (keyStates["J"] === true) {
    pvz += 2 * a;
  }

  // Velocity decay
  if (!keyStates["A"] && !keyStates["D"] && !keyStates["W"] && !keyStates["S"] && !keyStates["J"]) {
    pvx *= 0.9;
    pvy *= 0.9;
    pvz *= 0.9;
  }

  // Velocity cap
  var max_speed = 4.5;

  if (pvz >= max_speed) {
    pvz = max_speed;
  }
  if (pvz <= -max_speed) {
    pvz = -max_speed;
  }

  if (pvx >= max_speed) {
    pvx = max_speed;
  }
  if (pvx <= -max_speed) {
    pvx = -max_speed;
  }

  if (pvy >= max_speed) {
    pvy = max_speed;
  }
  if (pvy <= -max_speed) {
    pvy = -max_speed;
  }



  // Split large motion into many small motions.
  mini_vx = pvx / 10;
  mini_vy = pvy / 10;
  mini_vz = pvz / 10;
  for (var _ = 0; _ < 10; ++_) {
    px += mini_vx;
    py += mini_vy;
    pz += mini_vz;
    projectOut(blocks);
  }
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

// Convert float coordinates in to integer values, and update the camera.
function update_discrete_coordinates() {

  // Note that camera contraints need to align with fine rendering, which probably(?) means they need to be integers.
  if (cz - pz > 3.0) {
    cz = pz + 3.0;
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
  if (LEVEL != SPINNING_SECTORS) {
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
  var needRedraw = positionChanged || offsetChanged || vertical_player_correction_changed || horizontal_player_correction_changed || (LEVEL==SPINNING_SECTORS) || displayChanged || force_redraw;

  force_redraw = false;


  if (needRedraw) {
    render(sortedCoordinates, lines, horizontal_camera_correction, vertical_camera_correction, playerpos.slice(0), horizontal_player_correction, vertical_player_correction);
    setString(document.getElementById('active-text'), lines);
  }
  window.requestAnimationFrame(function(){
    update(blocks, sortedCoordinates);
  });
}

function initialize() {
  document.addEventListener("keydown", function(event) {
    keyStates[String.fromCharCode(event.keyCode)] = true;
  }, false);

  document.addEventListener("keyup", function(event) {
    keyStates[String.fromCharCode(event.keyCode)] = false;
  }, false);

  startAnimationLoop();
}