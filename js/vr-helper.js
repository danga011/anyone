/**
 * 모바일 WebXR 헬퍼
 * - iOS Safari에서 VR 버튼이 사라지는 문제를 보완
 * - VR 모드 진입 시 게임이 자동으로 시작되도록 지원
 * - 카드보드 등 대체 모드 안내 메시지 제공
 */

class MobileVRHelper {
  constructor() {
    this.sceneEl = document.querySelector('a-scene');
    this.uiContainer = document.getElementById('mobile-vr-ui');
    this.vrButton = document.getElementById('mobile-vr-btn');
    this.vrStartButton = document.getElementById('mobile-vr-start-btn');
    this.messageEl = document.getElementById('mobile-vr-message');
    this.cardboardOverlay = document.getElementById('cardboard-align-overlay');

    this.isIOS = this.detectIOS();
    this.isMobile = this.detectMobile();
    this.supportsImmersiveVr = null;
    this.cardboardModeActive = false;
    this.orientationLocked = false;

    if (!this.sceneEl) {
      return;
    }

    this.bindSceneEvents();
    this.initialize();
  }

  detectIOS() {
    const ua = window.navigator?.userAgent || '';
    const platform = window.navigator?.platform || '';
    const isTouchMac = platform === 'MacIntel' && window.navigator?.maxTouchPoints > 1;
    return /iPad|iPhone|iPod/.test(ua) || isTouchMac;
  }

  detectMobile() {
    const deviceUtils = window.AFRAME?.utils?.device;
    if (deviceUtils && typeof deviceUtils.isMobile === 'function') {
      return deviceUtils.isMobile();
    }
    const ua = window.navigator?.userAgent || '';
    return /Android|iPhone|iPad|iPod|Samsung|LG/i.test(ua);
  }

  async initialize() {
    try {
      this.supportsImmersiveVr = await this.isImmersiveVrSupported();
    } catch (err) {
      console.warn('VR capability detection failed:', err);
      this.supportsImmersiveVr = false;
    }

    if (!this.isMobile) {
      if (this.uiContainer) {
        this.uiContainer.style.display = 'none';
      }
      this.wireButtons();
      return;
    }

    if (this.uiContainer) {
      this.uiContainer.style.display = 'block';
    }

    this.wireButtons();
    this.updateHelperMessage();
  }

  wireButtons() {
    if (this.vrButton) {
      this.vrButton.addEventListener('click', () => this.startGameAndEnterVr());
    }

    if (this.vrStartButton) {
      this.vrStartButton.addEventListener('click', () => this.startGameAndEnterVr());
    }
  }

  updateHelperMessage() {
    if (!this.messageEl) {
      return;
    }

    if (this.supportsImmersiveVr) {
      this.messageEl.style.display = 'none';
      return;
    }

    this.messageEl.style.display = 'block';
    this.messageEl.classList.remove('alert-dark', 'alert-warning', 'alert-danger', 'text-white', 'text-dark');

    if (this.isIOS) {
      this.messageEl.classList.add('alert-dark', 'text-white');
      this.messageEl.textContent = 'iOS Safari에서는 완전한 WebXR VR을 지원하지 않아요. 기기를 가로 모드로 돌린 뒤 카드보드 모드를 시도해 보세요.';
    } else {
      this.messageEl.classList.add('alert-warning', 'text-dark');
      this.messageEl.textContent = '이 기기는 WebXR VR을 직접 지원하지 않습니다. 화면을 가로로 고정한 뒤 카드보드 모드를 사용하거나 최신 Chrome/전용 헤드셋을 권장합니다.';
    }
  }

  bindSceneEvents() {
    this.sceneEl.addEventListener('enter-vr', () => {
      document.body.classList.add('vr-presenting');
      if (this.messageEl) {
        this.messageEl.style.display = 'none';
      }
      const cardboardMode = this.shouldUseCardboardFallback();
      this.setCardboardModeActive(cardboardMode);
      this.autoStartGame();
    });

    this.sceneEl.addEventListener('exit-vr', () => {
      document.body.classList.remove('vr-presenting');
      this.setCardboardModeActive(false);
      this.unlockOrientation();
      if (this.messageEl && (!this.supportsImmersiveVr || this.isIOS)) {
        this.messageEl.style.display = 'block';
      }
    });
  }

  async isImmersiveVrSupported() {
    if (!navigator.xr || typeof navigator.xr.isSessionSupported !== 'function') {
      return false;
    }
    try {
      return await navigator.xr.isSessionSupported('immersive-vr');
    } catch (err) {
      console.warn('navigator.xr.isSessionSupported failed:', err);
      return false;
    }
  }

  shouldUseCardboardFallback() {
    return this.isMobile && this.supportsImmersiveVr === false;
  }

  isLandscape() {
    if (window.matchMedia) {
      try {
        return window.matchMedia('(orientation: landscape)').matches;
      } catch (err) {
        return window.innerWidth > window.innerHeight;
      }
    }
    return window.innerWidth > window.innerHeight;
  }

  async ensureLandscapeOrientation() {
    if (!this.shouldUseCardboardFallback()) {
      return true;
    }

    const orientation = window.screen?.orientation;
    if (orientation && typeof orientation.lock === 'function') {
      if (orientation.type && orientation.type.startsWith('landscape')) {
        return true;
      }
      try {
        await orientation.lock('landscape');
        this.orientationLocked = true;
        return true;
      } catch (err) {
        console.warn('Orientation lock failed:', err);
      }
    }

    return this.isLandscape();
  }

  unlockOrientation() {
    if (!this.orientationLocked) {
      return;
    }
    const orientation = window.screen?.orientation;
    if (orientation && typeof orientation.unlock === 'function') {
      try {
        orientation.unlock();
      } catch (err) {
        console.warn('Orientation unlock failed:', err);
      }
    }
    this.orientationLocked = false;
  }

  setCardboardModeActive(active) {
    if (this.cardboardModeActive === active) {
      return;
    }
    this.cardboardModeActive = active;
    document.body.classList.toggle('cardboard-mode', active);
    if (this.cardboardOverlay) {
      this.cardboardOverlay.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
  }

  ensureGameStarted(options = {}) {
    const { silent = false } = options;
    const game = window.game;
    const uiManager = window.uiManager;

    if (!game || !uiManager) {
      if (!silent) {
        this.showMessage('게임이 아직 준비되지 않았습니다. 잠시 후 다시 시도해주세요.', true);
      }
      return false;
    }

    if (game.isRunning || game.gameStarted) {
      return true;
    }

    try {
      game.start();
      return true;
    } catch (err) {
      console.error('Failed to start game from VR helper:', err);
      if (!silent) {
        this.showMessage('게임을 시작하지 못했습니다. 페이지를 새로고침해 주세요.', true);
      }
      return false;
    }
  }

  async startGameAndEnterVr() {
    const started = this.ensureGameStarted();
    if (!started) {
      return;
    }
    await this.enterVrSession();
  }

  async enterVrSession() {
    if (!this.sceneEl) {
      return false;
    }

    const useCardboardFallback = this.shouldUseCardboardFallback();

    if (this.isIOS) {
      const permissionGranted = await this.requestDeviceOrientationPermission();
      if (!permissionGranted) {
        this.showMessage('기기 방향 센서 접근을 허용해야 VR 모드를 사용할 수 있어요.', true);
        return false;
      }
    }

    if (useCardboardFallback) {
      const orientationReady = await this.ensureLandscapeOrientation();
      if (!orientationReady) {
        this.showMessage('VR 모드를 사용하려면 기기를 가로 모드로 돌리거나 잠금 해제해 주세요.', true);
        return false;
      }
    }

    try {
      await this.sceneEl.enterVR();
      if (useCardboardFallback) {
        this.setCardboardModeActive(true);
        this.showMessage('카드보드 모드가 실행되었습니다. 휴대폰을 정확히 중앙에 맞추고 체험을 진행하세요.', false);
      } else {
        this.setCardboardModeActive(false);
        if (!this.supportsImmersiveVr) {
          this.showMessage('현재 브라우저에서는 완전한 VR 대신 360도 보기 모드가 제공될 수 있어요.', false);
        }
      }
      if (this.vrButton) {
        this.vrButton.blur();
      }
      return true;
    } catch (err) {
      console.error('VR enter failed:', err);
      const failureMessage = this.isIOS
        ? 'Safari에서 VR 모드 진입에 실패했습니다. iOS 최신 버전 또는 전용 VR 기기 사용을 권장합니다.'
        : '현재 브라우저에서는 VR 모드를 활성화할 수 없습니다.';
      this.showMessage(failureMessage, true);
      return false;
    }
  }

  autoStartGame() {
    this.ensureGameStarted({ silent: true });
  }

  async requestDeviceOrientationPermission() {
    const DeviceOrientation = window.DeviceOrientationEvent;
    if (!DeviceOrientation || typeof DeviceOrientation.requestPermission !== 'function') {
      return true;
    }
    try {
      const result = await DeviceOrientation.requestPermission();
      return result === 'granted';
    } catch (err) {
      console.warn('Device orientation permission request failed:', err);
      return false;
    }
  }

  showMessage(text, isError) {
    if (!this.messageEl) {
      return;
    }
    this.messageEl.textContent = text;
    this.messageEl.style.display = 'block';
    this.messageEl.classList.remove('alert-dark', 'alert-warning', 'alert-danger', 'text-white', 'text-dark');
    if (isError) {
      this.messageEl.classList.add('alert-danger', 'text-white');
    } else if (this.isIOS) {
      this.messageEl.classList.add('alert-dark', 'text-white');
    } else {
      this.messageEl.classList.add('alert-warning', 'text-dark');
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.mobileVRHelper = new MobileVRHelper();
});
