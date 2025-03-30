let prizes = [];
let chart;
let isSpinning = false;
let blinkInterval;
let spinAudio;
let winAudio;
let playerInfo = null;
let programName = '';
let hasSpun = false;
let userId = '';
let token = '';

function preloadAudio() {
    spinAudio = new Audio('sounds/spin.mp3');
    spinAudio.volume = 0.5;
    spinAudio.preload = 'auto';
    
    winAudio = new Audio('sounds/clap.mp3');
    winAudio.volume = 0.7;
    winAudio.preload = 'auto';
    
    console.log('Preloading audio files...');
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = window.innerWidth < 768 ? 30 : 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 15 + 5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        
        const hue = Math.random() * 60 + 100;
        particle.style.backgroundColor = `hsla(${hue}, 70%, 60%, ${Math.random() * 0.4 + 0.1})`;
        
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * -20;
        particle.style.animation = `float ${duration}s linear ${delay}s infinite`;
        
        particlesContainer.appendChild(particle);
    }
}

async function fetchData() {
    const masterApiUrl = 'https://script.google.com/macros/s/AKfycbz5OeqNxEmWUgny-3u0z6gpZWYHeL2hA1q478YfM-fwATtTnSxqFu_VZBCLBnJBB4c/exec';
    
    try {
        showLoading();
        const response = await fetch(`${masterApiUrl}?userId=${userId}&token=${token}`, {
            method: 'GET',
            redirect: 'follow'
        });
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        const dataWithoutHeader = data.slice(1);
        prizes = dataWithoutHeader
            .filter(row => row[1] && row[2])
            .map(row => ({
                program: row[0] || '',
                name: row[1] || 'Không xác định',
                quantity: parseInt(row[2]) || 0,
                image: row[3] || '',
                color: row[4] || '',
                logo: row[5] || '',
                background: row[6] || '',
                companyLogo: row[7] || '',
                hashtag: row[8] || '',
                fbPage: row[9] || '',
                fbPost: row[10] || '',
                requirePlayerInfo: row[11] || 'no'
            }));

        if (prizes.length === 0) {
            throw new Error('Không có dữ liệu giải thưởng hợp lệ');
        }

        console.log('Dữ liệu từ Google Sheet:', prizes);
        programName = prizes[0].program;
        updateUI();
        initWheel();
        hideLoading();

        if (prizes[0].requirePlayerInfo.toLowerCase() === 'yes') {
            showPlayerInfoModal();
        } else {
            document.getElementById('spin-btn').disabled = false;
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        hideLoading();
        showNotification(`Không thể tải dữ liệu: ${error.message}. Vui lòng thử lại!`);
    }
}

function updateUI() {
    const programTitle = document.getElementById('program-title');
    programTitle.innerHTML = '<i class="fas fa-gift"></i> CHƯƠNG TRÌNH USER 2 Vòng Quay May Mắn <i class="fas fa-gift"></i>';
    
    const programContent = prizes[0].program;
    const isImage = programContent.startsWith('http') && (programContent.endsWith('.png') || programContent.endsWith('.jpg') || programContent.endsWith('.jpeg') || programContent.endsWith('.gif'));

    if (isImage) {
        const img = document.createElement('img');
        img.src = programContent;
        img.alt = 'Banner chương trình';
        img.style.maxWidth = '100%';
        img.style.height = 'auto';
        img.onerror = () => {
            console.warn('Không thể tải banner chương trình:', programContent);
            img.style.display = 'none';
            programTitle.innerHTML = '<i class="fas fa-gift"></i> CHƯƠNG TRÌNH USER 2 Vòng Quay May Mắn <i class="fas fa-gift"></i>';
        };
        programTitle.innerHTML = ''; // Xóa nội dung hiện tại trước khi thêm ảnh
        programTitle.appendChild(img);
    } else if (programContent && programContent.trim() !== '') {
        programTitle.innerHTML = `<i class="fas fa-gift"></i> ${programContent} <i class="fas fa-gift"></i>`;
        programTitle.style.color = prizes[0].color;
        if (prizes[0].color) {
            programTitle.style.background = `linear-gradient(135deg, ${prizes[0].color} 0%, ${lightenColor(prizes[0].color, 20)} 100%)`;
            programTitle.style.webkitBackgroundClip = 'text';
            programTitle.style.webkitTextFillColor = 'transparent';
        }
    }
    
    const sponsorLogosContainer = document.getElementById('sponsor-logos');
    sponsorLogosContainer.innerHTML = ''; // Hoàn chỉnh dòng này
    const uniqueLogos = [...new Set(prizes.map(prize => prize.logo).filter(logo => logo))];
    
    if (uniqueLogos.length > 0) {
        uniqueLogos.forEach(logo => {
            const img = document.createElement('img');
            img.src = logo.trim();
            img.alt = 'Logo nhà tài trợ';
            img.loading = 'lazy';
            img.onerror = () => {
                console.warn('Không thể tải logo:', logo);
                img.style.display = 'none';
            };
            sponsorLogosContainer.appendChild(img);
        });
    }
    
    if (prizes[0].background) {
        document.body.style.backgroundImage = `url('${prizes[0].background}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundRepeat = 'no-repeat';
    } else {
        document.body.style.backgroundImage = 'none';
        document.body.style.backgroundColor = 'var(--background)';
    }
}

function lightenColor(color, percent) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const G = (num >> 8 & 0x00FF) + amt;
    const B = (num & 0x0000FF) + amt;
    
    return `#${(
        0x1000000 +
        (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
        (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
        (B < 255 ? (B < 1 ? 0 : B) : 255)
    ).toString(16).slice(1)}`;
}

function initWheel() {
    const ctx = document.getElementById('wheel').getContext('2d');
    const availablePrizes = prizes.filter(prize => prize.quantity > 0);
    
    if (availablePrizes.length === 0) {
        showNotification('Không còn giải thưởng nào!');
        return;
    }

    if (chart) chart.destroy();
    
    const backgroundColors = generateWheelColors(availablePrizes.length);
    
    chart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: availablePrizes.map(prize => `${prize.name} (${prize.quantity})`),
            datasets: [{
                data: availablePrizes.map(() => 1),
                backgroundColor: backgroundColors,
                borderWidth: 2,
                borderColor: '#fff'
            }]
        },
        plugins: [ChartDataLabels],
        options: {
            responsive: false,
            animation: {
                duration: 0,
                onComplete: () => {
                    drawCenterLogo(ctx);
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false },
                datalabels: {
                    color: '#fff',
                    font: {
                        family: 'Poppins',
                        size: 12,
                        weight: 'bold'
                    },
                    formatter: (value, context) => {
                        const prize = availablePrizes[context.dataIndex];
                        if (!prize || !prize.name) {
                            return 'Không xác định\n(0)';
                        }
                        const name = prize.name.length > 10 ? prize.name.substring(0, 7) + '...' : prize.name;
                        return `${name}\n(${prize.quantity})`;
                    },
                    textAlign: 'center',
                    clamp: true,
                    clip: true,
                    padding: 4,
                    rotation: (context) => {
                        const index = context.dataIndex;
                        const total = context.dataset.data.length;
                        const angle = (index / total) * 360 - 90;
                        return angle;
                    },
                    anchor: 'center',
                    align: 'center'
                }
            },
            cutout: '30%',
            rotation: -90,
            circumference: 360,
            borderRadius: 10
        }
    });
}

function generateWheelColors(count) {
    const colors = [];
    const hueStep = 360 / count;
    
    for (let i = 0; i < count; i++) {
        const hue = i * hueStep;
        colors.push(`hsl(${hue}, 70%, 65%)`);
    }
    
    return colors;
}

function drawCenterLogo(ctx, isBright = false) {
    const canvas = document.getElementById('wheel');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const logoSize = Math.min(canvas.width, canvas.height) * 0.25;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, logoSize / 2 + 5, 0, Math.PI * 2);
    ctx.fillStyle = isBright ? 'hsl(60, 100%, 70%)' : '#ffffff';
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    const logoUrl = prizes.length > 0 && prizes[0].companyLogo ? prizes[0].companyLogo.trim() : 'images/logo.png';
    if (logoUrl) {
        const logoImg = new Image();
        logoImg.crossOrigin = "Anonymous";
        logoImg.src = logoUrl;

        logoImg.onload = () => {
            ctx.save();
            ctx.beginPath();
            ctx.arc(centerX, centerY, logoSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logoImg, centerX - logoSize / 2, centerY - logoSize / 2, logoSize, logoSize);
            ctx.restore();
        };

        logoImg.onerror = () => {
            console.error('Không thể tải logo công ty:', logoUrl);
            showNotification('Không thể tải logo công ty. Vui lòng kiểm tra URL hoặc dùng ảnh local!');
        };
    }
}

function startBlinkEffect(winnerIndex) {
    if (blinkInterval) clearInterval(blinkInterval);

    const ctx = document.getElementById('wheel').getContext('2d');
    const originalColors = [...chart.data.datasets[0].backgroundColor];
    let isBright = false;

    blinkInterval = setInterval(() => {
        isBright = !isBright;
        const colors = [...originalColors];
        colors[winnerIndex] = isBright ? 'hsl(60, 100%, 70%)' : originalColors[winnerIndex];
        chart.data.datasets[0].backgroundColor = colors;
        chart.update();

        drawCenterLogo(ctx, isBright);
    }, 500);
}

function stopBlinkEffect() {
    if (blinkInterval) {
        clearInterval(blinkInterval);
        blinkInterval = null;
        initWheel();
    }
}

function playSpinSound() {
    if (spinAudio) {
        spinAudio.pause();
        spinAudio.currentTime = 0;
    }
    spinAudio = new Audio('sounds/spin.mp3');
    spinAudio.volume = 0.5;
    console.log('Playing spin sound');
    spinAudio.play().then(() => {
        console.log('Spin sound started');
    }).catch(err => {
        console.error('Spin audio error:', err);
        showNotification('Không thể phát âm thanh vòng quay!');
    });
}

function stopSpinSound() {
    if (spinAudio) {
        spinAudio.pause();
        spinAudio.currentTime = 0;
        console.log('Spin sound stopped');
    }
}

function playWinSound() {
    if (winAudio) {
        winAudio.pause();
        winAudio.currentTime = 0;
    }
    winAudio = new Audio('sounds/clap.mp3');
    winAudio.volume = 0.7;
    console.log('Attempting to play clap sound');
    winAudio.play().then(() => {
        console.log('Clap sound started');
        setTimeout(() => {
            winAudio.pause();
            winAudio.currentTime = 0;
            console.log('Clap sound stopped after 5 seconds');
        }, 5000);
    }).catch(err => {
        console.error('Clap audio error:', err);
        showNotification('Không thể phát tiếng vỗ tay!');
    });
}

function showSpinning() {
    const resultText = document.getElementById('result-text');
    const resultImage = document.getElementById('result-image');
    const shareBtn = document.getElementById('share-btn');
    const retryBtn = document.getElementById('retry-btn');
    resultText.textContent = 'Đang quay...';
    resultText.style.color = '#333';
    resultText.style.fontWeight = 'normal';
    resultImage.style.display = 'none';
    shareBtn.style.display = 'none';
    retryBtn.style.display = 'none';
}

function spinWheel() {
    if (isSpinning) return;

    if (hasSpun) {
        showNotification('Bạn đã quay và có kết quả rồi! Mỗi người chỉ được quay 1 lần.');
        return;
    }

    if (prizes[0].requirePlayerInfo.toLowerCase() === 'yes') {
        if (!playerInfo || !playerInfo.followedPage || !playerInfo.likedPost) {
            showNotification('Vui lòng theo dõi trang Facebook và thích bài viết trước khi quay!');
            return;
        }

        const playedPlayers = JSON.parse(localStorage.getItem('playedPlayers') || '[]');
        if (playedPlayers.includes(playerInfo.phone)) {
            showNotification('Bạn đã tham gia quay rồi! Mỗi người chỉ được quay 1 lần.');
            return;
        }
    }

    isSpinning = true;
    
    stopBlinkEffect();
    stopSpinSound();

    const availablePrizes = prizes.filter(prize => prize.quantity > 0);
    if (availablePrizes.length === 0) {
        showNotification('Hết quà tặng!');
        isSpinning = false;
        return;
    }

    const totalQuantity = availablePrizes.reduce((sum, prize) => sum + prize.quantity, 0);
    let randomWeight = Math.random() * totalQuantity;
    let winnerIndex = 0;
    for (let i = 0; i < availablePrizes.length; i++) {
        randomWeight -= availablePrizes[i].quantity;
        if (randomWeight <= 0) {
            winnerIndex = i;
            break;
        }
    }

    const spinDuration = 18000;
    const rotations = 10;
    const anglePerSlice = 360 / availablePrizes.length;
    const targetAngle = (winnerIndex * anglePerSlice) + (rotations * 360) + (anglePerSlice / 2);

    const spinBtn = document.getElementById('spin-btn');
    spinBtn.disabled = true;
    spinBtn.classList.add('clicked');
    setTimeout(() => spinBtn.classList.remove('clicked'), 300);

    showSpinning();
    playSpinSound();

    let startTime;
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const progress = (timestamp - startTime) / spinDuration;
        const easedProgress = easeOutCubic(progress);
        
        if (progress < 1) {
            const angle = targetAngle * easedProgress;
            chart.options.rotation = angle;
            chart.update();
            requestAnimationFrame(animate);
        } else {
            chart.options.rotation = targetAngle % 360;
            chart.update();
            
            stopSpinSound();
            const winner = availablePrizes[winnerIndex];
            celebrateWin(winner);
            updateQuantity(winner);
            startBlinkEffect(winnerIndex);
            isSpinning = false;
            spinBtn.disabled = false;
            hasSpun = true;
        }
    }
    
    requestAnimationFrame(animate);
}

function easeOutCubic(t) {
    return (--t) * t * t + 1;
}

function celebrateWin(prize) {
    const confettiContainer = document.getElementById('winner-celebration');
    confettiContainer.style.display = 'block';
    
    if (typeof confetti === 'function') {
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            colors: [prize.color || '#4CAF50']
        });
    }
    
    showResult(prize);
    
    setTimeout(() => {
        confettiContainer.style.display = 'none';
    }, 3000);
}

function showResult(prize) {
    const resultText = document.getElementById('result-text');
    const resultImage = document.getElementById('result-image');
    const shareBtn = document.getElementById('share-btn');
    const retryBtn = document.getElementById('retry-btn');
    
    let message = prizes[0].requirePlayerInfo.toLowerCase() === 'yes' 
        ? `Chúc mừng ${playerInfo.name}! Bạn trúng: ${prize.name}`
        : `Chúc mừng! Bạn trúng: ${prize.name}`;
    
    resultText.innerHTML = `
        <p style="font-size: 1.4em; font-weight: bold; color: ${prize.color || '#2E7D32'}">${message}</p>
        <p style="font-size: 1.2em; color: ${prize.color || '#2E7D32'}; margin-top: 10px;">${prize.hashtag}</p>
    `;
    
    if (prize.image) {
        resultImage.src = prize.image;
        resultImage.style.display = 'block';
        resultImage.alt = `Hình ảnh ${prize.name}`;
    } else {
        resultImage.style.display = 'none';
    }
    
    resultText.style.animation = 'none';
    resultText.offsetHeight;
    resultText.style.animation = 'pulse 0.5s ease 3';

    shareBtn.style.display = 'block';
    retryBtn.style.display = 'block';
    shareBtn.onclick = () => shareResult(prize);

    playWinSound();
}

async function shareResult(prize) {
    const resultSection = document.getElementById('result');
    try {
        const canvas = await html2canvas(resultSection, {
            backgroundColor: '#ffffff',
            scale: 2
        });
        const imgData = canvas.toDataURL('image/png');
        
        const blob = await fetch(imgData).then(res => res.blob());
        const file = new File([blob], 'ket-qua-vong-quay.png', { type: 'image/png' });

        const shareText = `${programName} ${prize.hashtag} - Chúc mừng ${prizes[0].requirePlayerInfo.toLowerCase() === 'yes' ? playerInfo.name : 'bạn'} đã trúng ${prize.name}!`;
        console.log('Nội dung chia sẻ:', shareText);

        if (navigator.share) {
            await navigator.share({
                title: programName,
                text: shareText,
                files: [file]
            });
            showNotification('Đã chia sẻ thành công lên mạng xã hội!');
        } else {
            const downloadLink = document.createElement('a');
            downloadLink.href = imgData;
            downloadLink.download = 'ket-qua-vong-quay.png';
            downloadLink.click();
            showNotification('Trình duyệt không hỗ trợ chia sẻ trực tiếp. Ảnh đã được tải xuống!');
        }
    } catch (error) {
        console.error('Error sharing result:', error);
        showNotification('Không thể chia sẻ kết quả. Vui lòng thử lại!');
    }
}

async function updateQuantity(winner) {
    const masterApiUrl = 'https://script.google.com/macros/s/AKfycbz5OeqNxEmWUgny-3u0z6gpZWYHeL2hA1q478YfM-fwATtTnSxqFu_VZBCLBnJBB4c/exec';

    winner.quantity--;
    initWheel();
    
    const playedPlayers = JSON.parse(localStorage.getItem('playedPlayers') || '[]');
    if (prizes[0].requirePlayerInfo.toLowerCase() === 'yes') {
        playedPlayers.push(playerInfo.phone);
    }
    localStorage.setItem('playedPlayers', JSON.stringify(playedPlayers));

    try {
        await fetch(masterApiUrl + `?userId=${userId}&token=${token}`, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prizeName: winner.name,
                newQuantity: winner.quantity
            })
        });

        if (prizes[0].requirePlayerInfo.toLowerCase() === 'yes') {
            await fetch(masterApiUrl + `?userId=${userId}&token=${token}`, {
                method: 'POST',
                mode: 'no-cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'updatePlayerInfo',
                    playerInfo: {
                        name: playerInfo.name,
                        address: playerInfo.address,
                        phone: playerInfo.phone,
                        facebook: playerInfo.facebook || '',
                        zalo: playerInfo.zalo || '',
                        prize: winner.name,
                        followedPage: playerInfo.followedPage ? 'Yes' : 'No',
                        likedPost: playerInfo.likedPost ? 'Yes' : 'No'
                    }
                })
            });
        }

        setTimeout(fetchData, 2000);
    } catch (error) {
        console.error('Error updating quantity:', error);
        showNotification('Lỗi khi cập nhật số lượng. Vui lòng thử lại!');
    }
}

function showLoading() {
    document.getElementById('loading-spinner').style.display = 'block';
    document.getElementById('wheel').style.opacity = '0.5';
    document.getElementById('spin-btn').disabled = true;
}

function hideLoading() {
    document.getElementById('loading-spinner').style.display = 'none';
    document.getElementById('wheel').style.opacity = '1';
    document.getElementById('spin-btn').disabled = false;
}

function showNotification(message) {
    const modal = document.getElementById('notification-modal');
    const modalText = document.getElementById('notification-text');
    
    modalText.innerHTML = `<i class="fas fa-info-circle"></i> ${message}`;
    modal.style.display = 'flex';
    
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeModal() {
    const modal = document.getElementById('notification-modal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function showPlayerInfoModal() {
    if (hasSpun) {
        return;
    }

    const modal = document.getElementById('player-info-modal');
    const fbPageLink = document.getElementById('fb-page-link');
    const fbPostLink = document.getElementById('fb-post-link');
    const followFbCheckbox = document.getElementById('player-follow-fb');
    const likePostCheckbox = document.getElementById('player-like-post');

    const fbPage = prizes[0]?.fbPage || '#';
    const fbPost = prizes[0]?.fbPost || '#';
    
    console.log('FB Page Link:', fbPage);
    console.log('FB Post Link:', fbPost);
    
    fbPageLink.href = fbPage;
    fbPageLink.textContent = fbPage !== '#' ? 'Click để theo dõi' : 'Link trang FB không khả dụng';
    fbPostLink.href = fbPost;
    fbPostLink.textContent = fbPost !== '#' ? 'Click để thích' : 'Link bài viết không khả dụng';

    followFbCheckbox.checked = false;
    likePostCheckbox.checked = false;

    fbPageLink.addEventListener('click', () => {
        localStorage.setItem('hasFollowedPage', 'true');
        followFbCheckbox.checked = true;
    });

    fbPostLink.addEventListener('click', () => {
        localStorage.setItem('hasLikedPost', 'true');
        likePostCheckbox.checked = true;
    });

    document.getElementById('spin-btn').disabled = true;
    
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closePlayerInfoModal() {
    const modal = document.getElementById('player-info-modal');
    modal.classList.remove('show');
    
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function showLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';
    
    createParticles();
    preloadAudio();
    
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    if (localStorage.getItem('theme') === 'dark') {
        body.setAttribute('data-theme', 'dark');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }

    themeToggle.addEventListener('click', () => {
        if (body.getAttribute('data-theme') === 'dark') {
            body.removeAttribute('data-theme');
            themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
            localStorage.setItem('theme', 'light');
        } else {
            body.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            localStorage.setItem('theme', 'dark');
        }
    });

    document.getElementById('spin-btn').addEventListener('click', spinWheel);
    
    document.getElementById('reset-btn').addEventListener('click', () => {
        if (isSpinning) return;
        hasSpun = false;
        stopBlinkEffect();
        initWheel();
        document.getElementById('result-text').textContent = 'Chưa có kết quả';
        document.getElementById('result-image').style.display = 'none';
        document.getElementById('share-btn').style.display = 'none';
        document.getElementById('retry-btn').style.display = 'none';
        document.getElementById('spin-btn').disabled = false;
        showNotification('Đã reset vòng quay!');
    });

    document.getElementById('retry-btn').addEventListener('click', () => {
        if (!isSpinning) {
            hasSpun = false;
            stopBlinkEffect();
            initWheel();
            document.getElementById('result-text').textContent = 'Chưa có kết quả';
            document.getElementById('result-image').style.display = 'none';
            document.getElementById('share-btn').style.display = 'none';
            document.getElementById('retry-btn').style.display = 'none';
            document.getElementById('spin-btn').disabled = false;
            showNotification('Đã sẵn sàng để quay lại!');
        }
    });

    document.getElementById('notification-modal').addEventListener('click', function(e) {
        if (e.target === this) closeModal();
    });

    const playerInfoForm = document.getElementById('player-info-form');
    playerInfoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const followFb = document.getElementById('player-follow-fb').checked;
        const likePost = document.getElementById('player-like-post').checked;
        
        if (!followFb || !likePost) {
            showNotification('Vui lòng tích vào "Theo dõi trang" và "Thích bài viết" trước khi xác nhận!');
            return;
        }

        playerInfo = {
            name: document.getElementById('player-name').value.trim(),
            address: document.getElementById('player-address').value.trim(),
            phone: document.getElementById('player-phone').value.trim(),
            facebook: document.getElementById('player-facebook').value.trim(),
            zalo: document.getElementById('player-zalo').value.trim(),
            followedPage: followFb,
            likedPost: likePost
        };
        closePlayerInfoModal();
        document.getElementById('spin-btn').disabled = false;
    });

    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        userId = document.getElementById('user-id').value.trim();
        token = document.getElementById('token').value.trim();
        
        if (userId && token) {
            closeLoginModal();
            fetchData();
        } else {
            showNotification('Vui lòng nhập đầy đủ User ID và Token!');
        }
    });

    showLoginModal();
});

if (typeof confetti === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.5.1/dist/confetti.min.js';
    document.head.appendChild(script);
}