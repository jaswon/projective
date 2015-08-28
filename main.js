var dist = 8
var scale = 1800
var xAngle = 0, yAngle = 0

function getCtx(id) {
    var cvs = document.getElementById(id)
    var ctx = cvs.getContext('2d')
    cvs.width = window.innerWidth
    cvs.height = window.innerHeight
    return ctx
}

function rotate(p,a,b) {
    return [
        Math.cos(b) * p[0] + Math.sin(b) * p[2],
        Math.cos(a) * p[1] + Math.sin(a) * Math.sin(b) * p[0] - Math.sin(a) * Math.cos(b) * p[2],
        Math.sin(a) * p[1] - Math.sin(b) * Math.cos(a) * p[0] + Math.cos(a) * Math.cos(b) * p[2]
    ]
}

function display(p) {
    return rotate(p,Math.atan(Math.sqrt(2)),Math.PI/4)
}

function project(xyz) {
    return [
        window.innerWidth / 2 + xyz[0] * scale / ( dist + xyz[2]),
        window.innerHeight / 2 + xyz[1] * scale / ( dist + xyz[2])
    ]
}

function pathFrom2dPoints(points) {
    var path = ""
    points.forEach(function(point) {
        path += "L " + point[0] + " " + point[1] + " "
    })
    return "M" + path.substring(1) + "Z"
}

// var y = Math.PI *2
var y = 0
var x = 0
var ctx

function pathFrom3dPoints(points) {
    return pathFrom2dPoints((function() {
        return points.map(function(point) {
            return project(point)
        })
    })())
}

function unit_cube() {
    var cube = []
    for (var i = 0 ; i < 3 ; i++ ) {
        for (var j = -1 ; j < 2 ; j+=2 ) {
            var face = {
                coord: [],
                color: [1,1,1],
                z: 0
            }
            var z = 0
            for (var k = -1 ; k < 2 ; k+=2 ) {
                for (var l = -1 ; l < 2 ; l+=2 ) {
                    var tmp = [k,l*k]
                    tmp.splice(i,0,j)
                    z += tmp[2]
                    face.coord.push(tmp)
                    // cube.push(tmp)
                }
            }
            face.z = z/4
            cube.push(face)
        }
    }
    return cube
}

function box(x,y,z,w,h,l) {
    var c = [x,y,z]
    var d = [w,h,l]
    var box = []
    for (var i = 0 ; i < 3 ; i++ ) {
        for (var j = -1 ; j < 2 ; j+=2 ) {
            var face = {
                coord: [],
                color: [1,1,1],
                center: c.slice()
            }
            for (var k = -1 ; k < 2 ; k+=2 ) {
                for (var l = -1 ; l < 2 ; l+=2 ) {
                    var tmp = [c[(i<1)?1:0] + k * .5 * d[(i<1)?1:0],c[(i<2)?2:1] + k * l * .5 * d[(i<2)?2:1]]
                    tmp.splice(i,0,c[i]+ j * .5 * d[i])
                    face.coord.push(tmp)
                    // box.push(tmp)
                }
            }
            box.push(face)
        }
    }
    return box
}

function randBox(max) {
    return box(
        Math.random()*(2-max)-1+max/2,
        Math.random()*(2-max)-1+max/2,
        Math.random()*(2-max)-1+max/2,
        Math.random()*(max-.1)+.1,
        Math.random()*(max-.1)+.1,
        Math.random()*(max-.1)+.1
    )
}

// var faces = unit_cube()
var animation
var timerLength = 40
var timer = 0
var faces = []
var shown = []

function cubicEaseInOut(t, b, c, d) {
	t /= d/2;
	if (t < 1) return c/2*t*t*t + b;
	t -= 2;
	return c/2*(t*t*t + 2) + b;
};

function sumSquare(a,b) {
    return a*a+b*b
}

function invSlope(a,b) {
    return (a[1] - b[1] != 0)?(a[0]-b[0])/(a[1]-b[1]):0
}

function calcC(face) {
    return [
        face.reduce(function(p,c) {
            return p + c[0]
        },0)/4,
        face.reduce(function(p,c) {
            return p + c[1]
        },0)/4,
        face.reduce(function(p,c) {
            return p + c[2]
        },0)/4
    ]
}

// http://people.cs.kuleuven.be/~ares.lagae/publications/LD05ERQIT/LD05ERQIT.pdf
// http://www.cs.virginia.edu/~gfx/Courses/2003/ImageSynthesis/papers/Acceleration/Fast%20MinimumStorage%20RayTriangle%20Intersection.pdf
// http://www.scratchapixel.com/lessons/3d-basic-rendering/ray-tracing-rendering-a-triangle/moller-trumbore-ray-triangle-intersection
function raySquare (mx,my,p00,p01,p10) {
    var o = [0,0,-dist]
    var d = [mx,my,dist]
    // draw ray
    // for (var i = 0 ; i < 5 ; i++ ) {
    //     var point = add(o,scalar(d,i))
    //     faces.push(box(point[0],point[1],point[2],.04,.04,.04))
    // }
    var e10 = subtract(p10,p00)
    var e01 = subtract(p01,p00)
    var p = cross(d,e01)
    var det = dot(p,e10)
    if (Math.abs(det) < .001) return false
    var T = subtract(o,p00)
    var a = dot(T,p)/det
    if (a < 0 || a > 1) return false
    var q = cross(T,e10)
    var b = dot(d,q)/det
    if (b < 0 || b > 1) return false
    var t = dot(q,e01)/det
    if (t < 0) return false
    return add(p00,add(scalar(subtract(p10,p00),a),scalar(subtract(p01,p00),b)))
}

document.addEventListener('mousedown', function(e) {
    var ex = dist*(e.pageX-window.innerWidth/2)/scale
    var ey = dist*(e.pageY-window.innerHeight/2)/scale
    var intersects = []
    var select = null
    for (var i = 0 ; i < shown.length ; i++ ) {
        var intersect = raySquare(ex,ey,shown[i][1],shown[i][0],shown[i][2])
        if (intersect && (select == null || intersect[2] < select.c[2])) {
            select = {
                c: intersect,
                i: i
            }
        }
    }
    if (select) {
        var ci = select.i
        var bi = Math.floor(select.i/6)
        var opi = ci + 1 + ci % 2 * -2
        faces[ci].color = [2,0,0]
        faces[opi].color = [2,0,0]
    }
})

document.addEventListener('keydown', function(e) {
    switch(e.which) {

        case 65: // left
            yAngle += Math.PI / 2;
            break;

        case 87: // up
            xAngle -= Math.PI / 2;
            break;

        case 68: // right
            yAngle -= Math.PI / 2;
            break;

        case 83: // down
            xAngle += Math.PI / 2;
            break;
    };

    timer = 0
    window.clearInterval(animation)
    var dx = xAngle - x
    var dy = yAngle - y
    animation = window.setInterval(function() {
        if (timer < timerLength) {
            timer++
            x = cubicEaseInOut(timer,xAngle-dx,dx,timerLength)
            y = cubicEaseInOut(timer,yAngle-dy,dy,timerLength)
        } else {
            window.clearInterval(animation)
        }
    }, 5)
}, false);

var zbuffer, cbuffer

function animate () {
    requestAnimationFrame(animate)
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
    shown = faces.map(function(face) {
        return face.coord.map(function(vertex) {
            return rotate(vertex,x,y)
        })
    })
    var center = []
    for (var i = 0 ; i < shown.length ; i++) {
        var face = faces[i]
        var coords = shown[i]
        if (i % 6 == 0) { // calc center for next box
            var vertices = shown[i].concat(shown[i+1])
            center = [
                vertices.reduce(function(p,c) {
                    return p + c[0]
                },0)/8,
                vertices.reduce(function(p,c) {
                    return p + c[1]
                },0)/8,
                vertices.reduce(function(p,c) {
                    return p + c[2]
                },0)/8
            ]
        }
        var normal = subtract(calcC(coords),center)
        var view = subtract(coords[0],[0,0,-dist])
        if (dot(normal,view) < 0) { // backface culling
            ctx.fillStyle = "rgb(" + face.color[0]*128 + "," + face.color[1]*128 + "," + face.color[2]*128 + ")"
            ctx.fill(new Path2D(pathFrom3dPoints(coords)))
        }
    }
}

window.onload = function() {
    window.alert("wasd to rotate\nclick to color a face")
    ctx = getCtx("draw")
    for (var i = 0 ; i < 5 ; i++ ) {
        faces = faces.concat(randBox(.7))
    }
    animate()
}
