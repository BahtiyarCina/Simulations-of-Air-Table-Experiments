let pendulumAnimationId = null;
let pendulumStartTime = 0;
let pendulumDataPoints = [];
let pendulumType = 'single';
let pendulumTraceEnabled = false;
let pendulumTracePoints = [];

let singlePendulum = {
  length: 2.0,
  mass: 1.0,
  angle: Math.PI / 4,
  angularVelocity: 0,
  gravity: 9.8,
  tableAngle: 90,
  damping: 0.0,
  time: 0
};

function handlePendTableAngleInput() {
  const ta = parseInt(this.value);
  document.getElementById('pendTableAngleValue').textContent = `${ta}°`;
  drawPendTableAngleIndicator(ta);
  singlePendulum.tableAngle = ta;
}

function setupPendulumTabs() {
  document.querySelectorAll('#pendulum-experiment .tab-btn').forEach(button => {
    button.addEventListener('click', function() {
      document.querySelectorAll('#pendulum-experiment .tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#pendulum-experiment .tab-pane').forEach(p => p.classList.remove('active'));

      this.classList.add('active');
      const targetId = this.getAttribute('data-target');
      document.getElementById(targetId).classList.add('active');

      if (pendulumDataPoints.length > 0) {
        if (targetId === 'pendAngleTab') drawAngleGraph();
        else if (targetId === 'pendVelocityTab') drawAngularVelocityGraph();
        else if (targetId === 'pendEnergyTab') drawPendulumEnergyGraph();
        else if (targetId === 'pendPhaseTab') drawPhaseSpaceGraph();
      }
    });
  });
}

function updatePendulumControls() {
  document.getElementById('singlePendulumControls').style.display = 'block';
}

function drawPendTableAngleIndicator(angle) {
  const canvas = document.getElementById('pendTableAngleCanvas');
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

  ctx.restore();

  const gravity = 9.8;
  const effectiveGravity = gravity * Math.sin(((angle) * Math.PI) / 180);
  const arrowLength = Math.abs(effectiveGravity) * height * 0.05;

  const ballX = 0;
  const ballY = -tableLength/3;
  const rotatedBallX = centerX + ballX * Math.cos(angleRad) - ballY * Math.sin(angleRad);
  const rotatedBallY = centerY + ballX * Math.sin(angleRad) + ballY * Math.cos(angleRad);

  ctx.strokeStyle = '#FF3333';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(rotatedBallX, rotatedBallY);
  ctx.lineTo(rotatedBallX, rotatedBallY + arrowLength);
  ctx.stroke();

  // Arrow head
  const arrowHeadSize = 6;
  ctx.fillStyle = '#FF3333';
  ctx.beginPath();
  ctx.moveTo(rotatedBallX, rotatedBallY + arrowLength);
  ctx.lineTo(rotatedBallX - arrowHeadSize, rotatedBallY + arrowLength - arrowHeadSize);
  ctx.lineTo(rotatedBallX + arrowHeadSize, rotatedBallY + arrowLength - arrowHeadSize);
  ctx.closePath();
  ctx.fill();

  // Angle value
  ctx.font = '12px Arial';
  ctx.fillStyle = '#333';
  ctx.textAlign = 'center';
  ctx.fillText(`θ = ${angle}°`, centerX, height - 5);
  ctx.fillText(`g_eff = ${effectiveGravity.toFixed(1)} m/s²`, centerX, 15);
}

// Single pendulum physics
function rungeKutta4Single(angle, angularVelocity, gravity, length, damping, dt) {
  function derivatives(theta, omega) {
    const alpha = -(gravity / length) * Math.sin(theta) - damping * omega;
    return [omega, alpha];
  }

  const [k1_dtheta, k1_domega] = derivatives(angle, angularVelocity);
  const [k2_dtheta, k2_domega] = derivatives(
    angle + 0.5 * dt * k1_dtheta,
    angularVelocity + 0.5 * dt * k1_domega
  );
  const [k3_dtheta, k3_domega] = derivatives(
    angle + 0.5 * dt * k2_dtheta,
    angularVelocity + 0.5 * dt * k2_domega
  );
  const [k4_dtheta, k4_domega] = derivatives(
    angle + dt * k3_dtheta,
    angularVelocity + dt * k3_domega
  );

  const newAngle = angle + (dt / 6) * (k1_dtheta + 2*k2_dtheta + 2*k3_dtheta + k4_dtheta);
  const newOmega = angularVelocity + (dt / 6) * (k1_domega + 2*k2_domega + 2*k3_domega + k4_domega);

  return [newAngle, newOmega];
}

function startPendulum() {
  if (pendulumAnimationId) {
    cancelAnimationFrame(pendulumAnimationId);
  }

  const length = parseFloat(document.getElementById('pendLength1Input')?.value || 2.0);
  const mass = parseFloat(document.getElementById('pendMass1Input')?.value || 1.0);
  const angle = parseFloat(document.getElementById('pendAngle1Input')?.value || 45);
  const gravity = parseFloat(document.getElementById('pendGravityInput')?.value || 9.8);
  const damping = parseFloat(document.getElementById('pendDampingInput')?.value || 0);
  const tableAngle = parseInt(document.getElementById('pendTableAngleInput')?.value || 90);

  singlePendulum = {
    length, mass,
    angle: (angle * Math.PI) / 180,
    angularVelocity: 0,
    gravity, tableAngle, damping,
    time: 0
  };

  pendulumDataPoints = [];
  pendulumStartTime = performance.now();

  animatePendulum();
}

function animatePendulum() {
  const subSteps = 8;
  const subDt = 0.002; // 2ms - more precise calculation
  // 8 steps per frame = 16ms real time

  for (let s = 0; s < subSteps; s++) {
    const effectiveGravity = singlePendulum.gravity * Math.sin((singlePendulum.tableAngle * Math.PI) / 180);

    const [newAngle, newOmega] = rungeKutta4Single(
      singlePendulum.angle,
      singlePendulum.angularVelocity,
      effectiveGravity,
      singlePendulum.length,
      singlePendulum.damping,
      subDt
    );

    singlePendulum.angle = newAngle;
    singlePendulum.angularVelocity = newOmega;
    singlePendulum.time += subDt;
  }

  // Record data (once per frame)
  const effectiveGravity = singlePendulum.gravity * Math.sin((singlePendulum.tableAngle * Math.PI) / 180);

  const x1 = singlePendulum.length * Math.sin(singlePendulum.angle);
  const y1 = -singlePendulum.length * Math.cos(singlePendulum.angle);

  // Kinetic energy: KE = 0.5 * m * L² * ω²
  const kineticEnergy = 0.5 * singlePendulum.mass * Math.pow(singlePendulum.length, 2) * Math.pow(singlePendulum.angularVelocity, 2);
  // Potential energy: PE = m * g * h (h = L - L*cos(θ) = L(1-cos(θ)))
  const potentialEnergy = singlePendulum.mass * effectiveGravity * singlePendulum.length * (1 - Math.cos(singlePendulum.angle));

  pendulumDataPoints.push({
    time: singlePendulum.time,
    angle1: singlePendulum.angle,
    angularVelocity1: singlePendulum.angularVelocity,
    x1, y1,
    kineticEnergy,
    potentialEnergy,
    totalEnergy: kineticEnergy + potentialEnergy
  });

  if (pendulumTraceEnabled) {
    pendulumTracePoints.push({ x: x1, y: y1 });
  }

  const activeTab = document.querySelector('#pendulum-experiment .tab-btn.active')?.getAttribute('data-target');
  if (activeTab === 'pendAngleTab') drawAngleGraph();
  else if (activeTab === 'pendVelocityTab') drawAngularVelocityGraph();
  else if (activeTab === 'pendEnergyTab') drawPendulumEnergyGraph();
  else if (activeTab === 'pendPhaseTab') drawPhaseSpaceGraph();

  drawPendulumScene();
  updatePendulumResults();

  pendulumAnimationId = requestAnimationFrame(animatePendulum);
}

function drawPendulumScene() {
  const canvas = document.getElementById('pendulumCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;

  ctx.clearRect(0, 0, width, height);

  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, '#1a1a2e');
  bgGradient.addColorStop(1, '#16213e');
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  const pivotX = width / 2;
  const pivotY = height * 0.25;

  const scale = Math.min(width, height) * 0.15;

  // Pivot support
  ctx.beginPath();
  ctx.moveTo(pivotX - 20, pivotY - 5);
  ctx.lineTo(pivotX + 20, pivotY - 5);
  ctx.lineTo(pivotX, pivotY + 5);
  ctx.closePath();
  ctx.fillStyle = '#888';
  ctx.fill();

  // Trace points
  if (pendulumTraceEnabled && pendulumTracePoints.length > 1) {
    ctx.beginPath();
    for (let i = 0; i < pendulumTracePoints.length; i++) {
      const px = pivotX + pendulumTracePoints[i].x * scale;
      const py = pivotY - pendulumTracePoints[i].y * scale;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.strokeStyle = 'rgba(255, 107, 107, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Single pendulum drawing
  const bobX = pivotX + singlePendulum.length * Math.sin(singlePendulum.angle) * scale;
  const bobY = pivotY + singlePendulum.length * Math.cos(singlePendulum.angle) * scale;

  // Rod
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(bobX, bobY);
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Bob
  const bobRadius = 15 + singlePendulum.mass * 5;
  ctx.beginPath();
  ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
  const bobGradient = ctx.createRadialGradient(bobX - 3, bobY - 3, 2, bobX, bobY, bobRadius);
  bobGradient.addColorStop(0, '#ff8a8a');
  bobGradient.addColorStop(1, '#ff6b6b');
  ctx.fillStyle = bobGradient;
  ctx.fill();
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Info panel
  drawPendulumInfo(ctx, width, height);
}

// Info panel
function drawPendulumInfo(ctx, width, height) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(10, 10, 220, 80);

  ctx.fillStyle = '#fff';
  ctx.font = '14px Arial';

  ctx.fillText(`Time: ${singlePendulum.time.toFixed(2)} s`, 20, 30);
  ctx.fillText(`Angle: ${(singlePendulum.angle * 180 / Math.PI).toFixed(2)}°`, 20, 50);
  ctx.fillText(`Angular Vel.: ${singlePendulum.angularVelocity.toFixed(3)} rad/s`, 20, 70);
}

// Update results
function updatePendulumResults() {
  const resultsDiv = document.getElementById('pendResults');
  if (!resultsDiv || pendulumDataPoints.length === 0) return;

  const lastData = pendulumDataPoints[pendulumDataPoints.length - 1];
  const tableAngle = singlePendulum.tableAngle;
  const gravity = singlePendulum.gravity;
  const effectiveGravity = gravity * Math.sin((tableAngle * Math.PI) / 180);

  // Period calculation (small angle approximation)
  const theoreticalPeriod = 2 * Math.PI * Math.sqrt(singlePendulum.length / effectiveGravity);

  resultsDiv.innerHTML = `
    <table class="results-table">
      <tr><th>Parameter</th><th>Value</th></tr>
      <tr><td>Elapsed Time</td><td>${lastData.time.toFixed(3)} s</td></tr>
      <tr><td>Current Angle (θ)</td><td>${(lastData.angle1 * 180 / Math.PI).toFixed(2)}°</td></tr>
      <tr><td>Angular Velocity (ω)</td><td>${lastData.angularVelocity1.toFixed(4)} rad/s</td></tr>
      <tr><td>Kinetic Energy</td><td>${lastData.kineticEnergy.toFixed(4)} J</td></tr>
      <tr><td>Potential Energy</td><td>${lastData.potentialEnergy.toFixed(4)} J</td></tr>
      <tr><td>Total Energy</td><td>${lastData.totalEnergy.toFixed(4)} J</td></tr>
      <tr><td>Table Angle</td><td>${tableAngle}°</td></tr>
      <tr><td>Effective g</td><td>${effectiveGravity.toFixed(3)} m/s²</td></tr>
      <tr><td>Theoretical Period (small angle)</td><td>${theoreticalPeriod.toFixed(3)} s</td></tr>
    </table>
  `;
}

// Angle-Time graph
function drawAngleGraph() {
  const canvas = document.getElementById('pendAngleCanvas');
  if (!canvas || pendulumDataPoints.length < 2) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  const times = pendulumDataPoints.map(d => d.time);
  const maxTime = Math.max(...times);

  // Show in degrees (user-friendly)
  const angles1 = pendulumDataPoints.map(d => d.angle1 * 180 / Math.PI);

  const minAngle = Math.min(...angles1);
  const maxAngle = Math.max(...angles1);

  // Symmetric axis
  const absMax = Math.max(Math.abs(minAngle), Math.abs(maxAngle));
  const displayMin = -absMax;
  const displayMax = absMax;
  const angleRange = 2 * absMax || 1;

  // Axes
  drawGraphAxes(ctx, width, height, padding, 'Time (s)', 'Angle (°)', maxTime, displayMin, displayMax);

  // Zero line
  const zeroY = height - padding - ((0 - displayMin) / angleRange) * (height - 2 * padding);
  ctx.beginPath();
  ctx.moveTo(padding, zeroY);
  ctx.lineTo(width - padding, zeroY);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Line graph
  ctx.beginPath();
  for (let i = 0; i < pendulumDataPoints.length; i++) {
    const x = padding + (times[i] / maxTime) * (width - 2 * padding);
    const y = height - padding - ((angles1[i] - displayMin) / angleRange) * (height - 2 * padding);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Angular Velocity-Time graph
function drawAngularVelocityGraph() {
  const canvas = document.getElementById('pendVelocityCanvas');
  if (!canvas || pendulumDataPoints.length < 2) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  const times = pendulumDataPoints.map(d => d.time);
  const maxTime = Math.max(...times);

  const velocities1 = pendulumDataPoints.map(d => d.angularVelocity1);

  const minVel = Math.min(...velocities1);
  const maxVel = Math.max(...velocities1);

  // Symmetric axis
  const absMax = Math.max(Math.abs(minVel), Math.abs(maxVel));
  const displayMin = -absMax;
  const displayMax = absMax;
  const velRange = 2 * absMax || 1;

  drawGraphAxes(ctx, width, height, padding, 'Time (s)', 'Angular Velocity (rad/s)', maxTime, displayMin, displayMax);

  // Zero line
  const zeroY = height - padding - ((0 - displayMin) / velRange) * (height - 2 * padding);
  ctx.beginPath();
  ctx.moveTo(padding, zeroY);
  ctx.lineTo(width - padding, zeroY);
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.setLineDash([5, 5]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Line graph
  ctx.beginPath();
  for (let i = 0; i < pendulumDataPoints.length; i++) {
    const x = padding + (times[i] / maxTime) * (width - 2 * padding);
    const y = height - padding - ((velocities1[i] - displayMin) / velRange) * (height - 2 * padding);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Energy-Time graph
function drawPendulumEnergyGraph() {
  const canvas = document.getElementById('pendEnergyCanvas');
  if (!canvas || pendulumDataPoints.length < 2) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  const times = pendulumDataPoints.map(d => d.time);
  const kineticEnergies = pendulumDataPoints.map(d => d.kineticEnergy);
  const potentialEnergies = pendulumDataPoints.map(d => d.potentialEnergy);
  const totalEnergies = pendulumDataPoints.map(d => d.totalEnergy);

  const maxTime = Math.max(...times);
  const allEnergies = [...kineticEnergies, ...potentialEnergies, ...totalEnergies];
  const maxEnergy = Math.max(...allEnergies);
  const minEnergy = Math.min(...allEnergies, 0);
  const energyRange = (maxEnergy - minEnergy) || 1;

  drawGraphAxes(ctx, width, height, padding, 'Time (s)', 'Energy (J)', maxTime, minEnergy, maxEnergy);

  // Zero line (if there are negative energies)
  if (minEnergy < 0) {
    const zeroY = height - padding - ((0 - minEnergy) / energyRange) * (height - 2 * padding);
    ctx.beginPath();
    ctx.moveTo(padding, zeroY);
    ctx.lineTo(width - padding, zeroY);
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Kinetic energy (red)
  ctx.beginPath();
  for (let i = 0; i < pendulumDataPoints.length; i++) {
    const x = padding + (times[i] / maxTime) * (width - 2 * padding);
    const y = height - padding - ((kineticEnergies[i] - minEnergy) / energyRange) * (height - 2 * padding);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#e74c3c';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Potential energy (blue)
  ctx.beginPath();
  for (let i = 0; i < pendulumDataPoints.length; i++) {
    const x = padding + (times[i] / maxTime) * (width - 2 * padding);
    const y = height - padding - ((potentialEnergies[i] - minEnergy) / energyRange) * (height - 2 * padding);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#3498db';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Total energy (green) - should be conserved!
  ctx.beginPath();
  for (let i = 0; i < pendulumDataPoints.length; i++) {
    const x = padding + (times[i] / maxTime) * (width - 2 * padding);
    const y = height - padding - ((totalEnergies[i] - minEnergy) / energyRange) * (height - 2 * padding);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#27ae60';
  ctx.lineWidth = 2;
  ctx.stroke();

  drawLegend(ctx, width, padding, ['Kinetic (K)', 'Potential (U)', 'Total (E)'], ['#e74c3c', '#3498db', '#27ae60']);

  // Energy conservation check
  if (totalEnergies.length > 10) {
    const initialE = totalEnergies[0];
    const finalE = totalEnergies[totalEnergies.length - 1];
    const drift = Math.abs((finalE - initialE) / initialE) * 100;

    if (drift > 1) {
      ctx.fillStyle = '#e74c3c';
      ctx.font = '11px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(`⚠ Energy drift: ${drift.toFixed(2)}%`, padding + 5, height - padding - 10);
    }
  }
}

// Phase space graph (θ vs ω)
function drawPhaseSpaceGraph() {
  const canvas = document.getElementById('pendPhaseCanvas');
  if (!canvas || pendulumDataPoints.length < 2) return;

  const ctx = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const padding = 50;

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, width, height);

  // Single pendulum: θ vs ω graph
  const angles = pendulumDataPoints.map(d => d.angle1);
  const velocities = pendulumDataPoints.map(d => d.angularVelocity1);

  const minAngle = Math.min(...angles);
  const maxAngle = Math.max(...angles);
  const minVel = Math.min(...velocities);
  const maxVel = Math.max(...velocities);

  // Symmetric axis
  const absMaxAngle = Math.max(Math.abs(minAngle), Math.abs(maxAngle));
  const absMaxVel = Math.max(Math.abs(minVel), Math.abs(maxVel));

  const angleRange = 2 * absMaxAngle || 1;
  const velRange = 2 * absMaxVel || 1;

  // Axes (in radians)
  drawPhaseAxes(ctx, width, height, padding, 'θ (rad)', 'ω (rad/s)', -absMaxAngle, absMaxAngle, -absMaxVel, absMaxVel);

  // Phase trajectory
  ctx.beginPath();
  for (let i = 0; i < pendulumDataPoints.length; i++) {
    const x = padding + ((angles[i] + absMaxAngle) / angleRange) * (width - 2 * padding);
    const y = height - padding - ((velocities[i] + absMaxVel) / velRange) * (height - 2 * padding);

    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = '#ff6b6b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Current state point
  const lastAngle = angles[angles.length - 1];
  const lastVel = velocities[velocities.length - 1];
  const x = padding + ((lastAngle + absMaxAngle) / angleRange) * (width - 2 * padding);
  const y = height - padding - ((lastVel + absMaxVel) / velRange) * (height - 2 * padding);

  ctx.beginPath();
  ctx.arc(x, y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#c0392b';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Phase space axes (origin centered)
function drawPhaseAxes(ctx, width, height, padding, xLabel, yLabel, minX, maxX, minY, maxY) {
  const plotWidth = width - 2 * padding;
  const plotHeight = height - 2 * padding;

  // Frame
  ctx.strokeStyle = '#ddd';
  ctx.lineWidth = 1;
  ctx.strokeRect(padding, padding, plotWidth, plotHeight);

  // Origin lines (θ=0 and ω=0)
  const originX = padding + ((-minX) / (maxX - minX)) * plotWidth;
  const originY = height - padding - ((-minY) / (maxY - minY)) * plotHeight;

  ctx.strokeStyle = '#bbb';
  ctx.setLineDash([5, 5]);

  // Horizontal line (ω = 0)
  ctx.beginPath();
  ctx.moveTo(padding, originY);
  ctx.lineTo(width - padding, originY);
  ctx.stroke();

  // Vertical line (θ = 0)
  ctx.beginPath();
  ctx.moveTo(originX, padding);
  ctx.lineTo(originX, height - padding);
  ctx.stroke();

  ctx.setLineDash([]);

  // Labels
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(xLabel, width / 2, height - 10);

  ctx.save();
  ctx.translate(12, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // Axis values
  ctx.font = '10px Arial';
  ctx.textAlign = 'right';
  ctx.fillText(maxY.toFixed(2), padding - 3, padding + 10);
  ctx.fillText(minY.toFixed(2), padding - 3, height - padding);

  ctx.textAlign = 'center';
  ctx.fillText(minX.toFixed(2), padding, height - padding + 12);
  ctx.fillText(maxX.toFixed(2), width - padding, height - padding + 12);
}

// Graph axes
function drawGraphAxes(ctx, width, height, padding, xLabel, yLabel, maxX, minY, maxY, minX = 0) {
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 1;

  // Y axis
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, height - padding);
  ctx.stroke();

  // X axis
  ctx.beginPath();
  ctx.moveTo(padding, height - padding);
  ctx.lineTo(width - padding, height - padding);
  ctx.stroke();

  // Labels
  ctx.fillStyle = '#333';
  ctx.font = '12px Arial';
  ctx.textAlign = 'center';
  ctx.fillText(xLabel, width / 2, height - 10);

  ctx.save();
  ctx.translate(15, height / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText(yLabel, 0, 0);
  ctx.restore();

  // Values
  ctx.textAlign = 'right';
  ctx.fillText(maxY.toFixed(2), padding - 5, padding + 10);
  ctx.fillText(minY.toFixed(2), padding - 5, height - padding);

  ctx.textAlign = 'center';
  ctx.fillText(minX.toFixed(1), padding, height - padding + 15);
  ctx.fillText(maxX.toFixed(1), width - padding, height - padding + 15);
}

// Legend
function drawLegend(ctx, width, padding, labels, colors) {
  const legendX = width - padding - 100;
  const legendY = padding + 10;

  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fillRect(legendX - 10, legendY - 5, 110, labels.length * 20 + 10);
  ctx.strokeStyle = '#ddd';
  ctx.strokeRect(legendX - 10, legendY - 5, 110, labels.length * 20 + 10);

  labels.forEach((label, i) => {
    ctx.fillStyle = colors[i];
    ctx.fillRect(legendX, legendY + i * 20, 15, 10);
    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, legendX + 20, legendY + i * 20 + 10);
  });
}

// Toggle trace mode
function togglePendulumTrace() {
  pendulumTraceEnabled = !pendulumTraceEnabled;
  const btn = document.getElementById('pendTraceButton');
  if (btn) {
    btn.style.backgroundColor = pendulumTraceEnabled ? '#4c91cd' : '';
  }
  if (!pendulumTraceEnabled) {
    pendulumTracePoints = [];
  }
}

// Reset
function resetPendulum() {
  if (pendulumAnimationId) {
    cancelAnimationFrame(pendulumAnimationId);
    pendulumAnimationId = null;
  }

  // Reset values
  singlePendulum.angle = (parseFloat(document.getElementById('pendAngle1Input')?.value || 45) * Math.PI) / 180;
  singlePendulum.angularVelocity = 0;
  singlePendulum.time = 0;

  pendulumDataPoints = [];
  pendulumTracePoints = [];

  drawPendulumScene();

  // Clear results
  const resultsDiv = document.getElementById('pendResults');
  if (resultsDiv) {
    resultsDiv.innerHTML = '<p>Results will be displayed when the experiment starts.</p>';
  }

  // Clear graphs
  ['pendAngleCanvas', 'pendVelocityCanvas', 'pendEnergyCanvas', 'pendPhaseCanvas'].forEach(id => {
    const canvas = document.getElementById(id);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
  });
}

// Save graph
function savePendulumGraph() {
  const activeTab = document.querySelector('#pendulum-experiment .tab-pane.active');
  if (!activeTab) return;

  const canvas = activeTab.querySelector('canvas');
  if (!canvas) return;

  const link = document.createElement('a');
  link.download = `pendulum_graph_${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('pendStartButton')?.addEventListener('click', startPendulum);
  document.getElementById('pendResetButton')?.addEventListener('click', resetPendulum);
  document.getElementById('pendTraceButton')?.addEventListener('click', togglePendulumTrace);
  document.getElementById('pendSaveGraphBtn')?.addEventListener('click', savePendulumGraph);
  document.getElementById('pendTableAngleInput')?.addEventListener('input', handlePendTableAngleInput);
  setupPendulumTabs();
});
