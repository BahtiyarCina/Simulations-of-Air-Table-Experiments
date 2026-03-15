let pmAnimationId = null;
let pmStartTime = 0;
let pmObject = null;
let pmDataPoints = [];
let pmTraceEnabled = false;
let pmTracePoints = [];

document.getElementById('pmStartButton').addEventListener('click', startProjectileMotion);
document.getElementById('pmResetButton').addEventListener('click', resetProjectileMotion);
document.getElementById('pmTraceButton').addEventListener('click', toggleProjectileTrace);
document.getElementById('pmSaveGraphBtn').addEventListener('click', saveProjectileGraph);
document.getElementById('pmSaveDataBtn').addEventListener('click', saveProjectileData);
document.getElementById('pmTableAngleInput').addEventListener('input', function() {
  const tableAngle = this.value;
  document.getElementById('pmTableAngleValue').textContent = `${tableAngle}°`;
    drawTableAngleIndicator(parseInt(tableAngle));
  
  if (pmObject) {
    pmObject.tableAngle = parseInt(tableAngle);
  }
});

//sekme değiştirme 
document.querySelectorAll('#projectile-experiment .tab-btn').forEach(button => {
  button.addEventListener('click', function() {
      document.querySelectorAll('#projectile-experiment .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#projectile-experiment .tab-pane').forEach(p => p.classList.remove('active'));
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(() => {
        drawTableAngleIndicator(90);
      }, 100);
    });
    this.classList.add('active');
        const targetId = this.getAttribute('data-target');
    document.getElementById(targetId).classList.add('active');
   //grafikler 
  if (pmDataPoints.length > 0) {
      if (targetId === 'positionTab') {
        drawPositionGraph();
      } else if (targetId === 'velocityTab') {
        drawVelocityGraph();
      } else if (targetId === 'energyTab') {
        drawEnergyGraph();
      }
    }
  });
});
// izleri aç/kapat
function toggleProjectileTrace() {
  pmTraceEnabled = !pmTraceEnabled;
  document.getElementById('pmTraceButton').style.backgroundColor = pmTraceEnabled ? '#4c91cd' : 'white';
}


function startProjectileMotion() {
  const initialVelocity = parseFloat(document.getElementById('pmVelocityInput').value);
  const angle = parseFloat(document.getElementById('pmAngleInput').value);
  const gravity = parseFloat(document.getElementById('pmGravityInput').value);
  const initialHeight = parseFloat(document.getElementById('pmHeightInput').value);
  const mass = parseFloat(document.getElementById('pmMassInput').value);
  const useAirResistance = document.getElementById('pmAirResistanceCheckbox').checked;
  const dragCoefficient = parseFloat(document.getElementById('pmDragCoefficientInput').value);
  const tableAngle = parseInt(document.getElementById('pmTableAngleInput').value);
  drawTableAngleIndicator(tableAngle);


  if (isNaN(angle) || angle < 0 || angle > 90) return alert(t('alerts.invalidAngle'));
  if (isNaN(initialHeight)) return alert(t('alerts.invalidInitialHeight'));
  if (isNaN(mass) || mass <= 0) return alert(t('alerts.invalidMass'));
  if (useAirResistance && (isNaN(dragCoefficient) || dragCoefficient < 0)) return alert(t('alerts.invalidDragCoefficient'));

  const angleRad = (angle * Math.PI) / 180;
  const effectiveGravity = gravity * Math.sin((tableAngle * Math.PI) / 180);
  pmObject = {
    mass: mass,
    x: 0,
    y: initialHeight,
    vx: initialVelocity * Math.cos(angleRad),
    vy: initialVelocity * Math.sin(angleRad),
    gravity: gravity,
    tableAngle: tableAngle, 
    acy:effectiveGravity,
    useAirResistance: useAirResistance,
    dragCoefficient: dragCoefficient,
    initialValues: {
      velocity: initialVelocity,
      angle: angle,
      height: initialHeight,
      energy: 0.5 * mass * Math.pow(initialVelocity, 2) + mass * effectiveGravity * initialHeight
    },
    radius: 15,
    time: 0,
    landed: false
  };
  pmDataPoints = [];
  if (!pmTraceEnabled) {
    pmTracePoints = [];
  }
  pmStartTime = performance.now();
  animateProjectileMotion();
}

function animateProjectileMotion() {
  const pmCanvas = document.getElementById('projectileCanvas');
  const pmCtx = pmCanvas.getContext('2d');
  const currentTime = performance.now();
  const elapsedTimeMs = (currentTime - pmStartTime)/1000;
  const deltaTime = elapsedTimeMs - (pmObject.time || 0); 
  pmObject.time = elapsedTimeMs;
  
if (!pmObject.landed) {
  let fx = 0;
  let fy = -pmObject.mass * pmObject.acy;  
  if (pmObject.useAirResistance) {
    const velocity = Math.sqrt(Math.pow(pmObject.vx, 2) + Math.pow(pmObject.vy, 2));
    const drag = pmObject.dragCoefficient * velocity;
     if (velocity > 0) {
      fx -= drag * pmObject.vx/ velocity;
      fy -= drag * pmObject.vy / velocity;
    }
  }
  const ax = fx / pmObject.mass;
  const ay = fy / pmObject.mass; 
  pmObject.vx += ax * deltaTime;
  pmObject.vy += ay * deltaTime; 
  pmObject.x += pmObject.vx * deltaTime;
  pmObject.y += pmObject.vy * deltaTime;
}
  const kineticEnergy = 0.5 * pmObject.mass * (Math.pow(pmObject.vx, 2) + Math.pow(pmObject.vy, 2));
  const potentialEnergy = pmObject.mass * pmObject.acy * pmObject.y;
  const totalEnergy = kineticEnergy + potentialEnergy;
  pmDataPoints.push({
    time: pmObject.time,
    x: pmObject.x,
    y: pmObject.y,
    vx: pmObject.vx,
    vy: pmObject.vy,
    speed: Math.sqrt(Math.pow(pmObject.vx, 2) + Math.pow(pmObject.vy, 2)),
    ke: kineticEnergy,
    pe: potentialEnergy,
    te: totalEnergy
  });
  
  //izler
  if (pmTraceEnabled) {
    pmTracePoints.push({ x: pmObject.x, y: pmObject.y });
  }
  drawProjectileScene();
  // grafikleri güncelle
  const activeTab = document.querySelector('#projectile-experiment .tab-btn.active').getAttribute('data-target');
  if (activeTab === 'positionTab') {
    drawPositionGraph();
  } else if (activeTab === 'velocityTab') {
    drawVelocityGraph();
  } else if (activeTab === 'energyTab') {
    drawEnergyGraph();
  }
  if (!pmObject.landed) {
    pmAnimationId = requestAnimationFrame(animateProjectileMotion);
  }
}

function drawProjectileScene() {
  const pmCanvas = document.getElementById('projectileCanvas');
  const pmCtx = pmCanvas.getContext('2d');
  pmCtx.clearRect(0, 0, pmCanvas.width, pmCanvas.height);

  const canvasWidth = pmCanvas.width;
  const canvasHeight = pmCanvas.height;
  
  //max mesafe ve yükseklik hesapla
  const maxDistance = calculateMaxDistance(
    pmObject.initialValues.velocity,
    pmObject.initialValues.angle,
    pmObject.initialValues.height,
    pmObject.acy,
    pmObject.useAirResistance ? pmObject.dragCoefficient : 0
  );
  
  const maxHeight = calculateMaxHeight(
    pmObject.initialValues.velocity,
    pmObject.initialValues.angle,
    pmObject.initialValues.height,
    pmObject.acy,
    pmObject.useAirResistance ? pmObject.dragCoefficient : 0
  );
    const maxX = Math.max(maxDistance * 1.2, 10);
  const maxY = Math.max(maxHeight * 1.2, pmObject.initialValues.height * 1.2, 10);
  
  //ölçek 
  const scaleX = (canvasWidth ) / maxX;
  const scaleY = (canvasHeight ) / maxY;
const radiusMeter = pmObject.radius / scaleY;

if (pmObject.y <= radiusMeter) {
  pmObject.y = radiusMeter; 
  pmObject.landed = true;

  showProjectileResults();
}
  const originX = canvasWidth * 0.1;
  const originY = canvasHeight * 0.9;
  
  //grid x ekseni
  pmCtx.beginPath();
  pmCtx.moveTo(0, originY);
  pmCtx.lineTo(canvasWidth, originY);
  pmCtx.strokeStyle = '#333';
  pmCtx.lineWidth = 2;
  pmCtx.stroke();
  pmCtx.strokeStyle = '#ddd';
  pmCtx.lineWidth = 0.5;
  
  // grid y ekseni
  const verticalGrids = Math.ceil(maxX / 10); // metre
  for (let x = 0; x <= maxX; x += verticalGrids) {
    const posX = originX + x * scaleX;
    pmCtx.beginPath();
    pmCtx.moveTo(posX, 0);
    pmCtx.lineTo(posX, canvasHeight);
    pmCtx.stroke();
    
    // label
    pmCtx.fillStyle = '#555';
    pmCtx.textAlign = 'center';
    pmCtx.fillText(`${x}m`, posX, originY + 20);
  }
  const horizontalGrids = Math.ceil(maxY /  10); 
  for (let y = 0; y <= maxY; y += horizontalGrids) {
    const posY = originY - y * scaleY;
    pmCtx.beginPath();
    pmCtx.moveTo(0, posY);
    pmCtx.lineTo(canvasWidth, posY);
    pmCtx.stroke();
    pmCtx.fillStyle = '#555';
    pmCtx.textAlign = 'right';
    pmCtx.fillText(`${y}m`, originX - 10, posY + 4);
  }
  if (pmTracePoints.length > 0) {
    pmCtx.beginPath();
    const firstPoint = pmTracePoints[0];
    pmCtx.moveTo(originX + firstPoint.x * scaleX, originY - firstPoint.y * scaleY);
    
    for (let i = 1; i < pmTracePoints.length; i++) {
      const point = pmTracePoints[i];
      pmCtx.lineTo(originX + point.x * scaleX, originY - point.y * scaleY);
    }
    
    pmCtx.strokeStyle = 'rgba(255, 150, 0, 0.5)';
    pmCtx.lineWidth = 2;
    pmCtx.stroke();
  }
  // teorik yörünge
  if (!pmObject.useAirResistance) {
    pmCtx.beginPath();
    
    const v0 = pmObject.initialValues.velocity;
    const theta = (pmObject.initialValues.angle * Math.PI) / 180;
    const h0 = pmObject.initialValues.height;
    const g = pmObject.acy;
    
    // uçuş süresi
    const timeOfFlight = (v0 * Math.sin(theta) + Math.sqrt(Math.pow(v0 * Math.sin(theta), 2) + 2 * g * h0)) / g;
    
    for (let t = 0; t <= timeOfFlight; t += timeOfFlight / 100) {
      const x = v0 * Math.cos(theta) * t;
      const y = h0 + v0 * Math.sin(theta) * t - 0.5 * g * t * t;
      
      if (t === 0) {
        pmCtx.moveTo(originX + x * scaleX, originY - y * scaleY);
      } else {
        pmCtx.lineTo(originX + x * scaleX, originY - y * scaleY);
      }
    }
    pmCtx.strokeStyle = 'rgba(4, 50, 055, 210)';
    pmCtx.lineWidth = 2;
    pmCtx.stroke();
  }
  const projX = originX + pmObject.x * scaleX;
  const projY = originY - pmObject.y * scaleY;

  const shadowSize = pmObject.radius * (1 - pmObject.y / maxY)
  pmCtx.beginPath();
  pmCtx.arc(originX + pmObject.x * scaleX, originY,shadowSize,pmObject.radius * 0.6, 0, 2 * Math.PI);
  pmCtx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  pmCtx.fill();
  
  // topun pozisyonunu çiz
  pmCtx.beginPath();
  pmCtx.arc(projX, projY, pmObject.radius, 0, 2 * Math.PI);
  pmCtx.fillStyle = '#4D908E';
  pmCtx.fill();
  pmCtx.strokeStyle = '#333';
  pmCtx.lineWidth = 2;
  pmCtx.stroke();
  
  // hız okları
  if (!pmObject.landed) {
    const vectorLength = Math.sqrt(Math.pow(pmObject.vx, 2) + Math.pow(pmObject.vy, 2)) * 0.8;
    const angle = Math.atan2(-pmObject.vy, pmObject.vx); 
    
    pmCtx.beginPath();
    pmCtx.moveTo(projX, projY);
    pmCtx.lineTo(
      projX + vectorLength * Math.cos(angle) * scaleX / 5,
      projY + vectorLength * Math.sin(angle) * scaleY / 5
    );
    pmCtx.strokeStyle = '#FF0000';
    pmCtx.lineWidth = 2;
    pmCtx.stroke();
    
    //ok başlığı
    const arrowSize = 8;
    pmCtx.beginPath();
    pmCtx.moveTo(
      projX + vectorLength * Math.cos(angle) * scaleX / 5,
      projY + vectorLength * Math.sin(angle) * scaleY / 5
    );
    pmCtx.lineTo(
      projX + vectorLength * Math.cos(angle) * scaleX / 5 - arrowSize * Math.cos(angle - Math.PI/6),
      projY + vectorLength * Math.sin(angle) * scaleY / 5 - arrowSize * Math.sin(angle - Math.PI/6)
    );
    pmCtx.moveTo(
      projX + vectorLength * Math.cos(angle) * scaleX / 5,
      projY + vectorLength * Math.sin(angle) * scaleY / 5
    );
    pmCtx.lineTo(
      projX + vectorLength * Math.cos(angle) * scaleX / 5 - arrowSize * Math.cos(angle + Math.PI/6),
      projY + vectorLength * Math.sin(angle) * scaleY / 5 - arrowSize * Math.sin(angle + Math.PI/6)
    );
    pmCtx.stroke();
  }
  
  // gerçek zaman verileri
  pmCtx.fillStyle = '#000';
  pmCtx.font = '14px Arial';
  pmCtx.textAlign = 'left';
  
  const infoX = canvasHeight * 0.05;
  const infoY = canvasHeight * 0.09;
  const lineHeight = 20;
  
  pmCtx.fillText(`Time: ${pmObject.time.toFixed(2)} s`, infoX, infoY);
  pmCtx.fillText(`Position: (${pmObject.x.toFixed(2)} m, ${pmObject.y.toFixed(2)} m)`, infoX, infoY + lineHeight);
  
  const speed = Math.sqrt(Math.pow(pmObject.vx, 2) + Math.pow(pmObject.vy, 2));
  const angle = Math.atan2(pmObject.vy, pmObject.vx) * 180 / Math.PI;
  
  pmCtx.fillText(`Velocity: ${speed.toFixed(2)} m/s, ${angle.toFixed(1)}°`, infoX, infoY + 2 * lineHeight);
  pmCtx.fillText(`Vx: ${pmObject.vx.toFixed(2)} m/s, Vy: ${pmObject.vy.toFixed(2)} m/s`, infoX, infoY + 3 * lineHeight);
  
  const kineticEnergy = 0.5 * pmObject.mass * (Math.pow(pmObject.vx, 2) + Math.pow(pmObject.vy, 2));
  const potentialEnergy = pmObject.mass * pmObject.acy * pmObject.y;
  
  pmCtx.fillText(`Kinetic Energy: ${kineticEnergy.toFixed(2)} J`, infoX, infoY + 4 * lineHeight);
  pmCtx.fillText(`Potential Energy: ${potentialEnergy.toFixed(2)} J`, infoX, infoY + 5 * lineHeight);
  pmCtx.fillText(`Total Energy: ${(kineticEnergy + potentialEnergy).toFixed(2)} J`, infoX, infoY + 6 * lineHeight);
  pmCtx.fillText(`Effective Gravity: ${pmObject.acy.toFixed(2)} m/s² (${pmObject.tableAngle}°)`, infoX, infoY + 7 * lineHeight);

}

function drawPositionGraph() {
  const canvas = document.getElementById('pmPositionCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = 50;
  const graphWidth = canvas.width - (padding * 2);
  const graphHeight = canvas.height - (padding * 2);
  
  // eksenleri çiz
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width*0.7 - padding, canvas.height - padding);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Time (s)', canvas.width / 2, canvas.height - 10);

  ctx.save();
  ctx.translate(15, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Position (m)', 0, 0);
  ctx.restore();
  
  if (pmDataPoints.length < 2) return;
  
  // ölçek hesapla
  const maxTime = pmDataPoints[pmDataPoints.length - 1].time;
  let maxX = 0, maxY = 0;
  
  for (const point of pmDataPoints) {
    if (point.x > maxX) maxX = point.x;
    if (point.y > maxY) maxY = point.y;
  }
  
  const timeScale = graphWidth / (maxTime || 1) * 0.65;
  const xScale = graphHeight / (maxX || 1) * 0.65;
  const yScale = graphHeight / (maxY || 1) * 0.65;
  
  // x pozisyonu çiz
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height - padding - (pmDataPoints[0].x * xScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height - padding - (pmDataPoints[i].x * xScale)
    );
  }
  
  ctx.strokeStyle = '#F94144';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // y pozisyonu çiz
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height - padding - (pmDataPoints[0].y * yScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height - padding - (pmDataPoints[i].y * yScale)
    );
  }
  
  ctx.strokeStyle = '#277DA1';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // gösterge
  const legendX = padding + 20;
  const legendY = padding + 20;
  
  ctx.fillStyle = '#F94144';
  ctx.fillRect(legendX, legendY, 20, 10);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText('X Position', legendX + 30, legendY + 8);

  ctx.fillStyle = '#F9C74F';
  ctx.fillRect(legendX, legendY + 20, 20, 10);
  ctx.fillStyle = '#000';
  ctx.fillText('Y Position', legendX + 30, legendY + 28);
  
  // ölçek işaretleri
  const timediff = Math.ceil(maxTime / 5 * 10) / 10; // 10/10 küsürat için 
  for (let t = 0; t <= maxTime; t += timediff) {
    const x = padding + t * timeScale;
    
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - padding);
    ctx.lineTo(x, canvas.height - padding + 5);
    ctx.stroke();
    
    ctx.fillText(t.toFixed(1), x, canvas.height - padding + 20);
  }
  
  //  pozisyon ölçekleri
  const ydiff = Math.ceil(maxY / 5);
  for (let y = 0; y <= maxY; y += ydiff) {
    const posY = canvas.height - padding - y * yScale;
    
    ctx.beginPath();
    ctx.moveTo(padding - 5, posY);
    ctx.lineTo(padding, posY);
    ctx.stroke();
    
    ctx.textAlign = 'right';
    ctx.fillText(y.toFixed(1), padding - 10, posY + 4);
  }
}

function drawVelocityGraph() {
  const canvas = document.getElementById('pmVelocityCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = 50;
  const graphWidth = canvas.width - (padding * 2);
  const graphHeight = canvas.height - (padding * 2);
  
  // eksenleri çiz  
  ctx.beginPath(); 
  ctx.moveTo(padding, canvas.height / 2);//x ekseni zaman
  ctx.lineTo(canvas.width - padding, canvas.height / 2);

  ctx.moveTo(padding, padding);// y eksen, hız
  ctx.lineTo(padding, canvas.height - padding);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Time (s)', canvas.width / 2, canvas.height - 10);

  ctx.save();
  ctx.translate(15, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Velocity (m/s)', 0, 0);
  ctx.restore();
  
  if (pmDataPoints.length < 2) return;
  
  // ölçek hesapla
  
  const maxTime = pmDataPoints[pmDataPoints.length - 1].time;
  let maxVx = 0, minVy = 0, maxVy = 0;
  
  for (const point of pmDataPoints) {
    if (Math.abs(point.vx) > maxVx) maxVx = Math.abs(point.vx);
    if (point.vy > maxVy) maxVy = point.vy;
    if (point.vy < minVy) minVy = point.vy;
  }
  
  const maxV = Math.max(maxVx, Math.max(maxVy, Math.abs(minVy)));
  
  const timeScale = graphWidth / (maxTime || 1);
  const vScale = (graphHeight / 2) / (maxV || 1);
  
  // x hızını çiz
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height / 2 - (pmDataPoints[0].vx * vScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height / 2 - (pmDataPoints[i].vx * vScale)
    );
  }
  
  ctx.strokeStyle = '#F94144';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // y hızını çiz
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height / 2 - (pmDataPoints[0].vy * vScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height / 2 - (pmDataPoints[i].vy * vScale)
    );
  }
  
  ctx.strokeStyle = '#277DA1';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // renkli alan
  const legendX = padding + 20;
  const legendY = padding + 20;
  
  ctx.fillStyle = '#F94144';
  ctx.fillRect(legendX, legendY, 20, 10);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText('Vx', legendX + 30, legendY + 8);
  
  ctx.fillStyle = '#277DA1';
  ctx.fillRect(legendX, legendY + 20, 20, 10);
  ctx.fillStyle = '#000';
  ctx.fillText('Vy', legendX + 30, legendY + 28);
  
  // Ölçek işaretleri
  const timediff = Math.ceil(maxTime / 5 * 10) / 10;
  for (let t = 0; t <= maxTime; t += timediff) {
    const x = padding + t * timeScale;
    
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - padding);
    ctx.lineTo(x, canvas.height - padding + 5);
    ctx.stroke();
    
    ctx.fillText(t.toFixed(1), x, canvas.height - padding + 20);
  }
  
  // hız ölçekleri
  const vInterval = Math.ceil(maxV / 3);
  for (let v = -maxV; v <= maxV; v += vInterval) {
    const posY = canvas.height / 2 - v * vScale;
    
    ctx.beginPath();
    ctx.moveTo(padding - 5, posY);
    ctx.lineTo(padding, posY);
    ctx.stroke();
    
    ctx.textAlign = 'right';
    ctx.fillText(v.toFixed(1), padding - 10, posY + 4);
  }
}

function drawEnergyGraph() {
  const canvas = document.getElementById('pmEnergyCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const padding = 40;
  const graphWidth = canvas.width - (padding * 2);
  const graphHeight = canvas.height - (padding * 2);
  
  // eksenleri çiz
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;
  ctx.stroke();
  
  // Labels
  ctx.fillStyle = '#000';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('Time (s)', canvas.width / 2, canvas.height - 10);

  ctx.save();
  ctx.translate(15, canvas.height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('Energy (J)', 0, 0);
  ctx.restore();
  
  if (pmDataPoints.length < 2) return;
  
  // ölçekleri hesapla
  const maxTime = pmDataPoints[pmDataPoints.length - 1].time;
  let maxEnergy = 0;
  
  for (const point of pmDataPoints) {
    const totalEnergy = point.ke + point.pe;
    if (totalEnergy > maxEnergy) maxEnergy = totalEnergy;
  }
  
  const timeScale = graphWidth / (maxTime || 1);
  const energyScale = graphHeight / (maxEnergy || 1);
  
  // KE
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height - padding - (pmDataPoints[0].ke * energyScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height - padding - (pmDataPoints[i].ke * energyScale)
    );
  }
  
  ctx.strokeStyle = '#F9C74F';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  //PE
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height - padding - (pmDataPoints[0].pe * energyScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height - padding - (pmDataPoints[i].pe * energyScale)
    );
  }
  
  ctx.strokeStyle = '#4D908E';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Toplam
  ctx.beginPath();
  ctx.moveTo(
    padding + (pmDataPoints[0].time * timeScale),
    canvas.height - padding - (pmDataPoints[0].te * energyScale)
  );
  
  for (let i = 1; i < pmDataPoints.length; i++) {
    ctx.lineTo(
      padding + (pmDataPoints[i].time * timeScale),
      canvas.height - padding - (pmDataPoints[i].te * energyScale)
    );
  }
  
  ctx.strokeStyle = '#F94144';
  ctx.lineWidth = 2;
  ctx.stroke();
  
  // Legend
  const legendX = padding + 20;
  const legendY = padding + 20;
  
  ctx.fillStyle = '#F9C74F';
  ctx.fillRect(legendX, legendY, 20, 10);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'left';
  ctx.fillText('Kinetic Energy', legendX + 30, legendY + 8);

  ctx.fillStyle = '#4D908E';
  ctx.fillRect(legendX, legendY + 20, 20, 10);
  ctx.fillStyle = '#000';
  ctx.fillText('Potential Energy', legendX + 30, legendY + 28);

  ctx.fillStyle = '#F94144';
  ctx.fillRect(legendX, legendY + 40, 20, 10);
  ctx.fillStyle = '#000';
  ctx.fillText('Total Energy', legendX + 30, legendY + 48);
  
  // ölçek işaretleri
  const timediff = Math.ceil(maxTime / 5 * 10) / 10;
  for (let t = 0; t <= maxTime; t += timediff) {
    const x = padding + t * timeScale;
    
    ctx.beginPath();
    ctx.moveTo(x, canvas.height - padding);
    ctx.lineTo(x, canvas.height - padding + 5);
    ctx.stroke();
    
    ctx.fillText(t.toFixed(1), x, canvas.height - padding + 20);
  }
  
  // enerji ölçekleri
  const energyInterval = Math.ceil(maxEnergy / 5 * 10) / 10;
  for (let e = 0; e <= maxEnergy; e += energyInterval) {
    const posY = canvas.height - padding - e * energyScale;
    
    ctx.beginPath();
    ctx.moveTo(padding - 5, posY);
    ctx.lineTo(padding, posY);
    ctx.stroke();
    
    ctx.textAlign = 'right';
    ctx.fillText(e.toFixed(1), padding - 10, posY + 4);
  }
}
function drawTableAngleIndicator(angle) {
  const canvas = document.getElementById('pmTableAngleCanvas');
  if (!canvas) return;
  
  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  
  ctx.clearRect(0, 0, width, height);
  
  ctx.fillStyle = '#f9f9f9';
  ctx.fillRect(0, 0, width, height);
  
  const tableLength = height * 0.6;  
  const tableWidth = width * 0.1;    
  const angleRad = ((90 - angle) * Math.PI) / 180;
  
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angleRad);
  
  ctx.fillStyle = '#774936';
  ctx.fillRect(-tableWidth/2, -tableLength/2, tableWidth, tableLength);
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;
  ctx.strokeRect(-tableWidth/2, -tableLength/2, tableWidth, tableLength);
  
  ctx.fillStyle = '#4D908E';
  ctx.beginPath();
  ctx.arc(0, -tableLength/3, tableWidth * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  
  const ballX = 0;
  const ballY = -tableLength/3;
  
  ctx.restore();

  const gravity = 9.8;
  const effectiveGravity = gravity * Math.sin(((angle) * Math.PI) / 180);
  const arrowLength = Math.abs(effectiveGravity) * height * 0.05;
  
  const rotatedBallX = centerX + ballX * Math.cos(angleRad) - ballY * Math.sin(angleRad);
  const rotatedBallY = centerY + ballX * Math.sin(angleRad) + ballY * Math.cos(angleRad);
  
 
  ctx.strokeStyle = '#FF3333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rotatedBallX, rotatedBallY);
  ctx.lineTo(rotatedBallX, rotatedBallY + arrowLength);
  ctx.stroke();

    const arrowHeadSize = 6;
  ctx.fillStyle = '#FF3333';
  ctx.beginPath();
  ctx.moveTo(rotatedBallX, rotatedBallY + arrowLength);  
  ctx.lineTo(rotatedBallX - arrowHeadSize, rotatedBallY + arrowLength - arrowHeadSize);
  ctx.lineTo(rotatedBallX + arrowHeadSize, rotatedBallY + arrowLength - arrowHeadSize);
  ctx.closePath();
  ctx.fill();
  
  ctx.font = '12px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText(`θ = ${angle}°`, centerX, height - 5);
  ctx.textAlign = 'center';
  ctx.fillText(`g_eff = ${effectiveGravity.toFixed(1)} m/s²`, centerX, 15);
}

function resetProjectileMotion() {
  if (pmAnimationId) {
    cancelAnimationFrame(pmAnimationId);
    pmAnimationId = null;
  }
  
  pmObject = null;
  pmDataPoints = [];
  
  const pmCanvas = document.getElementById('projectileCanvas');
  const pmCtx = pmCanvas.getContext('2d');
  pmCtx.clearRect(0, 0, pmCanvas.width, pmCanvas.height);
  
  const positionCanvas = document.getElementById('pmPositionCanvas');
  const positionCtx = positionCanvas.getContext('2d');
  positionCtx.clearRect(0, 0, positionCanvas.width, positionCanvas.height);
  
  const velocityCanvas = document.getElementById('pmVelocityCanvas');
  const velocityCtx = velocityCanvas.getContext('2d');
  velocityCtx.clearRect(0, 0, velocityCanvas.width, velocityCanvas.height);
  const tableAngle = parseInt(document.getElementById('pmTableAngleInput').value);
  drawTableAngleIndicator(tableAngle);
  
  const energyCanvas = document.getElementById('pmEnergyCanvas');
  const energyCtx = energyCanvas.getContext('2d');
  energyCtx.clearRect(0, 0, energyCanvas.width, energyCanvas.height);
  
  document.getElementById('pmResults').innerHTML = `
    <p>Results will be displayed when the experiment starts.</p>
  `;

  // izleri temizle iz modunda değise
    pmTracePoints = [];
  
}

function showProjectileResults() {
  const resultsDiv = document.getElementById('pmResults');

  const v0 = pmObject.initialValues.velocity;
  const angle = pmObject.initialValues.angle;
  const height = pmObject.initialValues.height;
  const theta = angle * Math.PI / 180;
  
  // teorik hesaplamlara hava dirençsiz
  const g = pmObject.acy;
  
  // uçuş süresi
  const theoreticalTimeOfFlight = (v0 * Math.sin(theta) + Math.sqrt(Math.pow(v0 * Math.sin(theta), 2) + 2 * g * height)) / g;
  
  // menzil
  const theoreticalRange = v0 * Math.cos(theta) * theoreticalTimeOfFlight;
  
  // Max yükseklik
  const timeToMax = v0 * Math.sin(theta) / g;
  const theoreticalMaxHeight = height + v0 * Math.sin(theta) * timeToMax - 0.5 * g * Math.pow(timeToMax, 2);
  
  // gerçek hesaplamalar
  const actualTimeOfFlight = pmObject.time;
  const actualRange = pmObject.x;
 // gerçek max yükseklik 
  let actualMaxHeight = height;
  for (const point of pmDataPoints) {
    if (point.y > actualMaxHeight) {
      actualMaxHeight = point.y;
    }
  }
  
  // enerji bilgileri 
  const initialEnergy = pmObject.initialValues.energy;
  const finalEnergy = pmDataPoints[pmDataPoints.length - 1].te;
  const energyLossPercent = ((initialEnergy - finalEnergy) / initialEnergy * 100).toFixed(2);
  
  // son hız
  const finalVx = pmDataPoints[pmDataPoints.length - 1].vx;
  const finalVy = pmDataPoints[pmDataPoints.length - 1].vy;
  const finalSpeed = Math.sqrt(Math.pow(finalVx, 2) + Math.pow(finalVy, 2));
  
  // html hazırlama
  let resultsHtml = `
    <h4></h4>
    <h4>Experiment Results</h4>
    <p>Effective Gravity: ${pmObject.acy.toFixed(2)} m/s² (${pmObject.gravity} × sin(${pmObject.tableAngle}°))</p>
    <table class="results-table">
    <table class="results-table">
      <tr>
        <th></th>
        <th>Theoretical</th>
        <th>Actual (${pmObject.useAirResistance ? 'With air resistance' : 'Without air resistance'})</th>
      </tr>
      <tr>
        <td><strong>Flight time:</strong></td>
        <td>${theoreticalTimeOfFlight.toFixed(2)} s</td>
        <td>${actualTimeOfFlight.toFixed(2)} s</td>
      </tr>
      <tr>
        <td><strong>Range:</strong></td>
        <td>${theoreticalRange.toFixed(2)} m</td>
        <td>${actualRange.toFixed(2)} m</td>
      </tr>
      <tr>
        <td><strong>Maximum height:</strong></td>
        <td>${theoreticalMaxHeight.toFixed(2)} m</td>
        <td>${actualMaxHeight.toFixed(2)} m</td>
      </tr>
    </table>

    <h4>Energy Analysis</h4>
    <p>Initial Energy: ${initialEnergy.toFixed(2)} J</p>
    <p>Final Energy: ${finalEnergy.toFixed(2)} J</p>
    <p>Energy Loss: ${energyLossPercent}%</p>

    <h4>Final Velocities</h4>
    <p>Vx: ${finalVx.toFixed(2)} m/s</p>
    <p>Vy: ${finalVy.toFixed(2)} m/s</p>
    <p>Total Speed: ${finalSpeed.toFixed(2)} m/s</p>
  `;
  
  resultsDiv.innerHTML = resultsHtml;
}
//etkin sekmeyi seçmece
function saveProjectileGraph() {
  const activeTab = document.querySelector('#projectile-experiment .tab-btn.active').getAttribute('data-target');
  let canvas;
  
  if (activeTab === 'positionTab') {
    canvas = document.getElementById('pmPositionCanvas');
  } else if (activeTab === 'velocityTab') {
    canvas = document.getElementById('pmVelocityCanvas');
  } else {
    canvas = document.getElementById('pmEnergyCanvas');
  }
  
  const imageDataURL = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageDataURL;
  link.download = `projectile-${activeTab}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function saveProjectileData() {
  if (pmDataPoints.length === 0) return;
  
  // csv format
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Time,X,Y,VelocityX,VelocityY,KineticEnergy,PotentialEnergy,TotalEnergy\n";
  
  pmDataPoints.forEach(point => {
    csvContent += `${point.time.toFixed(3)},${point.x.toFixed(3)},${point.y.toFixed(3)},${point.vx.toFixed(3)},${point.vy.toFixed(3)},${point.ke.toFixed(3)},${point.pe.toFixed(3)},${point.te.toFixed(3)}\n`;
  });
  
  // indirme bağıntısı
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "projectile-motion-data.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// teorik hesaplamalar
function calculateMaxDistance(v0, angle, h0, g, k) {
  // g parametresi efektifli (g*sin(theta))
  const theta = angle * Math.PI / 180;
  const t = (v0 * Math.sin(theta) + Math.sqrt(Math.pow(v0 * Math.sin(theta), 2) + 2 * g * h0)) / g;
  return v0 * Math.cos(theta) * t;
}

function calculateMaxHeight(v0, angle, h0, g, k) {
  const theta = angle * Math.PI / 180;
  const timeToMax = v0 * Math.sin(theta) / g;
  return h0 + v0 * Math.sin(theta) * timeToMax - 0.5 * g * Math.pow(timeToMax, 2);
}