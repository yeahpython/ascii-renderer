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

      var PI = 3.1415926
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

        if (a2 == 0 && b2 == 0) {
          a2 = 1;
          b2 = 0;
          c2 = 0;
        }

        // This is our y axis
        var a4 = b * c2 - c * b2;
        var b4 = c * a2 - a * c2;
        var c4 = a * b2 - b * a2;


        /*context.fillStyle = "white";
        context.font = "bold 40px sans-serif";
        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillText("a: " + a + "b: " + b + "c: " + c, xCenter, 100);
        context.fillText("a2: " + a2 + "b2: " + b2 + "c2: " + c2, xCenter, 200);
        context.fillText("a4: " + a4 + "b4: " + b4 + "c4: " + c4, xCenter, 300);*/

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
      }
      var HEIGHT = 20;
      var WIDTH = 90;
      var DEPTH = 90;

      var VIEWPORT_HEIGHT = 1 + 2 * HEIGHT + DEPTH ;
      var VIEWPORT_WIDTH = 10 + 3*WIDTH + 2 * DEPTH ;
      VIEWPORT_HEIGHT = 40;
      VIEWPORT_WIDTH = 80;
      VIEWPORT_HEIGHT = 50;
      VIEWPORT_WIDTH = 80;
      
      // I want to automatically set these so that the middle of the render box is at the middle of the display.

      var z_center = HEIGHT / 2;
      var x_center = WIDTH / 2;
      var y_center = DEPTH / 2;
      var render_x = -3 * x_center + 2 * y_center;
      var render_y = -2 * z_center + y_center;

      var RENDERING_BASEPOINT_X = VIEWPORT_WIDTH / 2 - render_x;
      var RENDERING_BASEPOINT_Y = VIEWPORT_HEIGHT / 2 - render_y;
      RENDERING_BASEPOINT_X = ~~(RENDERING_BASEPOINT_X);
      RENDERING_BASEPOINT_Y = ~~(RENDERING_BASEPOINT_Y); 
      //RENDERING_BASEPOINT_X = 100;
      //RENDERING_BASEPOINT_Y = -1;
      
      function getSortedCoordinates(blocks){
        var coordinates =[]
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
              if ( XX -1  >= 0 && XX + 4 < VIEWPORT_WIDTH && YY >= 0 && YY + 3 < VIEWPORT_HEIGHT) {
                coordinates.push([z,x,y]);
              }        
            }
          }
        }
        //coordinates.sort(function(a,b){return a[0] + a[1] + a[2] - b[0] - b[1] - b[2]})
        return coordinates
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

      

      

      function render_alternative(blocks, sortedCoordinates, lines, renderBuffer, depthBuffer) {
        var X = RENDERING_BASEPOINT_X; // rightward shift of basepoint
        var Y = RENDERING_BASEPOINT_Y; // downward shift of basepoint
        clear(lines);
        /*setAll(depthBuffer, -1);*/
        for (var i = 0; i < sortedCoordinates.length; i++) {
          var c = sortedCoordinates[i];
          var z = c[0] - offsetZ;
          var x = c[1] - offsetX;
          var y = c[2] - offsetY;
          var depth = x + y + z;
          var tile = getWorldTile(z,x,y);
          if (tile) { 
            var hasXNeighbor        = (c[1] > 0   && getWorldTile(z,x-1,y) == 1);
            var hasYNeighbor        = (c[2] > 0   && getWorldTile(z,x,y-1) == 1);
            var hasZNeighbor        = (c[0] > 0   && getWorldTile(z-1,x,y) == 1);
            var hasXZNeighbor       = (c[1] > 0)  && (c[0] + 1 < HEIGHT) && (getWorldTile(z+1,x-1,y) == 1);
            var hasXYNeighbor       = (c[1] > 0)  && (c[2] + 1 < DEPTH) && (getWorldTile(z,x-1,y+1) == 1);
            var hasYXNeighbor       = (c[2] > 0)  && (c[1] + 1 < WIDTH) && (getWorldTile(z,x+1,y-1) == 1);
            var hasYZNeighbor       = (c[2] > 0)  && (c[0] + 1 < HEIGHT) && (getWorldTile(z+1,x,y-1) == 1);
            var hasZXNeighbor       = (c[0] > 0)  && (c[1] + 1 < WIDTH) && (getWorldTile(z-1,x+1,y) == 1);
            var hasZYNeighbor       = (c[0] > 0)  && (c[2] + 1 < DEPTH) && (getWorldTile(z-1,x,y+1) == 1);
            var hasYZXNeighbor      = (c[2] > 0)  && (c[1] > 0) && (c[0] + 1 < HEIGHT) && (getWorldTile(z+1,x-1,y-1) == 1);
            var hasYXBehindNeighbor = (c[2] > 0)  && (c[1] > 0) && (getWorldTile(z,x-1,y-1) == 1);
             
            //var hasXPlusYPlusNeighbor = (x+1 < WIDTH) && (y+1 < DEPTH) $$ ( blocks[z][x+1][y+1] == 1);

            var YY = Y -2*c[0]      +  c[2];
            var XX = X      -3*c[1] + 2*c[2];

            if (tile == 1){
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
            } else if (tile == 3){
              
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
              lines[YY + 1][XX + 3] = "*";
              lines[YY + 1][XX + 4] = ":";
              lines[YY + 2][XX + 2] = " ";
              lines[YY + 2][XX + 3] = "|";
              lines[YY + 2][XX + 4] = " ";
              lines[YY + 3][XX + 2] = " ";
              lines[YY + 3][XX + 3] = "|";
              lines[YY + 3][XX + 4] = " ";
            } else if (tile == 4){
                //lines[YY+2][XX+0] = "~";
                lines[YY+2][XX+1] = "~";
                //lines[YY+2][XX+2] = "~";
              }
            else {
              lines[YY + 2][XX + 0] = "y";
              lines[YY + 2][XX + 1] = "o";
              lines[YY + 2][XX + 2] = "u";
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

      function render(blocks, sortedCoordinates, lines, renderBuffer, depthBuffer) {
        var X = RENDERING_BASEPOINT_X; // rightward shift of basepoint
        var Y = RENDERING_BASEPOINT_Y; // downward shift of basepoint
        clear(lines);
        /*setAll(depthBuffer, -1);*/
        for (var i = 0; i < sortedCoordinates.length; i++) {
          var c = sortedCoordinates[i];
          var z = c[0];
          var x = c[1];
          var y = c[2];
          var depth = x + y + z;
          if (blocks[z][x][y] != 0) {
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
              lines[YY + 1][XX + 3] = "<span style = \"color:yellow\">*</span>";
              lines[YY + 1][XX + 4] = ":";
              lines[YY + 2][XX + 2] = " ";
              lines[YY + 2][XX + 3] = "|";
              lines[YY + 2][XX + 4] = " ";
              lines[YY + 3][XX + 2] = " ";
              lines[YY + 3][XX + 3] = "|";
              lines[YY + 3][XX + 4] = " ";
            } else if (blocks[z][x][y] == 4){
                //lines[YY+2][XX-1] = "~";
                lines[YY+2][XX+0] = "<span style = \"color:cyan\">s</span>";
                lines[YY+2][XX+1] = "<span style = \"color:cyan\">e</span>";
                lines[YY+2][XX+2] = "<span style = \"color:cyan\">a</span>";
                
                //lines[YY+2][XX+1] = "<span style = \"color:cyan\">~</span>";
                //lines[YY+2][XX+3] = "~";
              }
            else {
              lines[YY + 2][XX + 0] = "<span style = \"color:white\">y</span>";
              lines[YY + 2][XX + 1] = "<span style = \"color:white\">o</span>";
              lines[YY + 2][XX + 2] = "<span style = \"color:white\">u</span>";
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
      function setString(lines) {
      var displayText = document.getElementById('active-text');
        displayText.innerHTML ="<br>Controls: WASD to move, J to jetpack";

        var partialJoin = [];
        for (var i =0; i < lines.length; i++) {
          partialJoin.push ('<br>' + lines[i].join(""));          
        }
        displayText.innerHTML += partialJoin.join("");
        //displayText.innerHTML += "<br>" + (keyStates[0] ? "<" : "*") + (keyStates[1]? "^" : "*") + (keyStates[2]?">":"*")+(keyStates[3]?"v":"*") + "<br>" + (keyStates[4] ? "[JETPACK]":"[       ]") + "<br>WASD to move, J to jetpack";
        

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

      function manipulateText() {
        if (LOOP_ACTIVE == false){
          LOOP_ACTIVE = true;
          blocks = generateBlockArray(HEIGHT, WIDTH, DEPTH);
          lines = generateLines(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
          renderBuffer = generateLines(VIEWPORT_HEIGHT, VIEWPORT_WIDTH);
          depthbuffer = generateDepthBuffer(VIEWPORT_HEIGHT, VIEWPORT_WIDTH); 
          sortedCoordinates = getSortedCoordinates(blocks);
          setWaves(blocks, sortedCoordinates);
          update(blocks, sortedCoordinates, lines,renderBuffer, depthbuffer);
        }
      }
      var offsetX = 0;
      var offsetY = 0;
      var offsetZ = 0;
      var playerpos = [HEIGHT -1, 0, 0];

      var LEVEL = 0;
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
            var terrainSurface = ( 0.5 * (  Math.sin(x*0.05 + y*0.1) +  Math.sin(x*0.05 + y * 0.08) + Math.sin(x*0.1) + Math.sin(y *0.1  ))) + waterLevel;
            if (z <= terrainSurface && terrainSurface > waterLevel) {
              output = 1;
            } else if (z == waterLevel) {
              // draw water
              if (x % 4 == 0 && y % 4 == 0) {
                output = 4;
              }
            } else if (z < terrainSurface + 2 * (terrainSurface - waterLevel)) {
              output = 1;
            }
          }

          if (z == 4) {
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
        } else {
          if (z == 0) {
            output = 1;
          } else{ 
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
        }
        return output;
      }

      function getTile(z,x,y) {
      	return getWorldTile(z-offsetZ, x-offsetX, y-offsetY);
      }



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
          blocks[playerpos[0]][playerpos[1]][playerpos[2]] = 2;
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
      function update(blocks, sortedCoordinates, lines, renderBuffer, depthBuffer){
        var oldpos = playerpos.slice(0);
        var oldoffset = [offsetZ, offsetX, offsetY];
        if (keyStates[0]) {
          tryToMovePlayer(0,1,0);
        } if (keyStates[1]) {
          tryToMovePlayer(0,0,-1);
        } if (keyStates[2]) {
          tryToMovePlayer(0,-1,0);
        } if (keyStates[3]) {
          tryToMovePlayer(0,0,1);
        } if (keyStates[4]) {
          tryToMovePlayer(1,0,0);
        } else {
          tryToMovePlayer(-1,0,0);
        }


        var resetblocks = false;

        var x_space = WIDTH / 2 - 1;
        var y_space = DEPTH / 2 - 1;
        var z_space = HEIGHT / 2 - 1;

        if (playerpos[1] < x_space) {
          offsetX += 1;
          playerpos[1] += 1;
          resetblocks = true;
        } else if (playerpos[1] >=  WIDTH - x_space) {
          offsetX -= 1;
          playerpos[1] -=1;
          resetblocks = true;
        }
        
        if (playerpos[2] < y_space) {
          offsetY += 1;
          playerpos[2] += 1;
          resetblocks = true;
        } else if (playerpos[2] >= DEPTH - y_space) {
          offsetY -= 1;
          playerpos[2] -=1;
          resetblocks = true;
        }
        
        if (playerpos[0]  >= HEIGHT - z_space) {
          offsetZ -= 1;
          playerpos[0] -= 1;
          resetblocks = true;
        } else if (playerpos[0] < z_space) {
          offsetZ += 1;
          playerpos[0] +=1;
          resetblocks = true;
        }

        var positionChanged = oldpos[0] != playerpos[0] || oldpos[1] != playerpos[1] || oldpos[2] != playerpos[2];
        var offsetChanged = offsetZ != oldoffset[0] || offsetX != oldoffset[1] || offsetY != oldoffset[2];
        

        var needRedraw = positionChanged || offsetChanged;
        if (needRedraw) {
          if (resetblocks) {
            setWaves(blocks, sortedCoordinates);
          }

          if (1 || offsetChanged) {
            render(blocks, sortedCoordinates, lines, renderBuffer, depthBuffer);
            // renderBuffer should contain a map of the non-player environment here.
          } else {
            // old renderBuffer can still be used
            // clean up lines
          }
          // add player here
          setString(lines);
        }
        setTimeout(function(){
          update(blocks, sortedCoordinates, lines, renderBuffer, depthBuffer);
        }, 2);
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
