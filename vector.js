function cross(u,v) {
    return [
        u[1]*v[2] - u[2]*v[1],
        u[2]*v[0] - u[0]*v[2],
        u[0]*v[1] - u[1]*v[0]
    ]
}

function dot(u,v) {
    return u[0]*v[0] + u[1]*v[1] + u[2]*v[2]
}

function subtract(u,v) {
    return [
        u[0]-v[0],
        u[1]-v[1],
        u[2]-v[2]
    ]
}

function add(u,v) {
    return [
        u[0]+v[0],
        u[1]+v[1],
        u[2]+v[2]
    ]
}

function scalar(u,s) {
    return [
        u[0]*s,
        u[1]*s,
        u[2]*s
    ]
}
