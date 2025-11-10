/**
 * 메인 게임 로직
 */

class TrafficSafetyGame {
  constructor() {
    // 게임 상태
    this.isRunning = false;
    this.isBraking = false;
    this.gameStarted = false;
    this.playerName = '플레이어';
    this.playerClass = '';
    this.collisionAnimPlayed = false;
    this.noBrakePenalty = false;

    // 차량 상태
    this.speed = 30; // km/h (초기 속도)
    this.speedAtBrake = 30; // 브레이크를 밟은 시점의 속도
    this.position = 0; // z 좌표
    this.distanceTraveled = 0;

    // 장애물
    this.obstacleSpawned = false;
    this.obstacleElement = null;
    this.obstacleBody = null; // 몸통 엘리먼트 (애니메이션용)
    this.obstacleLeftArm = null;
    this.obstacleRightArm = null;
    this.obstacleLeftLeg = null;
    this.obstacleRightLeg = null;
    this.obstacleHead = null;
    this.obstacleAlert = null;
    this.obstacleDistance = 0;
    this.obstacleAppearDistance = 8; // 차량 앞 8m에서 등장
    this.obstaclePositionZ = 0; // 장애물 Z 위치 (동적으로 계산)
    this.obstacleStartX = 0; // 장애물 시작 위치 (인도)
    this.obstacleTargetX = 0; // 장애물 목표 위치 (도로)
    this.obstacleCurrentX = 0; // 장애물 현재 X 위치
    this.obstacleRunning = false; // 장애물이 뛰어나오는 중
    this.obstacleRunStartTime = 0; // 뛰어나오기 시작 시간
    this.obstacleRunSpeed = 3.5; // 어린이 달리기 속도 (m/s) - 실제 어린이: 3-4 m/s
    this.fromLeft = false; // 왼쪽에서 출발 여부

    // 타이밍
    this.lastTime = 0;
    this.gameStartTime = 0; // 게임 시작 시간
    this.obstacleAppearTime = 0;
    this.brakeTime = 0;
    this.reactionTime = 0;
    this.lastLoggedSecond = 0; // 로그용

    // 랜덤 요소
    this.randomDelay = this.getRandomDelay();

    // DOM 엘리먼트
    this.sceneEl = document.querySelector('a-scene');
    this.cameraRig = document.getElementById('camera-rig');
    this.obstaclesContainer = document.getElementById('obstacles');
    this.parkedCarsContainer = null; // 주차된 차량 컨테이너

    // 디바이스 정보
    this.isMobileDevice = !!(window.AFRAME && AFRAME.utils && AFRAME.utils.device && AFRAME.utils.device.isMobile());

    // 차량/장애물 치수 (거리 계산 및 충돌 판정을 위한 기준값)
    this.vehicleFrontLength = 2.25; // 차량 중심에서 앞범퍼까지 거리
    this.obstacleHalfDepth = 0.1; // 어린이 모델 절반 깊이

    // 기록용 상태
    this.positionAtBrake = null;
    this.clearanceAtBrake = null;
    this.obstacleFrontClearance = null;
    this.collisionHappened = false;
    this.brakeTriggered = false;
    this.collisionAnimPlayed = false;
    this.noBrakePenalty = false;

    // 디바이스 성능 설정
    this.applyDevicePerformanceSettings();

    // 이벤트 바인딩
    this.bindEvents();
  }

  /**
   * 모바일 환경에서 렌더링 부담을 줄이기 위한 설정
   */
  applyDevicePerformanceSettings() {
    if (!this.sceneEl || !this.isMobileDevice) {
      return;
    }
    const rendererSettings = [
      'colorManagement: true',
      'physicallyCorrectLights: true',
      'antialias: false',
      'precision: highp',
      'powerPreference: high-performance',
      'foveationLevel: 0'
    ].join('; ');
    this.sceneEl.setAttribute('renderer', rendererSettings);
    console.log('⚙️ 모바일 VR 친화 렌더러 설정 적용:', rendererSettings);
  }

  /**
   * 차량 앞범퍼와 어린이 사이 여유거리(m)
   * 양수면 아직 여유, 0 이하이면 겹침 또는 충돌
   */
  getFrontClearance(position = this.position) {
    const vehicleFrontZ = position - this.vehicleFrontLength;
    const obstacleFrontZ = this.obstaclePositionZ + this.obstacleHalfDepth;
    return vehicleFrontZ - obstacleFrontZ;
  }

  /**
   * 시야(카메라 리그 + look-controls) 초기화
   */
  resetDriverView() {
    if (this.cameraRig) {
      this.cameraRig.setAttribute('rotation', '0 0 0');
      this.cameraRig.setAttribute('position', `0 1.8 ${this.position}`);
    }

    const cameraEl = document.getElementById('main-camera');
    if (!cameraEl) return;

    cameraEl.setAttribute('rotation', '0 0 0');

    const lookControls = cameraEl.components && cameraEl.components['look-controls'];
    if (lookControls && lookControls.pitchObject && lookControls.yawObject) {
      lookControls.pitchObject.rotation.set(0, 0, 0);
      lookControls.yawObject.rotation.set(0, 0, 0);
    }
  }

  playCollisionAnimation() {
    if (this.collisionAnimPlayed || !this.obstacleElement) {
      return;
    }
    this.collisionAnimPlayed = true;
    this.isRunning = false;

    const currentPos = this.obstacleElement.getAttribute('position') || { x: 0, y: 0, z: 0 };
    const targetZ = currentPos.z - 6;

    const easeOut = 'easeOutQuad';
    const easeIn = 'easeInQuad';

    this.obstacleElement.setAttribute('animation__hitmove', `property: position; to: ${currentPos.x} 2 ${targetZ}; dur: 600; easing: ${easeOut};`);
    this.obstacleElement.setAttribute('animation__hitrotate', `property: rotation; to: -360 0 0; dur: 650; easing: ${easeIn};`);
    this.obstacleElement.setAttribute('animation__hitscale', `property: scale; to: 1.4 1.4 1.4; dur: 250; easing: ${easeOut};`);

    if (this.obstacleBody) {
      this.obstacleBody.setAttribute('animation__bodyspin', `property: rotation; to: 0 0 540; dur: 650; easing: ${easeOut};`);
    }

    if (this.obstacleHead) {
      this.obstacleHead.setAttribute('animation__headspin', `property: rotation; to: 0 0 720; dur: 550; easing: ${easeOut};`);
      this.obstacleHead.setAttribute('animation__headmove', `property: position; to: 0 1.8 -0.6; dur: 450; easing: ${easeOut};`);
    }

    if (this.obstacleLeftArm) {
      this.obstacleLeftArm.setAttribute('animation__larmpose', `property: rotation; to: -360 0 180; dur: 600; easing: ${easeOut};`);
      this.obstacleLeftArm.setAttribute('animation__larmmove', `property: position; to: -0.7 1.2 -0.5; dur: 500; easing: ${easeOut};`);
    }

    if (this.obstacleRightArm) {
      this.obstacleRightArm.setAttribute('animation__rarm', `property: rotation; to: 360 0 -180; dur: 600; easing: ${easeOut};`);
      this.obstacleRightArm.setAttribute('animation__rarmmove', `property: position; to: 0.7 1.2 -0.5; dur: 500; easing: ${easeOut};`);
    }

    if (this.obstacleLeftLeg) {
      this.obstacleLeftLeg.setAttribute('animation__llegrot', `property: rotation; to: -270 0 120; dur: 600; easing: ${easeOut};`);
      this.obstacleLeftLeg.setAttribute('animation__llegmove', `property: position; to: -0.5 1.0 -0.7; dur: 500; easing: ${easeOut};`);
    }

    if (this.obstacleRightLeg) {
      this.obstacleRightLeg.setAttribute('animation__rlegrot', `property: rotation; to: 270 0 -120; dur: 600; easing: ${easeOut};`);
      this.obstacleRightLeg.setAttribute('animation__rlegmove', `property: position; to: 0.5 1.0 -0.7; dur: 500; easing: ${easeOut};`);
    }

    if (this.obstacleAlert) {
      this.obstacleAlert.setAttribute('animation__alertmove', `property: position; to: 0 2 -1; dur: 500; easing: ${easeOut};`);
    }

    setTimeout(() => {
      if (!this.obstacleElement) return;
      this.obstacleElement.setAttribute('animation__hitshrink', `property: scale; to: 0.2 0.2 0.2; dur: 450; easing: ${easeIn};`);
      setTimeout(() => {
        if (this.obstacleElement) {
          this.obstacleElement.setAttribute('visible', 'false');
        }
      }, 450);
    }, 650);
  }

  /**
   * 이벤트 리스너 바인딩
   */
  bindEvents() {
    // 시작 버튼
    document.getElementById('start-btn').addEventListener('click', () => {
      this.start();
    });

    // 재시작 버튼
    document.getElementById('restart-btn').addEventListener('click', () => {
      this.restart();
    });

    // 키보드 입력 (스페이스바 - 브레이크)
    document.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && this.isRunning && !this.isBraking) {
        e.preventDefault();
        this.brake();
      }
    });

    // 모바일 터치 (화면 탭 - 브레이크)
    document.addEventListener('touchstart', (e) => {
      if (!this.isRunning || this.isBraking) {
        return;
      }
      if (!this.isSceneTouch(e)) {
        return;
      }
      // 터치 입력과 브레이크를 1:1 매핑하기 위해 기본 동작을 막음
      e.preventDefault();
      this.brake();
    }, { passive: false });

    // VR 컨트롤러 버튼 (선택사항)
    document.addEventListener('selectstart', (e) => {
      if (this.isRunning && !this.isBraking) {
        this.brake();
      }
    });
  }

  /**
   * HUD/모달 등 UI 요소를 제외한 터치인지 판별
   */
  isSceneTouch(event) {
    if (!event) return false;
    let target = event.target;
    if (!target) return false;

    if (target.nodeType !== 1 && target.parentElement) {
      target = target.parentElement;
    }

    if (!target || typeof target.closest !== 'function') {
      return true;
    }

    if (target.closest('#ui-overlay') ||
        target.closest('#cardboard-align-overlay') ||
        target.closest('.modal.show')) {
      return false;
    }

    return true;
  }

  /**
   * 게임 시작
   */
  start() {
    this.isRunning = true;
    this.gameStarted = true;
    this.isBraking = false;
    this.obstacleSpawned = false;

    // 초기값 설정 (어린이 보호구역 20km/h)
    this.speed = 20; // 어린이 보호구역 제한 속도
    this.position = 0;
    this.distanceTraveled = 0;
    this.randomDelay = this.getRandomDelay();
    this.positionAtBrake = null;
    this.clearanceAtBrake = null;
    this.obstacleFrontClearance = null;
    this.collisionHappened = false;
    this.brakeTriggered = false;
    this.collisionAnimPlayed = false;
    this.resetDriverView();

    console.log('🚸 어린이 보호구역입니다! 주행 속도: 20 km/h (제한 속도)');
    console.log(`⏰ 어린이 등장 예정 시간: ${(this.randomDelay / 1000).toFixed(1)}초 후`);

    // 주차된 차량 생성
    this.spawnParkedCars();

    // UI 업데이트 및 플레이어 정보
    const profile = window.uiManager.startGame() || {};
    this.playerName = profile.name || window.uiManager.getCurrentPlayerName();
    this.playerClass = profile.className || window.uiManager.getCurrentClassName();

    // 게임 루프 시작
    this.gameStartTime = performance.now();
    this.lastTime = this.gameStartTime;
    this.gameLoop();
  }

  /**
   * 주차된 차량을 동적으로 생성
   */
  spawnParkedCars() {
    const scene = this.sceneEl || document.querySelector('a-scene');
    if (!scene) {
      console.warn('⚠️ 씬을 찾을 수 없어 주차 차량을 생성하지 못했습니다.');
      return;
    }
    this.parkedCarsContainer = document.createElement('a-entity');
    this.parkedCarsContainer.id = 'parked-cars';
    scene.appendChild(this.parkedCarsContainer);

    const carSpots = this.getParkedCarSpots();

    carSpots.forEach(spot => {
      const carEntity = document.createElement('a-entity');
      
      // GLTF 모델 설정
      carEntity.setAttribute('gltf-model', '#car-model');
      
      // 위치 및 방향 설정 (모든 차량이 도로 방향을 보도록 180도 회전)
      carEntity.setAttribute('position', `${spot.x} 0 ${spot.z}`);
      carEntity.setAttribute('rotation', '0 180 0');

      // 크기 랜덤화 (다양성 부여)
      const randomScale = 0.9 + Math.random() * 0.2; // 0.9 ~ 1.1
      carEntity.setAttribute('scale', `${randomScale} ${randomScale} ${randomScale}`);

      this.parkedCarsContainer.appendChild(carEntity);
    });
    console.log(`✅ ${carSpots.length}대의 주차 차량을 동적으로 생성했습니다.${this.isMobileDevice ? ' (모바일 최적화 적용)' : ''}`);
  }

  /**
   * 주차 차량 위치 (모바일은 절반만 생성해 부하 감소)
   */
  getParkedCarSpots() {
    const baseSpots = [
      // 좌측
      { x: -2.2, z: -8 }, { x: -2.2, z: -15 }, { x: -2.2, z: -22 },
      { x: -2.2, z: -35 }, { x: -2.2, z: -50 }, { x: -2.2, z: -65 },
      { x: -2.2, z: -80 }, { x: -2.2, z: -95 }, { x: -2.2, z: -110 },
      // 우측
      { x: 2.2, z: -10 }, { x: 2.2, z: -18 }, { x: 2.2, z: -28 },
      { x: 2.2, z: -40 }, { x: 2.2, z: -55 }, { x: 2.2, z: -70 },
      { x: 2.2, z: -85 }, { x: 2.2, z: -100 }, { x: 2.2, z: -115 },
      // 뒤쪽
      { x: -2.2, z: 30 }, { x: 2.2, z: 45 }, { x: -2.2, z: 68 }, { x: 2.2, z: 92 }
    ];

    if (!this.isMobileDevice) {
      return baseSpots;
    }

    return baseSpots.filter((_, index) => index % 2 === 0);
  }

  /**
   * 생성된 주차 차량 제거
   */
  removeParkedCars() {
    if (this.parkedCarsContainer) {
      this.parkedCarsContainer.parentNode.removeChild(this.parkedCarsContainer);
      this.parkedCarsContainer = null;
      console.log('✅ 주차된 차량을 모두 제거했습니다.');
    }
  }

  /**
   * 랜덤 장애물 등장 시간 (3-10초)
   */
  getRandomDelay() {
    return 3000 + Math.random() * 7000;
  }

  /**
   * 랜덤 장애물 위치 (도로 중앙 근처, 차량 경로 위)
   */
  getRandomPosition() {
    // 차량 경로(x=0) 주변 -0.8 ~ 0.8 범위
    // 확실히 차량과 충돌하도록 중앙 근처만
    return -0.8 + Math.random() * 1.6;
  }

  /**
   * 장애물 생성 (주차 차량 사이에서 시작, 차량 앞 8m)
   */
  spawnObstacle() {
    console.log('🎬 spawnObstacle() 함수 실행!');

    this.obstacleSpawned = true;
    this.obstacleRunning = true;
    this.obstacleAppearTime = performance.now();
    this.obstacleRunStartTime = performance.now();

    // 차량 앞 8m 지점에 장애물 배치
    // 차량이 음수 방향으로 이동하므로, 앞은 position보다 작은 값
    this.obstaclePositionZ = this.position - this.obstacleAppearDistance;

    console.log(`📍 차량 현재 위치: z=${this.position.toFixed(2)}m`);
    console.log(`📍 어린이 등장 위치: z=${this.obstaclePositionZ.toFixed(2)}m (차량 앞 ${this.obstacleAppearDistance}m)`);

    // 랜덤하게 왼쪽 또는 오른쪽에서 시작
    this.fromLeft = Math.random() < 0.5;
    console.log(`   방향: ${this.fromLeft ? '왼쪽' : '오른쪽'}`);

    if (this.fromLeft) {
      // 왼쪽 주차 차량 뒤에서 도로로 (불법주정차 차량 위치: x=-2.2)
      this.obstacleStartX = -2.2; // 주차된 차량 위치
      this.obstacleTargetX = this.getRandomPosition(); // 도로 내 랜덤 위치
    } else {
      // 오른쪽 주차 차량 뒤에서 도로로 (불법주정차 차량 위치: x=2.2)
      this.obstacleStartX = 2.2; // 주차된 차량 위치
      this.obstacleTargetX = this.getRandomPosition(); // 도로 내 랜덤 위치
    }

    this.obstacleCurrentX = this.obstacleStartX;

    // 장애물 엘리먼트 생성 (어린이 모형)
    this.obstacleElement = document.createElement('a-entity');
    this.obstacleElement.setAttribute('position', `${this.obstacleStartX} 0 ${this.obstaclePositionZ}`);

    // 오른쪽에서 나올 때는 왼쪽을 바라보도록 회전
    const rotation = this.fromLeft ? 90 : -90;
    this.obstacleElement.setAttribute('rotation', `0 ${rotation} 0`);

    // 어린이 캐릭터 생성 (단순화된 모델)
    this.obstacleElement.innerHTML = `
      <!-- 머리 -->
      <a-sphere id="child-head" position="0 1.25 0" radius="0.18" color="#FFE0B2"></a-sphere>
      <!-- 몸통 -->
      <a-box id="child-body" position="0 0.8 0" width="0.35" height="0.7" depth="0.2" color="#FF6B6B"></a-box>
      <!-- 팔 (왼쪽) -->
      <a-box id="child-left-arm" position="-0.22 0.8 0" width="0.1" height="0.5" depth="0.1" color="#FF8A80"></a-box>
      <!-- 팔 (오른쪽) -->
      <a-box id="child-right-arm" position="0.22 0.8 0" width="0.1" height="0.5" depth="0.1" color="#FF8A80"></a-box>
      <!-- 다리 (왼쪽) -->
      <a-box id="child-left-leg" position="-0.1 0.3 0" width="0.14" height="0.6" depth="0.14" color="#1565C0"></a-box>
      <!-- 다리 (오른쪽) -->
      <a-box id="child-right-leg" position="0.1 0.3 0" width="0.14" height="0.6" depth="0.14" color="#1565C0"></a-box>
      <!-- 경고 표지판 -->
      <a-text id="child-alert" value="!" position="0 1.6 0" align="center" color="#FF0000" width="4"></a-text>
    `;

    // DOM에 추가
    try {
      this.obstaclesContainer.appendChild(this.obstacleElement);
      console.log('✅ DOM에 어린이 엘리먼트 추가 완료');
    } catch (error) {
      console.error('❌ DOM 추가 실패:', error);
      return;
    }

    console.log(`🏃 어린이가 ${this.fromLeft ? '왼쪽' : '오른쪽'} 인도에서 뛰어나옵니다!`);
    console.log(`   어린이 위치: x=${this.obstacleStartX}, z=${this.obstaclePositionZ.toFixed(2)}`);
    console.log(`   차량 위치: z=${this.position.toFixed(2)}`);
    console.log(`   차량-어린이 거리: ${Math.abs(this.obstaclePositionZ - this.position).toFixed(2)}m`);
    console.log(`   차량 속도: ${this.speed.toFixed(1)} km/h, 어린이 속도: ${this.obstacleRunSpeed} m/s`);

    // 애니메이션을 위한 엘리먼트 참조 저장 (즉시 시도, 실패하면 나중에)
    this.initObstacleReferences();
  }

  /**
   * 장애물 엘리먼트 참조 초기화
   */
  initObstacleReferences() {
    if (!this.obstacleElement) return;

    this.obstacleBody = this.obstacleElement.querySelector('#child-body');
    this.obstacleLeftArm = this.obstacleElement.querySelector('#child-left-arm');
    this.obstacleRightArm = this.obstacleElement.querySelector('#child-right-arm');
    this.obstacleLeftLeg = this.obstacleElement.querySelector('#child-left-leg');
    this.obstacleRightLeg = this.obstacleElement.querySelector('#child-right-leg');
    this.obstacleHead = this.obstacleElement.querySelector('#child-head');
    this.obstacleAlert = this.obstacleElement.querySelector('#child-alert');

    if (this.obstacleBody) {
      console.log('✅ 어린이 애니메이션 준비 완료');
    }
  }

  /**
   * 브레이크 입력
   */
  brake() {
    if (this.isBraking) return; // 이미 브레이크 중이면 무시
    this.brakeTriggered = true;

    // 어린이가 나타나기 전에 브레이크를 누르면 실격
    if (!this.obstacleSpawned) {
      console.log(`❌ 실격! 어린이가 나타나기 전에 브레이크를 밟았습니다.`);
      this.isBraking = true;
      this.brakeTime = performance.now();
      this.reactionTime = -1; // 실격 표시
      this.speed = 0;
      this.endGame();
      return;
    }

    this.isBraking = true;
    this.brakeTime = performance.now();
    this.speedAtBrake = this.speed; // 브레이크를 밟은 시점의 속도 저장

    // 반응시간 계산
    this.reactionTime = (this.brakeTime - this.obstacleAppearTime) / 1000;
    console.log(`🛑 브레이크! 반응시간: ${this.reactionTime.toFixed(3)}초, 속도: ${this.speedAtBrake.toFixed(1)} km/h`);

    // 브레이크 시점 기록 (앞범퍼 기준 남은 거리 계산용)
    this.positionAtBrake = this.position;
    this.clearanceAtBrake = this.getFrontClearance(this.positionAtBrake);

    // 브레이크 시 카메라 쏠림 효과
    try {
      const camera = document.getElementById('main-camera');
      // 기존 애니메이션이 있다면 제거
      const oldAnimation = camera.querySelector('a-animation');
      if (oldAnimation) {
        camera.removeChild(oldAnimation);
      }
      const animation = document.createElement('a-animation');
      animation.setAttribute('attribute', 'rotation');
      animation.setAttribute('to', '3 0 0'); // 살짝 앞으로 기울임
      animation.setAttribute('dur', '150');
      animation.setAttribute('direction', 'alternate');
      animation.setAttribute('repeat', '1');
      animation.setAttribute('easing', 'ease-out');
      camera.appendChild(animation);
    } catch (e) {
      console.warn('카메라 쏠림 효과 적용 실패:', e);
    }

    // UI 표시
    window.uiManager.showBrakeIndicator();
  }

  /**
   * 게임 루프
   */
  gameLoop() {
    if (!this.isRunning) return;

    const currentTime = performance.now();
    const deltaTime = (currentTime - this.lastTime) / 1000; // 초 단위
    this.lastTime = currentTime;

    // 장애물이 아직 등장하지 않았고, 충분한 시간이 지났으면 생성
    const elapsedSinceStart = currentTime - this.gameStartTime;

    // 매 프레임마다 상태 체크 (1초마다만 출력)
    if (!this.obstacleSpawned) {
      const secondsPassed = Math.floor(elapsedSinceStart / 1000);
      if (secondsPassed > (this.lastLoggedSecond || 0)) {
        console.log(`⏱️ ${secondsPassed}초 경과... (목표: ${(this.randomDelay / 1000).toFixed(1)}초)`);
        this.lastLoggedSecond = secondsPassed;
      }
    }

    if (!this.obstacleSpawned && elapsedSinceStart > this.randomDelay) {
      console.log(`✅ 조건 충족: 경과 시간 ${(elapsedSinceStart / 1000).toFixed(1)}초 > 딜레이 ${(this.randomDelay / 1000).toFixed(1)}초`);
      this.spawnObstacle();
    }

    // 장애물이 뛰어나오는 애니메이션 (실제 속도 기반)
    if (this.obstacleRunning) {
      const runElapsed = (currentTime - this.obstacleRunStartTime) / 1000; // 초 단위

      // 이동 거리 계산 (실제 물리 기반)
      const totalDistance = Math.abs(this.obstacleTargetX - this.obstacleStartX);
      const movedDistance = Math.min(this.obstacleRunSpeed * runElapsed, totalDistance);
      const runProgress = movedDistance / totalDistance;

      // 첫 프레임에만 로그
      if (runElapsed < 0.1) {
        console.log(`🏃‍♂️ 애니메이션 시작: 총 거리 ${totalDistance.toFixed(1)}m, 속도 ${this.obstacleRunSpeed} m/s`);
      }

      // 현재 X 위치 계산 (선형 이동 - 일정한 속도)
      const direction = this.obstacleTargetX > this.obstacleStartX ? 1 : -1;
      this.obstacleCurrentX = this.obstacleStartX + movedDistance * direction;

      // 달리기 사이클 (2.5 사이클/초, 실제 어린이 보폭)
      const runCycle = runElapsed * 2.5;

      // 상하 점프 (달리기 특성)
      const bobHeight = Math.abs(Math.sin(runCycle * Math.PI * 2)) * 0.08;

      // 몸통 흔들림
      const bodyLean = Math.sin(runCycle * Math.PI * 2) * 3;

      // 팔 스윙 (앞뒤로 크게)
      const armSwing = Math.sin(runCycle * Math.PI * 2) * 60; // -60 ~ 60도

      // 다리 움직임 (뛰기 동작)
      const legSwing = Math.sin(runCycle * Math.PI * 2) * 50; // -50 ~ 50도

      // 장애물 위치 업데이트
      this.obstacleElement.setAttribute('position',
        `${this.obstacleCurrentX} ${bobHeight} ${this.obstaclePositionZ}`);

      // 애니메이션 적용 (엘리먼트가 준비된 경우만)
      if (!this.obstacleBody) {
        // 참조가 없으면 다시 초기화 시도
        this.initObstacleReferences();
      }

      if (this.obstacleBody) {
        // 몸통 기울임
        this.obstacleBody.setAttribute('rotation', `${bodyLean} 0 0`);

        // 팔 스윙 (반대 방향)
        this.obstacleLeftArm.setAttribute('rotation', `${-armSwing} 0 0`);
        this.obstacleRightArm.setAttribute('rotation', `${armSwing} 0 0`);

        // 다리 움직임 (반대 방향)
        this.obstacleLeftLeg.setAttribute('rotation', `${legSwing} 0 0`);
        this.obstacleRightLeg.setAttribute('rotation', `${-legSwing} 0 0`);
      }

      // 목표 지점 도달
      if (runProgress >= 1.0) {
        this.obstacleRunning = false;

        // 멈춘 자세로 리셋
        if (this.obstacleBody) {
          this.obstacleBody.setAttribute('rotation', '0 0 0');
          this.obstacleLeftArm.setAttribute('rotation', '0 0 0');
          this.obstacleRightArm.setAttribute('rotation', '0 0 0');
          this.obstacleLeftLeg.setAttribute('rotation', '0 0 0');
          this.obstacleRightLeg.setAttribute('rotation', '0 0 0');
        }

        const distance = Math.abs(this.obstaclePositionZ - this.position);
        console.log(`✋ 어린이가 도로에 멈춰 섰습니다! (차량과의 거리: ${distance.toFixed(1)}m)`);
      }
    }

    // 브레이크가 눌렸으면 감속
    if (this.isBraking) {
      const speedMs = window.physicsEngine.kmhToMs(this.speed);
      const newSpeedMs = window.physicsEngine.calculateDeceleration(speedMs, deltaTime);
      this.speed = window.physicsEngine.msToKmh(newSpeedMs);

      // 완전히 멈춤
      if (this.speed < 0.1) {
        this.speed = 0;
        this.endGame();
        return;
      }
    }

    // 차량 이동
    const speedMs = window.physicsEngine.kmhToMs(this.speed);
    const moveDistance = speedMs * deltaTime;
    this.position -= moveDistance; // z축 음수 방향으로 이동
    this.distanceTraveled += moveDistance;

    // 카메라 리그 이동 (SUV 높이)
    this.cameraRig.setAttribute('position', `0 1.8 ${this.position}`);

    // 장애물과의 거리 계산
    if (this.obstacleSpawned) {
      this.obstacleDistance = Math.abs(this.obstaclePositionZ - this.position);
      this.obstacleFrontClearance = this.getFrontClearance(this.position);

      // 충돌 감지 (정면 여유거리 + X축 겹침)
      const vehiclePos = { x: 0, y: 0, z: this.position };
      const obstaclePos = {
        x: this.obstacleCurrentX,
        y: 0,
        z: this.obstaclePositionZ
      };

      const distanceX = Math.abs(vehiclePos.x - obstaclePos.x);
      const collisionThresholdX = 1.0 + 0.2; // 차량 폭 절반 + 어린이 폭 절반

      if (distanceX < collisionThresholdX && this.obstacleFrontClearance <= 0) {
        // 충돌 발생
        console.log(`💥 충돌! X 거리: ${distanceX.toFixed(2)}m, 정면 여유: ${this.obstacleFrontClearance.toFixed(2)}m`);
        this.collisionHappened = true;
        this.playCollisionAnimation();
        this.endGame();
        return;
      }

      // 장애물을 완전히 지나쳤을 경우 (충돌 없이 통과 또는 회피)
      if (this.position < this.obstaclePositionZ - 3) {
        if (this.isBraking) {
          console.log('✅ 안전하게 정지 후 통과');
        } else {
          console.log('⚠️ 브레이크 없이 통과 (위험 운전!)');
          this.noBrakePenalty = true;
          this.collisionHappened = true;
          this.playCollisionAnimation();
        }
        this.endGame();
        return;
      }
    }

    // HUD 업데이트 (어린이 거리 포함)
    const obstacleDistanceForHud = this.obstacleSpawned ? this.obstacleFrontClearance : null;
    window.uiManager.updateHUD(this.speed, this.distanceTraveled, obstacleDistanceForHud);

    // 다음 프레임
    requestAnimationFrame(() => this.gameLoop());
  }

  /**
   * 게임 종료 및 결과 표시
   */
  endGame() {
    this.isRunning = false;

    // 어린이 등장 전 브레이크 (실격) 처리
    if (this.reactionTime === -1) {
      const gameData = {
        reactionTime: -1,
        speed: this.speedAtBrake,
        distanceTraveled: this.distanceTraveled
      };
      console.log('📊 게임 결과:', gameData);
      setTimeout(() => {
        window.uiManager.showResult(gameData);
      }, 500);
      return;
    }

    const hasBrakeInput = this.brakeTriggered && this.reactionTime >= 0;
    const speedForCalculation = hasBrakeInput ? this.speedAtBrake : this.speed;
    const reactionTimeForCalc = hasBrakeInput ? this.reactionTime : window.physicsEngine.REACTION_TIME;

    const brakingData = window.physicsEngine.calculateBrakingDistance(
      speedForCalculation,
      reactionTimeForCalc
    );

    const finalClearance = this.getFrontClearance(this.position);
    const noBrake = this.noBrakePenalty || (!this.brakeTriggered && !this.collisionHappened);
    const availableDistanceForScoring = this.clearanceAtBrake !== null
      ? this.clearanceAtBrake
      : finalClearance;

    console.log('🧮 평가 입력값', {
      hasBrakeInput,
      noBrake,
      speedForCalculation,
      reactionTimeForCalc,
      stoppingDistance: brakingData.stoppingDistance,
      reactionDistance: brakingData.reactionDistance,
      finalClearance,
      availableDistanceForScoring,
      collision: this.collisionHappened
    });

    const safetyMargin = availableDistanceForScoring - brakingData.stoppingDistance;
    const collisionDetected = this.collisionHappened || finalClearance <= 0;

    let score = 100;
    let grade = '최우수';
    let message = '완벽해요! 매우 안전하게 대응했어요!';

    if (noBrake) {
      score = 0;
      grade = '위험';
      message = '브레이크를 밟지 않았어요! 위험 상황에서는 즉시 속도를 줄이고 멈춰야 합니다.';
    } else if (collisionDetected) {
      score = 0;
      grade = '위험';
      message = '충돌했어요! 어린이를 더 빨리 발견하고 브레이크를 밟아야 합니다.';
    } else {
      if (safetyMargin < 0) {
        score -= 60;
        grade = '주의';
        message = '멈추긴 했지만 여유가 거의 없었어요. 더 빠른 반응이 필요합니다.';
      } else if (safetyMargin < 1) {
        score -= 30;
        grade = '양호';
        message = '아슬아슬했어요! 조금만 더 일찍 브레이크를 밟아보세요.';
      } else if (safetyMargin < 2) {
        score -= 15;
        grade = '우수';
        message = '잘했어요! 조금 더 여유 있게 멈추면 더 안전해요.';
      }

      if (hasBrakeInput && this.reactionTime !== null) {
        if (this.reactionTime < 0.5) {
          score = Math.min(100, score + 5);
          message += ' 반응 속도도 아주 빨랐어요!';
        } else if (this.reactionTime > 1.5) {
          score -= 20;
          message += ' 반응이 많이 늦었습니다. 주변을 더 주의 깊게 살펴보세요.';
        } else if (this.reactionTime > 1.0) {
          score -= 10;
          message += ' 반응 시간이 조금 늦었어요. 더 빨리 대비해보세요.';
        }
      }

      score = Math.max(0, Math.round(score));
      if (score >= 95) grade = '최우수';
      else if (score >= 80) grade = '우수';
      else if (score >= 60) grade = '양호';
      else grade = '주의';
    }

    const safetyScore = {
      score,
      grade,
      message,
      safetyMargin,
      collision: collisionDetected,
      finalClearance,
      availableDistanceAtBrake: hasBrakeInput ? this.clearanceAtBrake : null,
      reactionTime: hasBrakeInput ? this.reactionTime : null,
      noBrake
    };

    const reactionDistance = hasBrakeInput ? brakingData.reactionDistance : 0;

    const gameData = {
      speed: speedForCalculation,
      reactionTime: hasBrakeInput ? this.reactionTime : null,
      reactionDistance: reactionDistance,
      stoppingDistance: brakingData.stoppingDistance,
      availableDistanceAtBrake: hasBrakeInput ? this.clearanceAtBrake : null,
      finalClearance,
      distanceTraveled: this.distanceTraveled,
      collision: this.collisionHappened,
      noBrake,
      safetyScore: safetyScore,
      playerName: this.playerName,
      playerClass: this.playerClass
    };

    console.log('📊 게임 결과:', gameData);

    setTimeout(() => {
      window.uiManager.showResult(gameData);
    }, 500);
  }

  /**
   * 게임 재시작
   */
  restart() {
    console.log('🔄 게임 재시작...');

    // 생성된 객체들 제거
    this.removeParkedCars();
    if (this.obstacleElement) {
      this.obstaclesContainer.removeChild(this.obstacleElement);
      this.obstacleElement = null;
    }

    // 모든 상태 리셋
    this.obstacleSpawned = false;
    this.obstacleRunning = false;
    this.isBraking = false;
    this.obstacleBody = null;
    this.obstacleLeftArm = null;
    this.obstacleRightArm = null;
    this.obstacleLeftLeg = null;
    this.obstacleRightLeg = null;
    this.obstacleHead = null;
    this.obstacleAlert = null;
    this.obstacleHead = null;
    this.obstacleAlert = null;
    this.lastLoggedSecond = 0;
    this.positionAtBrake = null;
    this.clearanceAtBrake = null;
    this.obstacleFrontClearance = null;
    this.collisionHappened = false;
    this.brakeTriggered = false;

    // 카메라 위치 초기화 (SUV 높이)
    this.position = 0;
    this.cameraRig.setAttribute('position', '0 1.8 0');
    this.cameraRig.setAttribute('rotation', '0 0 0');
    this.resetDriverView();

    // 실행 상태 리셋
    this.isRunning = false;
    this.gameStarted = false;

    // UI 초기화
    window.uiManager.reset();
  }
}

class GamepadInputManager {
  constructor(game, uiManager) {
    this.game = game;
    this.uiManager = uiManager;
    this.enabled = typeof navigator !== 'undefined' && typeof navigator.getGamepads === 'function';
    this.prevButtonStates = new Map();
    this.connectedPads = new Set();
    this.pollHandle = null;
    this.START_BUTTONS = [9, 3];
    this.BRAKE_BUTTONS = [0, 1, 2, 7];

    if (!this.enabled) {
      console.info('🎮 Gamepad API가 지원되지 않습니다. 블루투스 조이스틱 연동이 비활성화됩니다.');
      return;
    }

    window.addEventListener('gamepadconnected', (event) => {
      console.log(`🎮 게임패드 연결됨: ${event.gamepad.id}`);
      this.connectedPads.add(event.gamepad.index);
      this.startPolling();
    });

    window.addEventListener('gamepaddisconnected', (event) => {
      console.log(`🔌 게임패드 연결 해제: ${event.gamepad.id}`);
      this.connectedPads.delete(event.gamepad.index);
      this.prevButtonStates.delete(event.gamepad.index);
      if (this.connectedPads.size === 0) {
        this.stopPolling();
      }
    });

    // 초기 스캔
    this.startPolling();
  }

  startPolling() {
    if (!this.enabled || this.pollHandle) {
      return;
    }
    this.pollHandle = requestAnimationFrame(() => this.pollLoop());
  }

  stopPolling() {
    if (this.pollHandle) {
      cancelAnimationFrame(this.pollHandle);
      this.pollHandle = null;
    }
  }

  pollLoop() {
    this.updateState();
    if (this.shouldContinuePolling()) {
      this.pollHandle = requestAnimationFrame(() => this.pollLoop());
    } else {
      this.pollHandle = null;
    }
  }

  shouldContinuePolling() {
    if (this.connectedPads.size > 0) {
      return true;
    }
    const pads = typeof navigator.getGamepads === 'function' ? navigator.getGamepads() : [];
    return pads && Array.from(pads).some(Boolean);
  }

  updateState() {
    if (!this.enabled) {
      return;
    }
    const pads = navigator.getGamepads();
    if (!pads) {
      return;
    }
    Array.from(pads).forEach((pad) => {
      if (!pad) return;
      this.connectedPads.add(pad.index);
      this.scanButtons(pad);
    });
  }

  scanButtons(pad) {
    const prevState = this.prevButtonStates.get(pad.index) || [];
    pad.buttons.forEach((button, index) => {
      const isPressed = !!(button && button.pressed);
      const wasPressed = Boolean(prevState[index]);
      if (isPressed && !wasPressed) {
        this.handleButtonPress(index);
      }
      prevState[index] = isPressed;
    });
    this.prevButtonStates.set(pad.index, prevState);
  }

  handleButtonPress(index) {
    if (this.START_BUTTONS.includes(index)) {
      this.handleStartAction();
      return;
    }
    if (this.BRAKE_BUTTONS.includes(index)) {
      this.handleBrakeAction();
    }
  }

  handleStartAction() {
    if (this.uiManager?.isStartScreenVisible()) {
      this.uiManager.startButton?.click();
      return;
    }
    if (this.uiManager?.isResultScreenVisible()) {
      this.uiManager.restartButton?.click();
      return;
    }
    if (!this.game.isRunning) {
      if (!this.game.gameStarted) {
        this.game.start();
      } else {
        this.game.restart();
      }
    }
  }

  handleBrakeAction() {
    if (this.game.isRunning && !this.game.isBraking) {
      this.game.brake();
    }
  }
}
