let ffAnimationId = null;
let ffStartTime = 0;
let ffObject = null;
let ffDataPoints = [];
let ffBouncing = false; 
let ffVelocity = 0;
let ffDirection = 1; // 1: aşağı, -1: yukarı

document.getElementById('ffStartButton').addEventListener('click', startFreeFall);
document.getElementById('ffResetButton').addEventListener('click', resetFreeFall);
document.getElementById('ffSaveGraphBtn').addEventListener('click', saveFreeFallGraph);

function startFreeFall() {
  const ffmass = parseFloat(document.getElementById('ffMassInput').value);
  const height = parseFloat(document.getElementById('ffHeightInput').value);
  const gravAccel = parseFloat(document.getElementById('ffGravityInput').value);
  const energyLoss = parseFloat(document.getElementById('ffEnergyLossInput').value) / 100;
  const bouncingEnabled = document.getElementById('ffBouncingCheckbox').checked;
  
  if (isNaN(ffmass) || ffmass <= 0) return alert(t('alerts.invalidMass'));
  if (isNaN(height) || height <= 0) return alert(t('alerts.invalidHeight'));
  if (isNaN(gravAccel) || gravAccel <= 0) return alert(t('alerts.invalidGravity'));
  
  ffObject = {
    ffmass: ffmass,
    height: height,
    gravAccel: gravAccel,
    y: 0, 
    radius: 20, 
    time: 0,
    energyLoss: energyLoss,
    bouncingEnabled: bouncingEnabled,
    initialHeight: height 
  };
  
  ffDataPoints = [];
  ffStartTime = performance.now();
  ffVelocity = 0;
  ffDirection = 1; // Başlangıçta aşağıya doğru
  ffBouncing = false;
  
  animateFreeFall();
}

function animateFreeFall() {
  const ffCanvas = document.getElementById('freefallCanvas');
  const ffCtx = ffCanvas.getContext('2d');
  
  // Ölçeklendirme faktörlerini hesapla
  const groundY = ffCanvas.height - 100;
  const startY = 100;
  const availableHeight = groundY - startY;
  const pixelsPerMeter = availableHeight / ffObject.initialHeight;
  
  const currentTime = performance.now();
  const elapsedTimeMs = currentTime - ffStartTime;
  const elapsedTime = elapsedTimeMs / 1000; // Saniyeye dönüştür
  ffObject.time = elapsedTime;
  
  if (!ffBouncing) {
    const distance = 0.5 * ffObject.gravAccel * Math.pow(elapsedTime, 2);
    ffVelocity = ffObject.gravAccel * elapsedTime;
    
    if (distance >= ffObject.height) {
      ffObject.y = groundY - ffObject.radius;
      
      if (ffObject.bouncingEnabled) {
        // Sıçrama başlat
        ffBouncing = true;
        ffStartTime = performance.now();
        ffVelocity = Math.sqrt(2 * ffObject.gravAccel * ffObject.height) * Math.sqrt(1 - ffObject.energyLoss);
        ffDirection = -1; // Yukarı yön
      } else {
        drawFreeFallScene();
        showFreeFallResults(ffObject.height, elapsedTime);
        return;
      }
    } else {
      ffObject.y = startY + (distance * pixelsPerMeter);
    }
  } else {
    const t = elapsedTime;
    
    if (ffDirection === -1) {
      // y = v0t - 1/2gt^2
      const height = (ffVelocity * t) - (0.5 * ffObject.gravAccel * Math.pow(t, 2));
            ffObject.y = groundY - ffObject.radius - (height * pixelsPerMeter);
      
      // Anlık hızı hesapla: v = v0 - gt
      const currentVelocity = ffVelocity - (ffObject.gravAccel * t);
      
      // Tepe noktasını kontrol et (hız 0'a ulaştığında)
      if (currentVelocity <= 0) {
        ffDirection = 1; 
        ffStartTime = performance.now(); // Zamanı sıfırla
        ffVelocity = 0;
      }
    } else {
      const fallDistance = 0.5 * ffObject.gravAccel * Math.pow(t, 2);
      ffObject.y = (groundY - ffObject.radius) - (ffVelocity * t * pixelsPerMeter) + (fallDistance * pixelsPerMeter);
      
      // Zemine çarpma kontrolü
      if (ffObject.y >= groundY - ffObject.radius) {
        // Zemindeki konumu düzelt
        ffObject.y = groundY - ffObject.radius;
        
        ffVelocity = ffObject.gravAccel * t;
        
        // Enerji çok düştüyse durdur
        if (ffVelocity < 0.5 || ffVelocity * Math.sqrt(1 - ffObject.energyLoss) < 0.1) {
          drawFreeFallScene();
          showFreeFallResults(ffObject.height, ffObject.time);
          return;
        }
        
        // Yeni sıçrama başlat
        ffStartTime = performance.now();
        ffVelocity = ffVelocity * Math.sqrt(1 - ffObject.energyLoss);
        ffDirection = -1; // Yukarı yön
      }
    }
  }
  
  const currentHeightMeters = ((groundY - ffObject.y - ffObject.radius) / pixelsPerMeter);
  ffDataPoints.push({ time: ffObject.time, position: Math.max(0, currentHeightMeters) });
  
  drawFreeFallScene();
  drawFreeFallGraph();
  
  ffAnimationId = requestAnimationFrame(animateFreeFall);
}

function drawFreeFallScene() {
  const ffCanvas = document.getElementById('freefallCanvas');
  const ffCtx = ffCanvas.getContext('2d');
  ffCtx.clearRect(0, 0, ffCanvas.width, ffCanvas.height);
  
  // Ölçeklendirme faktörleri
  const groundY = ffCanvas.height - 100;
  const startY = 100;
  const availableHeight = groundY - startY;
  const pixelsPerMeter = availableHeight / ffObject.initialHeight;
  
  // Zemini çiz
  ffCtx.fillStyle = '#333';
  ffCtx.fillRect(ffCanvas.width/2 - 200, groundY, 400, 10);
  
  // Nesneyi çiz
  ffCtx.beginPath();
  ffCtx.arc(ffCanvas.width/2, ffObject.y, ffObject.radius, 0, 2 * Math.PI);
  ffCtx.fillStyle = '#577590';
  ffCtx.fill();
  ffCtx.stroke();
  
  // Kesikli çizgi ile yörüngeyi göster
  ffCtx.beginPath();
  ffCtx.setLineDash([5, 5]);
  ffCtx.moveTo(ffCanvas.width/2, startY);
  ffCtx.lineTo(ffCanvas.width/2, groundY);
  ffCtx.strokeStyle = '#999';
  ffCtx.stroke();
  ffCtx.setLineDash([]);
  
  // Bilgileri ekranda göster
  ffCtx.fillStyle = '#000';
  ffCtx.font = '16px Arial';
  ffCtx.textAlign = 'left';
  ffCtx.fillText(`Time: ${ffObject.time.toFixed(2)} s`, 50, 50);
  
  // Yükseklik hesaplaması 
  const currentHeight = ((groundY - ffObject.y - ffObject.radius) / pixelsPerMeter).toFixed(2);
  ffCtx.fillText(`Height: ${currentHeight} m`, 50, 80);
  
  // Hız  
  const velocity = ffVelocity * (ffDirection == 1 ? 1 : -1);
  ffCtx.fillText(`Velocity: ${velocity.toFixed(2)} m/s`, 50, 110);
  
  // Enerji 
  const potentialEnergy = ffObject.ffmass * ffObject.gravAccel * parseFloat(currentHeight);
  const kineticEnergy = 0.5 * ffObject.ffmass * Math.pow(ffVelocity, 2);
  ffCtx.fillText(`PE: ${potentialEnergy.toFixed(2)} J`, 50, 140);
  ffCtx.fillText(`KE: ${kineticEnergy.toFixed(2)} J`, 50, 170);
}

function drawFreeFallGraph() {
  const ffGraphCanvas = document.getElementById('ffGraphCanvas');
  const ffGraphCtx = ffGraphCanvas.getContext('2d');
  ffGraphCtx.clearRect(0, 0, ffGraphCanvas.width, ffGraphCanvas.height);
  
  const padding = 40;
  const graphWidth = ffGraphCanvas.width - (padding * 2);
  const graphHeight = ffGraphCanvas.height - (padding * 2);
  
  // Eksenleri çiz
  ffGraphCtx.beginPath();
  ffGraphCtx.moveTo(padding, padding);
  ffGraphCtx.lineTo(padding, ffGraphCanvas.height - padding);
  ffGraphCtx.lineTo(ffGraphCanvas.width - padding, ffGraphCanvas.height - padding);
  ffGraphCtx.stroke();
  
  // Etiketleri çiz
  ffGraphCtx.fillStyle = '#000';
  ffGraphCtx.font = '12px Arial';
  ffGraphCtx.textAlign = 'center';
  ffGraphCtx.fillText('Time (s)', ffGraphCanvas.width / 2, ffGraphCanvas.height - 10);
  
  ffGraphCtx.save();
  ffGraphCtx.translate(15, ffGraphCanvas.height / 2);
  ffGraphCtx.rotate(-Math.PI / 2);
  ffGraphCtx.fillText('Height (m)', 0, 0);
  ffGraphCtx.restore();
  
  if (ffDataPoints.length < 2) return;
  
  // Ölçekleri hesapla
  const maxTime = Math.max(...ffDataPoints.map(p => p.time));
  const maxPosition = Math.max(...ffDataPoints.map(p => p.position));
  
  const timeScale = graphWidth / (maxTime || 1);
  const positionScale = graphHeight / (ffObject.initialHeight || 1);
  
  // Veri noktalarını çiz
  ffGraphCtx.beginPath();
  ffGraphCtx.moveTo(
    padding + (ffDataPoints[0].time * timeScale),
    ffGraphCanvas.height - padding - (ffDataPoints[0].position * positionScale)
  );
  
  for (let i = 1; i < ffDataPoints.length; i++) {
    ffGraphCtx.lineTo(
      padding + (ffDataPoints[i].time * timeScale),
      ffGraphCanvas.height - padding - (ffDataPoints[i].position * positionScale)
    );
  }
  
  ffGraphCtx.strokeStyle = '#007acc';
  ffGraphCtx.lineWidth = 2;
  ffGraphCtx.stroke();
  
  // Zaman aralıkları ve ölçek çizgileri
  const timediff = Math.ceil(maxTime / 5 * 10) / 10; // En fazla 5 aralık 
  for (let t = 0; t <= maxTime; t += timediff) {
    const x = padding + t * timeScale;
    
    // Çizgi
    ffGraphCtx.beginPath();
    ffGraphCtx.moveTo(x, ffGraphCanvas.height - padding);
    ffGraphCtx.lineTo(x, ffGraphCanvas.height - padding + 5);
    ffGraphCtx.stroke();
    
    // Etiket
    ffGraphCtx.fillText(t.toFixed(1), x, ffGraphCanvas.height - padding + 20);
  }
  
  // Yükseklik aralıkları
  const heightInterval = Math.ceil(ffObject.initialHeight / 5);
  for (let h = 0; h <= ffObject.initialHeight; h += heightInterval) {
    const y = ffGraphCanvas.height - padding - h * positionScale;
    
    // Çizgi
    ffGraphCtx.beginPath();
    ffGraphCtx.moveTo(padding - 5, y);
    ffGraphCtx.lineTo(padding, y);
    ffGraphCtx.stroke();
    
    // Etiket
    ffGraphCtx.textAlign = 'right';
    ffGraphCtx.fillText(h.toFixed(1), padding - 10, y + 4);
  }
}

function showFreeFallResults(distance, time) {
  const resultsDiv = document.getElementById('ffResults');
  const velocity = ffObject.gravAccel * time;
  const potentialEnergy = ffObject.ffmass * ffObject.gravAccel * distance;
  const kineticEnergy = 0.5 * ffObject.ffmass * Math.pow(ffVelocity, 2);
  const totalEnergy = potentialEnergy + kineticEnergy;
  
  const energyLossPercent = ffObject.bouncingEnabled ? 
    (ffObject.energyLoss * 100).toFixed(0) : "0";
  
  resultsDiv.innerHTML = `
    <p><strong>Duration:</strong> ${time.toFixed(2)} s</p>
    <p><strong>Final Velocity:</strong> ${ffVelocity.toFixed(2)} m/s</p>
    <p><strong>Energy:</strong></p>
    <p>Potential Energy (initial): ${(ffObject.ffmass * ffObject.gravAccel * ffObject.initialHeight).toFixed(2)} J</p>
    <p>Kinetic Energy (final): ${kineticEnergy.toFixed(2)} J</p>
    <p>Potential Energy (final): ${potentialEnergy.toFixed(2)} J</p>
    <p>Total Energy (final): ${totalEnergy.toFixed(2)} J</p>
    <p>Energy Loss: ${energyLossPercent}%</p>
  `;
}

function resetFreeFall() {
  if (ffAnimationId) {
    cancelAnimationFrame(ffAnimationId);
    ffAnimationId = null;
  }
  
  ffObject = null;
  ffDataPoints = [];
  ffBouncing = false;
  
  const ffCanvas = document.getElementById('freefallCanvas');
  const ffCtx = ffCanvas.getContext('2d');
  const ffGraphCanvas = document.getElementById('ffGraphCanvas');
  const ffGraphCtx = ffGraphCanvas.getContext('2d');
  
  ffCtx.clearRect(0, 0, ffCanvas.width, ffCanvas.height);
  ffGraphCtx.clearRect(0, 0, ffGraphCanvas.width, ffGraphCanvas.height);

  document.getElementById('ffResults').innerHTML = `
    <p>Results will be displayed when the experiment starts.</p>
  `;
}

function saveFreeFallGraph() {
  const ffGraphCanvas = document.getElementById('ffGraphCanvas');
  const imageDataURL = ffGraphCanvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = imageDataURL;
  link.download = "freefall-graph.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
    function showExperiment(experimentId) {
      document.querySelectorAll('.navbar-item').forEach(item => {
        item.classList.remove('active');
      });
      
      if (experimentId === 'home') {
        document.querySelector('.navbar-item:nth-child(1)').classList.add('active');
      } else if (experimentId === 'collision') {
        document.querySelector('.navbar-item:nth-child(2)').classList.add('active');
      } else if (experimentId === 'freefall') {
        document.querySelector('.navbar-item:nth-child(3)').classList.add('active');
      } else if (experimentId === 'projectile') {
        document.querySelector('.navbar-item:nth-child(4)').classList.add('active');
      } else if (experimentId === 'pendulum') {
        document.querySelector('.navbar-item:nth-child(5)').classList.add('active');
      }
      
      document.querySelectorAll('.experiment').forEach(exp => {
        exp.classList.remove('active');
      });
      
      document.getElementById(experimentId + '-experiment').classList.add('active');
      
      if (experimentId !== 'collision') {
        if (pathRecordInterval) {
          clearInterval(pathRecordInterval);
          pathRecordInterval = null;
        }
      }
      
      if (experimentId !== 'freefall') {
        if (ffAnimationId) {
          cancelAnimationFrame(ffAnimationId);
          ffAnimationId = null;
        }
      }
      
      if (experimentId !== 'projectile') {
        if (pmAnimationId) {
          cancelAnimationFrame(pmAnimationId);
          pmAnimationId = null;
        }
      }
      
      if (experimentId !== 'pendulum') {
        if (typeof pendulumAnimationId !== 'undefined' && pendulumAnimationId) {
          cancelAnimationFrame(pendulumAnimationId);
          pendulumAnimationId = null;
        }
      }
    }