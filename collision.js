const CANVAS_CONFIG = {
    width: 1000,
    height: 1000,
    rectWidth: 300,
    rectHeight: 200,
    ballRadius: 10,
  };

  const rectWidth = CANVAS_CONFIG.rectWidth;
  const rectHeight = CANVAS_CONFIG.rectHeight;
  const BALL_RADIUS = CANVAS_CONFIG.ballRadius;

  const rectCanvas = document.getElementById('rectangleCanvas');
  const rectCtx = rectCanvas.getContext('2d');
  const bottomLeftX = (rectCanvas.width - rectWidth) / 2;
  const bottomLeftY = (rectCanvas.height + rectHeight -200) / 2;
  const bottomRightX = bottomLeftX + rectWidth;
  const bottomRightY = bottomLeftY;

  let currentAngle = 0;
 // const allowedAngles = [0, 30, 60, 90, 120, 150, 210, 240, 270, 300, 330];
  let balls = [];
  let ballCount = 0;
  let spawnCalled = false;

  const massInput = document.getElementById('massInput');
  const speedInput = document.getElementById('speedInput');
  const angleInput = document.getElementById('angleInput');
  const colorInput = document.getElementById('colorInput');
  const rectAngleInput = document.getElementById('rectAngleInput');

  const createBallButton = document.getElementById('createBallButton');
  const spawnBallsButton = document.getElementById('spawnBallsButton');
  const removeBallsButton = document.getElementById('removeBallsButton');
  const setRectAngleButton = document.getElementById('setRectAngleButton');
  const ballListUl = document.getElementById('ballListUl');

  let isDragging = false;
  let draggedBall = null;
  let MouseOffsetX = 0, MouseOffsetY = 0;

  setRectAngleButton.addEventListener('click', () => {
    let newAngle = parseFloat(rectAngleInput.value);
    if (isNaN(newAngle)) newAngle = 0;
    
    currentAngle = newAngle % 360;
  });

  function drawRectangle(angleDeg) {
rectCtx.clearRect(0, 0, rectCanvas.width, rectCanvas.height);

const angleRad = (angleDeg * Math.PI) / 180;
let topLeftX, topLeftY, topRightX, topRightY;

if (angleDeg <= 180) {
  topLeftX = bottomLeftX + Math.cos(angleRad) * rectHeight;
  topLeftY = bottomLeftY - Math.sin(angleRad) * rectHeight;

  topRightX = bottomRightX + Math.cos(angleRad) * rectHeight;
  topRightY = bottomRightY - Math.sin(angleRad) * rectHeight;
} 
else {
  // angleDeg > 180
  const adj = angleDeg - 180;
  const adjRad = (adj * Math.PI) / 180;

  topLeftX = bottomLeftX - Math.cos(adjRad) * rectHeight;
  topLeftY = bottomLeftY + Math.sin(adjRad) * rectHeight;

  topRightX = bottomRightX - Math.cos(adjRad) * rectHeight;
  topRightY = bottomRightY + Math.sin(adjRad) * rectHeight;
}

rectCtx.beginPath();
rectCtx.moveTo(bottomLeftX, bottomLeftY);
rectCtx.lineTo(bottomRightX, bottomRightY);
rectCtx.lineTo(topRightX, topRightY);
rectCtx.lineTo(topLeftX, topLeftY);
rectCtx.closePath();

rectCtx.fillStyle = '#ffcc00';
rectCtx.fill();
rectCtx.lineWidth = 2;
rectCtx.strokeStyle = '#cc9900';
rectCtx.stroke();

drawGrid();
}

function drawGrid() {
const centerX = rectCanvas.width / 2;
const centerY = rectCanvas.height / 2;


rectCtx.beginPath();
rectCtx.setLineDash([2, 2]); // dashed line

rectCtx.moveTo(centerX, centerY - rectHeight/2);
rectCtx.lineTo(centerX, centerY + rectHeight/2);
rectCtx.moveTo(centerX - rectWidth/2, centerY);
rectCtx.lineTo(centerX + rectWidth/2, centerY);

rectCtx.strokeStyle = 'rgba(0,0,0,0.1)';
rectCtx.stroke();
rectCtx.setLineDash([]); 
}
  

function toGlobal(LocalX, LocalY, angleDeg) {
if (angleDeg <= 180) {
  const rad = (angleDeg * Math.PI) / 180;
  const OffsetX = Math.cos(rad) * rectHeight;
  const OffsetY = -Math.sin(rad) * rectHeight;

  const GlobalX = bottomLeftX + LocalX + (OffsetX * (LocalY / rectHeight));
  const GlobalY = bottomLeftY + (OffsetY * (LocalY / rectHeight));
  return { x: GlobalX, y: GlobalY };
} else {
  // angleDeg > 180
  const adj = angleDeg - 180;
  const adjRad = (adj * Math.PI) / 180;
  const OffsetX = -Math.cos(adjRad) * rectHeight;
  const OffsetY = Math.sin(adjRad) * rectHeight;

  const GlobalX = bottomLeftX + LocalX + (OffsetX * (LocalY / rectHeight));
  const GlobalY = bottomLeftY + (OffsetY * (LocalY / rectHeight));
  return { x: GlobalX, y: GlobalY };
}
}

  function toLocal(GlobalX, GlobalY, angleDeg) {
    if (angleDeg <= 180) {
      const rad = (angleDeg * Math.PI) / 180;
      const OffsetX = Math.cos(rad) * rectHeight;
      const OffsetY = -Math.sin(rad) * rectHeight;

      const RGlobalX = GlobalX - bottomLeftX;
      const RGlobalY = GlobalY - bottomLeftY;

      const LocalY = (RGlobalY / OffsetY) * rectHeight;
      const LocalX = RGlobalX - OffsetX * (LocalY / rectHeight);
      return { x: LocalX, y: LocalY };
    } else {
      const adj = angleDeg - 180;
      const adjRad = (adj * Math.PI) / 180;
      const OffsetX = -Math.cos(adjRad) * rectHeight;
      const OffsetY = Math.sin(adjRad) * rectHeight;

      const RGlobalX = GlobalX - bottomLeftX;
      const RGlobalY = GlobalY - bottomLeftY;

      const LocalY = (RGlobalY / OffsetY) * rectHeight;
      const LocalX = RGlobalX - OffsetX * (LocalY / rectHeight);
      return { x: LocalX, y: LocalY };
    }
  }

  function isInsideRectangle(GlobalX, GlobalY, radius) {
    const localPos = toLocal(GlobalX, GlobalY, currentAngle);
    const LocalX = localPos.x, LocalY = localPos.y;
    if (
      LocalX >= radius && LocalX <= (rectWidth - radius) &&
      LocalY >= radius && LocalY <= (rectHeight - radius)
    ) {
      return true;
    }
    return false;
  }

  createBallButton.addEventListener('click', () => {
    if (spawnCalled) return;

    const massValue = parseFloat(massInput.value);
    const speedValue = parseFloat(speedInput.value);
    const angleValue = parseFloat(angleInput.value);
    const colorValue = colorInput.value;

    if (isNaN(massValue) || massValue <= 0) return alert(t('alerts.enterMass'));
    if (isNaN(speedValue) || speedValue < 0) return alert(t('alerts.enterSpeed'));
    if (isNaN(angleValue)) return alert(t('alerts.enterDirection'));

    ballCount++;

    const baseX = 100 + (balls.length * 40);
    const baseY = rectCanvas.height - 800;

    const rad = (angleValue * Math.PI) / 180;
    const vx = speedValue * Math.cos(rad);
    const vy = speedValue * Math.sin(rad);

    const newBall = {
      id: ballCount,
      x: baseX,
      y: baseY,
      radius: BALL_RADIUS,
      mass: massValue,
      velocityX: vx,
      velocityY: vy,
      insideRect: false,
      canMove: false,
      color: colorValue
    };
    balls.push(newBall);

    const li = document.createElement('li');
    li.textContent = `Ball #${newBall.id} | m=${massValue}, speed=${speedValue}, dir=${angleValue}, color=${colorValue}`;
    ballListUl.appendChild(li);
  });

  spawnBallsButton.addEventListener('click', () => {
    balls.forEach(b => {
      if (b.insideRect) {
        b.canMove = true;
      }
    });
    spawnCalled = true;
    createBallButton.disabled = true;
    startPathRecording();
  });

  removeBallsButton.addEventListener('click', () => {
    balls = [];
    ballCount = 0;
    spawnCalled = false;
    createBallButton.disabled = false;
    ballListUl.innerHTML = "";

    stopPathRecording();
    clearTrajectoryCanvas();
    paths = {};
  });

  rectCanvas.addEventListener('mousedown', (e) => {
if (spawnCalled) return;
const rectPos = rectCanvas.getBoundingClientRect();
const mouseX = e.clientX - rectPos.left;
const mouseY = e.clientY - rectPos.top;

for (let b of balls) {
  const dist = Math.hypot(b.x - mouseX, b.y - mouseY);
  if (dist <= b.radius) {
    isDragging = true;
    draggedBall = b;
    MouseOffsetX = mouseX - b.x;
    MouseOffsetY = mouseY - b.y;
    
    rectCanvas.style.cursor = 'grabbing';
    break;
  }
}
});

rectCanvas.addEventListener('mousemove', (e) => {
if (isDragging && draggedBall) {
  const rectPos = rectCanvas.getBoundingClientRect();
  const mouseX = e.clientX - rectPos.left;
  const mouseY = e.clientY - rectPos.top;
  draggedBall.x = mouseX - MouseOffsetX;
  draggedBall.y = mouseY - MouseOffsetY;
  
 
  if (isInsideRectangle(draggedBall.x, draggedBall.y, draggedBall.radius)) {
    draggedBall.isHovering = true; 
  } else {
    draggedBall.isHovering = false;
  }
}
});

rectCanvas.addEventListener('mouseup', () => {
if (isDragging && draggedBall) {
  if (isInsideRectangle(draggedBall.x, draggedBall.y, draggedBall.radius)) {
    draggedBall.insideRect = true;
  } else {
    draggedBall.insideRect = false;
  }
  draggedBall.isHovering = false;
  isDragging = false;
  draggedBall = null;
  rectCanvas.style.cursor = 'grab';
}
});

  function updateBalls() {
    balls.forEach(b => {
      if (b.canMove) {
        b.x += b.velocityX;//deltaTime =1;
        b.y += b.velocityY;
      }
    });

    // edge collision
    for (let b of balls) {
      if (!b.insideRect) continue;

      const localPos = toLocal(b.x, b.y, currentAngle);
      let LocalX = localPos.x;
      let LocalY = localPos.y;
      let vx = b.velocityX;
      let vy = b.velocityY;
      if (LocalX - b.radius < 0) {
        LocalX = b.radius;
        vx = -vx;
      } else if (LocalX + b.radius > rectWidth) {
        LocalX = rectWidth - b.radius;
        vx = -vx;
      }

      if (LocalY - b.radius < 0) {
        LocalY = b.radius;
        vy = -vy;
      } else if (LocalY + b.radius > rectHeight) {
        LocalY = rectHeight - b.radius;
        vy = -vy;
      }
      const newGlobal = toGlobal(LocalX, LocalY, currentAngle);
      b.x = newGlobal.x;
      b.y = newGlobal.y;

      b.velocityX = vx;
      b.velocityY = vy;
    }

    // ball collision
    for (let i = 0; i < balls.length; i++) {
      for (let j = i + 1; j < balls.length; j++) {
        const ball1 = balls[i];
        const ball2 = balls[j];
        if (!ball1.insideRect || !ball2.insideRect) continue;

        const distanceX = ball2.x - ball1.x;
        const distanceY = ball2.y - ball1.y;
        const dist = Math.hypot(distanceX, distanceY);
        const sumR = ball1.radius + ball2.radius;

        if (dist < sumR && dist > 0) {
          const NormalX = distanceX / dist;
          const NormalY = distanceY / dist;
          const vx = ball2.velocityX - ball1.velocityX;
          const vy = ball2.velocityY - ball1.velocityY;
          const relativeVelocity = vx * NormalX + vy * NormalY;

          if (relativeVelocity < 0) {
            const m1 = ball1.mass;
            const m2 = ball2.mass;
            const collisionForce = (2 * relativeVelocity) / (m1 + m2);

            const collisionForceX = collisionForce * NormalX;
            const collisionForceY = collisionForce * NormalY;

            ball1.velocityX += collisionForceX * m2;
            ball1.velocityY += collisionForceY * m2;
            ball2.velocityX -= collisionForceX * m1;
            ball2.velocityY -= collisionForceY * m1;

            // Overlap fix
            const overlap = (sumR - dist) / 2;
            ball1.x -= overlap * NormalX;
            ball1.y -= overlap * NormalY;
            ball2.x += overlap * NormalX;
            ball2.y += overlap * NormalY;
          }
        }
      }
    }
  }

  function drawBalls() {
balls.forEach(b => {
  if (isDragging && b === draggedBall) {
    rectCtx.beginPath();
    rectCtx.arc(b.x, b.y, b.radius + 3, 0, 2 * Math.PI);
    rectCtx.fillStyle = 'rgba(255,255,255,0.3)';
    rectCtx.fill();
  }
  
  rectCtx.beginPath();
  rectCtx.arc(b.x, b.y, b.radius, 0, 2 * Math.PI);
  rectCtx.fillStyle = b.color;
  rectCtx.fill();
  
  if (b.insideRect) {
    rectCtx.lineWidth = 2;
    rectCtx.strokeStyle = '#26c281';
  } else {
    rectCtx.lineWidth = 1;
    rectCtx.strokeStyle = '#333';
  }
  
  if (b.isHovering) {
    rectCtx.lineWidth = 2;
    rectCtx.strokeStyle = '#3498db';
  }
  
  rectCtx.stroke();
  rectCtx.lineWidth = 1; 

  rectCtx.fillStyle = '#000';
  rectCtx.font = '12px sans-serif';
  rectCtx.textAlign = 'center';
  rectCtx.textBaseline = 'middle';
  rectCtx.fillText(b.id, b.x, b.y);

  const arrowLen = 20;
  const angle = Math.atan2(b.velocityY, b.velocityX);
  const tipX = b.x + arrowLen * Math.cos(angle);
  const tipY = b.y + arrowLen * Math.sin(angle);

  rectCtx.beginPath();
  rectCtx.moveTo(b.x, b.y);
  rectCtx.lineTo(tipX, tipY);
  rectCtx.strokeStyle = '#444';
  rectCtx.stroke();

  const headSize = 5;
  rectCtx.beginPath();
  rectCtx.moveTo(tipX, tipY);
  rectCtx.lineTo(
    tipX - headSize * Math.cos(angle - Math.PI / 6),
    tipY - headSize * Math.sin(angle - Math.PI / 6)
  );
  rectCtx.moveTo(tipX, tipY);
  rectCtx.lineTo(
    tipX - headSize * Math.cos(angle + Math.PI / 6),
    tipY - headSize * Math.sin(angle + Math.PI / 6)
  );
  rectCtx.stroke();
});
}

  function animate() {
    drawRectangle(currentAngle);
    updateBalls();
    drawBalls();
    requestAnimationFrame(animate);
  }
  animate();

  const trajectoryCanvas = document.getElementById('trajectoryCanvas');
  const trajectoryCtx = trajectoryCanvas.getContext('2d');

  let paths = {};
  let pathRecordInterval = null;
  const pathRecordFrequency = 100; // ms

  function recordBallPositions() {
  balls.forEach(b => {
    const localPos = toLocal(b.x, b.y, currentAngle);
    if (!paths[b.id]) {
      paths[b.id] = [];
    }
    paths[b.id].push({ x: localPos.x, y: localPos.y });
  });
}

function clearTrajectoryCanvas() {
  trajectoryCtx.clearRect(0, 0, trajectoryCanvas.width, trajectoryCanvas.height);
}

function drawPathsOnTrajectoryCanvas() {
clearTrajectoryCanvas();

// A4 paper: 210mm × 297mm (21cm × 29.7cm)
const cmToPixelRatio = 595 / 21; 

const scaleX = trajectoryCanvas.width / rectWidth;  
const scaleY = trajectoryCanvas.height / rectHeight; 

trajectoryCtx.strokeStyle = "#000";
trajectoryCtx.strokeRect(0, 0, trajectoryCanvas.width, trajectoryCanvas.height);

// 1 cm scale bar
trajectoryCtx.fillStyle = "#000";
trajectoryCtx.fillRect(
  trajectoryCanvas.width - cmToPixelRatio - 20, 
  trajectoryCanvas.height - 20, 
  cmToPixelRatio, 
  5
);
trajectoryCtx.fillStyle = "#000";
trajectoryCtx.font = "12px Arial";
trajectoryCtx.fillText(
  "1 cm", 
  trajectoryCanvas.width - cmToPixelRatio - 10, 
  trajectoryCanvas.height - 25
);

for (let b of balls) {
  const ballId = b.id;
  const color = b.color;
  const snapshots = paths[ballId];
  if (!snapshots) continue;

  snapshots.forEach(s => {
    const drawX = s.x * scaleX;
    const drawY = (rectHeight - s.y) * scaleY;

    trajectoryCtx.beginPath();
    trajectoryCtx.arc(drawX, drawY, 1.5, 0, 2 * Math.PI);
    trajectoryCtx.fillStyle = color;
    trajectoryCtx.fill();
  });
}
}
function startPathRecording() {
  if (pathRecordInterval) return;
  pathRecordInterval = setInterval(() => {
    recordBallPositions();
    drawPathsOnTrajectoryCanvas();
  }, pathRecordFrequency);
}
function stopPathRecording() {
  clearInterval(pathRecordInterval);
  pathRecordInterval = null;
}


document.getElementById("saveBtn").addEventListener("click", () => {
  const imageDataURL = trajectoryCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageDataURL;
  link.download = "trajectory.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});




 

