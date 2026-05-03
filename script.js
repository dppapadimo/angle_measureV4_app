const canvas = new fabric.Canvas('canvas', {
  selection: false
});

let zoom = 1;
let angles = [];
let currentPoints = [];

let gridLines = [];
let gridVisible = false;
let snapEnabled = false;

// ---------------- IMAGE ----------------
document.getElementById('upload').addEventListener('change', function (e) {

  const reader = new FileReader();

  reader.onload = function (f) {

    fabric.Image.fromURL(f.target.result, function (img) {

      canvas.clear();
      angles = [];
      currentPoints = [];
      zoom = 1;

      const scale = window.innerWidth / img.width;

      canvas.setWidth(img.width * scale);
      canvas.setHeight(img.height * scale);

      img.set({
        scaleX: scale,
        scaleY: scale,
        originX: 'left',
        originY: 'top'
      });

      canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
    });
  };

  reader.readAsDataURL(e.target.files[0]);
});

// ---------------- CLICK ----------------
canvas.on('mouse:down', function (opt) {

  const p = canvas.getPointer(opt.e);

  const circle = new fabric.Circle({
    left: p.x,
    top: p.y,
    radius: 5,
    fill: 'red',
    originX: 'center',
    originY: 'center',
    selectable: true
  });

  circle.on('moving', () => {
    if (snapEnabled) snapPoint(circle);
    updateAllAngles();
  });

  canvas.add(circle);
  currentPoints.push(circle);

  if (currentPoints.length === 3) {
    createAngle(currentPoints);
    currentPoints = [];
  }
});

// ---------------- CREATE ----------------
function createAngle(points) {
  const label = String.fromCharCode(65 + angles.length);
  const obj = { label, points };
  angles.push(obj);
  drawAngle(obj);
}

// ---------------- DRAW ----------------
function drawAngle(a) {

  const line1 = new fabric.Line([0,0,0,0], { stroke:'green' });
  const line2 = new fabric.Line([0,0,0,0], { stroke:'green' });

  const text = new fabric.Text('', {
    fontSize: 16,
    fill: 'blue',
    selectable: false
  });

  a.line1 = line1;
  a.line2 = line2;
  a.text = text;

  canvas.add(line1, line2, text);

  updateAngleObject(a);
}

// ---------------- UPDATE ----------------
function updateAllAngles(){
  angles.forEach(updateAngleObject);
  canvas.renderAll();
}

function updateAngleObject(a){

  const [A,B,C] = a.points;

  const angle = calculateAngle(A,B,C);

  a.line1.set({
    x1:B.left, y1:B.top,
    x2:A.left, y2:A.top
  });

  a.line2.set({
    x1:B.left, y1:B.top,
    x2:C.left, y2:C.top
  });

  a.text.set({
    left:B.left+10,
    top:B.top-20,
    text:`${a.label}: ${angle.toFixed(1)}°`
  });
}

// ---------------- MATH ----------------
function calculateAngle(A,B,C){

  const BA = {x:A.left-B.left, y:A.top-B.top};
  const BC = {x:C.left-B.left, y:C.top-B.top};

  const dot = BA.x*BC.x + BA.y*BC.y;
  const magBA = Math.hypot(BA.x, BA.y);
  const magBC = Math.hypot(BC.x, BC.y);

  let cos = dot/(magBA*magBC);
  cos = Math.max(-1,Math.min(1,cos));

  return Math.acos(cos)*(180/Math.PI);
}

// ---------------- SNAP ----------------
function snapPoint(p){

  const threshold = 10;

  const dx = p.left % 50;
  const dy = p.top % 50;

  if (dx < threshold) p.left -= dx;
  if (dy < threshold) p.top -= dy;
}

// ---------------- ZOOM ----------------
function zoomIn(){
  zoom += 0.1;
  canvas.setZoom(zoom);
}

function zoomOut(){
  zoom -= 0.1;
  if (zoom < 0.5) zoom = 0.5;
  canvas.setZoom(zoom);
}

// ---------------- UNDO ----------------
function undo(){

  if(currentPoints.length){
    canvas.remove(currentPoints.pop());
    return;
  }

  if(angles.length){
    const a = angles.pop();
    a.points.forEach(p=>canvas.remove(p));
    canvas.remove(a.line1,a.line2,a.text);
  }
}

// ---------------- GRID ----------------
function toggleGrid(){

  if(gridVisible){
    gridLines.forEach(l=>canvas.remove(l));
    gridLines=[];
    gridVisible=false;
    return;
  }

  for(let i=0;i<canvas.width;i+=50){
    const l=new fabric.Line([i,0,i,canvas.height],{stroke:'#ddd'});
    canvas.add(l);
    gridLines.push(l);
  }

  for(let j=0;j<canvas.height;j+=50){
    const l=new fabric.Line([0,j,canvas.width,j],{stroke:'#ddd'});
    canvas.add(l);
    gridLines.push(l);
  }

  gridVisible=true;
}

// ---------------- SNAP TOGGLE ----------------
function toggleSnap(){
  snapEnabled = !snapEnabled;
}

// ---------------- SAVE ----------------
function saveImage(){
  const url = canvas.toDataURL({format:'png'});
  const link = document.createElement('a');
  link.href = url;
  link.download = 'angles.png';
  link.click();
}

// ---------------- RESET ----------------
function resetAll(){
  canvas.clear();
  angles=[];
  currentPoints=[];
}
