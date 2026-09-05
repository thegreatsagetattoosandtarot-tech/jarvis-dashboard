// WiFi Radar JavaScript
document.addEventListener('DOMContentLoaded', function() {
    const canvas = document.getElementById('radarCanvas');
    const ctx = canvas.getContext('2d');
    const statusPanel = document.getElementById('statusPanel');
    
    // Initialize radar canvas
    function resizeCanvas() {
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    // Draw gradient background
    const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2
    );
    gradient.addColorStop(0, 'rgba(52, 152, 219, 0.4)');
    gradient.addColorStop(0.5, 'rgba(52, 152, 219, 0.1)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw circle
    ctx.beginPath();
    ctx.arc(canvas.width / 2, canvas.height / 2, Math.min(canvas.width, canvas.height) / 2 - 20, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Update status display
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status';
    statusDiv.innerHTML = 'Calibration required - 60 seconds';
    statusDiv.setAttribute('data-calibration', 'true');
    statusDiv.setAttribute('data-sensitivity', '50');
    document.querySelector('.settings-sidebar').appendChild(statusDiv);
    
    // Calibration handler
    const calibrateBtn = document.createElement('button');
    calibrateBtn.className = 'control-select';
    calibrateBtn.style.width = '100%';
    calibrateBtn.style.padding = '0.5rem';
    calibrateBtn.style.background = '#27ae60';
    calibrateBtn.innerHTML = 'Start Calibration';
    calibrateBtn.addEventListener('click', function() {
        fetch('/api/calibrate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                samples: Array.from({length: 200}, () => {
                    // Synthetic RSSI samples centered around -48 dBm
                    return (-48 + Math.random() * 4).toFixed(2)
                })
            })
        })
        .then(response => response.json())
        .then(data => {
            const statusDiv = document.querySelector('.status');
            if (data.success) {
                if (statusDiv) {
                    statusDiv.innerHTML = `Calibration complete - baseline ${data.baseline.toFixed(1)} dBm`;
                    statusDiv.setAttribute('data-calibrated', 'true');
                }
                // Update calibration tile
                const calTile = document.getElementById('valueCalibration');
                if (calTile) calTile.innerHTML = `Calibrated ${data.baseline.toFixed(1)} dBm`;
            } else {
                if (statusDiv) {
                    statusDiv.innerHTML = `Calibration failed: ${data.error}`;
                }
            }
        })
        .catch(error => {
            if (statusDiv) {
                statusDiv.innerHTML = 'Calibration error';
            }
        });
    });
    document.querySelector('.controls').appendChild(calibrateBtn);
    
    // Sensitivity control
    const sensitivityDiv = document.createElement('div');
    sensitivityDiv.innerHTML = 'Sensitivity: <span id="sensitivityValue">50%</span>';
    document.querySelector('.controls').appendChild(sensitivityDiv);
});
