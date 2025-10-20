/**
 * UI 매니저 - 결과 표시 및 사용자 인터페이스 (Bootstrap 기반)
 */

const SCOREBOARD_KEY = 'trafficSafetyVR.scoreboard';
const PLAYER_NAME_KEY = 'trafficSafetyVR.playerName';
const CLASS_NAME_KEY = 'trafficSafetyVR.className';
const SCOREBOARD_MAX_HISTORY = 50;

class UIManager {
  constructor() {
    // DOM 요소
    this.hud = document.getElementById('hud');
    this.brakeIndicator = document.getElementById('brake-indicator');
    this.speedDisplay = document.getElementById('speed-display');
    this.distanceDisplay = document.getElementById('distance-display');
    this.obstacleDistanceHud = document.getElementById('obstacle-distance-hud');
    this.obstacleDistanceDisplay = document.getElementById('obstacle-distance-display');
    this.playerNameInput = document.getElementById('player-name');
    this.currentPlayerName = this.loadStoredPlayerName();
    if (this.playerNameInput && this.currentPlayerName) {
      this.playerNameInput.value = this.currentPlayerName;
    }
    this.classNameInput = document.getElementById('class-name');
    this.currentClassName = this.loadStoredClassName();
    if (this.classNameInput && this.currentClassName) {
      this.classNameInput.value = this.currentClassName;
    }

    // Bootstrap 모달 인스턴스 생성
    this.startScreenEl = document.getElementById('start-screen');
    this.startModal = new bootstrap.Modal(this.startScreenEl);

    this.resultScreenEl = document.getElementById('result-screen');
    this.resultModal = new bootstrap.Modal(this.resultScreenEl);
  }

  /**
   * 시작 화면 표시
   */
  showStartScreen() {
    this.hud.style.display = 'none';
    this.brakeIndicator.style.display = 'none';
    this.startModal.show();
    if (this.playerNameInput) {
      setTimeout(() => {
        this.playerNameInput.focus();
        this.playerNameInput.select();
      }, 300);
    }
  }

  /**
   * 게임 시작 - HUD 표시
   */
  startGame() {
    this.startModal.hide();
    this.hud.style.display = 'block';
    return this.preparePlayerProfile();
  }

  loadStoredPlayerName() {
    try {
      return localStorage.getItem(PLAYER_NAME_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  loadStoredClassName() {
    try {
      return localStorage.getItem(CLASS_NAME_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  preparePlayerProfile() {
    let name = this.playerNameInput ? this.playerNameInput.value.trim() : '';
    if (!name) {
      name = '플레이어';
    }
    this.currentPlayerName = name;
    try {
      localStorage.setItem(PLAYER_NAME_KEY, name);
    } catch (e) {
      console.warn('이름 저장에 실패했습니다.', e);
    }

    let className = this.classNameInput ? this.classNameInput.value.trim() : '';
    this.currentClassName = className;
    try {
      localStorage.setItem(CLASS_NAME_KEY, className);
    } catch (e) {
      console.warn('반 이름 저장에 실패했습니다.', e);
    }

    return { name, className };
  }

  getCurrentPlayerName() {
    return this.currentPlayerName || '플레이어';
  }

  getCurrentClassName() {
    return this.currentClassName || '';
  }

  escapeHtml(value) {
    if (!value) return '';
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /**
   * HUD 업데이트
   */
  updateHUD(speed, distance, obstacleDistance = null) {
    this.speedDisplay.textContent = Math.round(speed);
    this.distanceDisplay.textContent = Math.round(distance);

    // 어린이까지 거리 표시
    if (obstacleDistance !== null) {
      this.obstacleDistanceHud.style.display = 'block';
      const clearance = Math.max(0, obstacleDistance);
      this.obstacleDistanceDisplay.textContent = clearance.toFixed(1);

      // 거리에 따라 색상 클래스 변경 (Bootstrap 유틸리티 사용)
      this.obstacleDistanceHud.classList.remove('text-danger', 'text-warning', 'text-success');
      if (obstacleDistance <= 0) {
        this.obstacleDistanceHud.classList.add('text-danger'); // 완전 위험
      } else if (obstacleDistance < 2) {
        this.obstacleDistanceHud.classList.add('text-danger');
      } else if (obstacleDistance < 5) {
        this.obstacleDistanceHud.classList.add('text-warning'); // 주의
      } else {
        this.obstacleDistanceHud.classList.add('text-success'); // 안전권
      }
    } else {
      this.obstacleDistanceHud.style.display = 'none';
    }
  }

  /**
   * 브레이크 표시 애니메이션
   */
  showBrakeIndicator() {
    this.brakeIndicator.style.display = 'block';
    setTimeout(() => {
      this.brakeIndicator.style.display = 'none';
    }, 1000);
  }

  /**
   * 결과 화면 표시
   */
  showResult(gameData) {
    this.hud.style.display = 'none';
    const resultContent = document.getElementById('result-content');

    // 실격 처리
    if (gameData.reactionTime === -1) {
      resultContent.innerHTML = `
        <div class="card text-center mb-3 border-danger">
          <div class="card-header fs-5 bg-danger text-white">❌ 실격</div>
          <div class="card-body">
            <h2 class="card-title text-danger display-4 fw-bold">0점</h2>
            <p class="card-text fs-5"><strong>실격 처리</strong></p>
            <p class="card-text text-danger fw-bold">어린이가 나타나기 전에 브레이크를 밟았습니다!</p>
          </div>
        </div>

        <div class="alert alert-warning mt-4" role="alert">
          <h4 class="alert-heading">⚠️ 주의사항</h4>
          <p>
            실제 운전에서는 위험 상황이 발생했을 때만 브레이크를 밟아야 합니다.
            너무 일찍 브레이크를 밟으면 뒤차 추돌 위험이 있어요!
          </p>
          <p class="mb-0">
            어린이가 나타난 후에 빠르게 반응하는 것이 중요합니다.
          </p>
        </div>
      `;
      this.resultModal.show();
      return;
    }

    const safetyScore = gameData.safetyScore;

    const playerName = this.escapeHtml(gameData.playerName || this.getCurrentPlayerName());
    const playerClass = this.escapeHtml(gameData.playerClass || this.getCurrentClassName());
    const classBadge = playerClass
      ? `<span class="badge bg-secondary ms-2">${playerClass}</span>`
      : '';

    const scoreColor = (safetyScore.collision || gameData.noBrake)
      ? 'text-danger'
      : 'text-success';

    const reactionBadgeClass = gameData.reactionTime === null
      ? 'bg-secondary'
      : (gameData.reactionTime < 0.8 ? 'bg-success' : 'bg-danger');
    const reactionLabel = gameData.reactionTime === null
      ? '미측정'
      : `${gameData.reactionTime.toFixed(2)}초`;

    const makeGapBadge = (value) => {
      if (value === null || value === undefined) {
        return { cls: 'bg-secondary', label: '-' };
      }
      if (value < 0) {
        return { cls: 'bg-danger', label: `부족 ${Math.abs(value).toFixed(2)} m` };
      }
      if (value < 1) {
        return { cls: 'bg-warning text-dark', label: `남음 ${value.toFixed(2)} m` };
      }
      return { cls: 'bg-success', label: `남음 ${value.toFixed(2)} m` };
    };

    const brakeGapBadge = makeGapBadge(gameData.availableDistanceAtBrake);
    const finalGapBadge = makeGapBadge(gameData.finalClearance);
    let html = `
      <div class="card text-center mb-3">
        <div class="card-header fs-5">📊 ${playerName}님의 종합 평가${classBadge}</div>
        <div class="card-body">
          <h2 class="card-title ${scoreColor} display-4 fw-bold">${safetyScore.score}점</h2>
          <p class="card-text fs-5"><strong>${safetyScore.grade}</strong></p>
          <p class="card-text">${safetyScore.message}</p>
        </div>
      </div>
    `;

    if (gameData.noBrake) {
      html += `
        <div class="alert alert-danger mb-3" role="alert">
          🛑 브레이크 없이 위험 구간을 지나갔어요. 실제 도로에서는 즉시 감속하고 멈춰야 해요!
        </div>
      `;
    }

    html += `
      <ul class="list-group list-group-flush">
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <strong>⏱️ 반응 시간</strong>
          <span class="badge ${reactionBadgeClass} rounded-pill fs-6 text-white">${reactionLabel}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <strong>🚗 속도 (사고 직전)</strong>
          <span class="badge bg-secondary rounded-pill fs-6">${gameData.speed.toFixed(1)} km/h</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <strong>🛞 브레이크 시 확보 거리</strong>
          <span class="badge ${brakeGapBadge.cls} rounded-pill fs-6">${brakeGapBadge.label}</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <strong>📏 필요 제동 거리</strong>
          <span class="badge bg-secondary rounded-pill fs-6">${gameData.stoppingDistance.toFixed(2)} m</span>
        </li>
        <li class="list-group-item d-flex justify-content-between align-items-center">
          <strong>🏁 최종 남은 거리</strong>
          <span class="badge ${finalGapBadge.cls} rounded-pill fs-6">${finalGapBadge.label}</span>
        </li>
      </ul>

      <div class="alert alert-info mt-4" role="alert">
        <h4 class="alert-heading">💡 알아두세요!</h4>
        <p>
          차가 빠르게 달릴수록 멈추는 데 더 많은 거리가 필요해요.
          항상 안전거리를 유지하고, 어린이가 나타날 수 있는 곳에서는 속도를 줄이세요.
        </p>
        <hr>
        <p class="mb-0" style="font-size: 0.9rem;">
          총 정지 거리 = (반응거리: ${gameData.reactionDistance.toFixed(2)}m) + (제동거리: ${gameData.stoppingDistance.toFixed(2)}m)
        </p>
      </div>

      <div class="mt-4">
        <h4 class="fs-5 text-center">🏆 최고 점수 TOP 5</h4>
        <ol id="leaderboard-list" class="list-group list-group-numbered"></ol>
      </div>
    `;

    resultContent.innerHTML = html;
    // Render existing leaderboard data (local cache) while remote update runs.
    this.renderLeaderboard(this.loadLocalLeaderboard());
    this.resultModal.show();

    this.saveScoreRecord(gameData)
      .then((records) => this.renderLeaderboard(records))
      .catch((error) => {
        console.error('리더보드 업데이트 실패:', error);
        this.renderLeaderboard(this.loadLocalLeaderboard());
      });
  }

  isSupabaseReady() {
    return Boolean(window.SUPABASE_ENABLED && window.supabaseClient);
  }

  async initializeLeaderboard() {
    try {
      const records = await this.fetchLeaderboard();
      this.renderLeaderboard(records);
    } catch (error) {
      console.error('초기 리더보드 로딩 실패:', error);
      this.renderLeaderboard(this.loadLocalLeaderboard());
    }
  }

  createScoreRecord(gameData) {
    const safetyScore = gameData.safetyScore || {};
    const rawName = (gameData.playerName || this.getCurrentPlayerName() || '').toString();
    const safeName = rawName.trim().slice(0, 24) || '플레이어';
    const rawClass = (gameData.playerClass || this.getCurrentClassName() || '').toString();
    const safeClass = rawClass.trim().slice(0, 40);

    return {
      name: safeName,
      score: typeof safetyScore.score === 'number' ? safetyScore.score : 0,
      grade: safetyScore.grade || '',
      reactionTime: typeof gameData.reactionTime === 'number' ? gameData.reactionTime : null,
      finalClearance: typeof gameData.finalClearance === 'number' ? gameData.finalClearance : null,
      className: safeClass,
      timestamp: Date.now()
    };
  }

  loadLocalHistory() {
    try {
      const raw = localStorage.getItem(SCOREBOARD_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(parsed)) return [];
      return parsed.map((entry) => ({
        ...entry,
        className: typeof entry.className === 'string' ? entry.className : ''
      }));
    } catch (error) {
      console.warn('로컬 리더보드 로딩 실패:', error);
      return [];
    }
  }

  storeLocalHistory(history) {
    try {
      localStorage.setItem(SCOREBOARD_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('로컬 리더보드 저장 실패:', error);
    }
  }

  loadLocalLeaderboard(limit = 5) {
    const history = this.loadLocalHistory();
    return history.slice(0, limit);
  }

  saveScoreLocally(record) {
    const history = this.loadLocalHistory();
    history.push(record);
    history.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const aRt = typeof a.reactionTime === 'number' ? a.reactionTime : Number.POSITIVE_INFINITY;
      const bRt = typeof b.reactionTime === 'number' ? b.reactionTime : Number.POSITIVE_INFINITY;
      if (aRt !== bRt) return aRt - bRt;
      return (a.timestamp || 0) - (b.timestamp || 0);
    });

    const trimmed = history.slice(0, SCOREBOARD_MAX_HISTORY);
    this.storeLocalHistory(trimmed);
    return trimmed.slice(0, 5);
  }

  async fetchLeaderboard(limit = 5) {
    if (this.isSupabaseReady()) {
      try {
        const { data, error } = await window.supabaseClient
          .from('scores')
          .select('player_name, class_name, score, reaction_time, final_clearance, created_at')
          .order('score', { ascending: false })
          .order('reaction_time', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: true })
          .limit(limit);

        if (error) throw error;

        return (data || []).map((row) => ({
          name: row.player_name || '플레이어',
          score: typeof row.score === 'number' ? row.score : Number(row.score) || 0,
          grade: '',
          reactionTime: typeof row.reaction_time === 'number'
            ? row.reaction_time
            : (row.reaction_time !== null ? Number(row.reaction_time) : null),
          finalClearance: typeof row.final_clearance === 'number'
            ? row.final_clearance
            : (row.final_clearance !== null ? Number(row.final_clearance) : null),
          className: typeof row.class_name === 'string' ? row.class_name : '',
          timestamp: row.created_at || null
        }));
      } catch (error) {
        console.error('Supabase 리더보드 조회 실패:', error);
      }
    }

    return this.loadLocalLeaderboard(limit);
  }

  async saveScoreRecord(gameData) {
    const safetyScore = gameData.safetyScore;
    if (!safetyScore) {
      return this.fetchLeaderboard();
    }

    const record = this.createScoreRecord(gameData);

    if (this.isSupabaseReady()) {
      try {
        const { error } = await window.supabaseClient
          .from('scores')
          .insert({
            player_name: record.name,
            score: record.score,
            reaction_time: record.reactionTime,
            final_clearance: record.finalClearance,
            class_name: record.className || null
          });

        if (error) throw error;
        return await this.fetchLeaderboard();
      } catch (error) {
        console.error('Supabase 점수 저장 실패:', error);
      }
    }

    return this.saveScoreLocally(record);
  }

  renderLeaderboard(records) {
    const listEl = document.getElementById('leaderboard-list');
    if (!listEl) return;

    listEl.innerHTML = '';

    if (!records || records.length === 0) {
      const li = document.createElement('li');
      li.className = 'list-group-item text-center text-muted';
      li.textContent = '첫 기록을 남겨보세요!';
      listEl.appendChild(li);
      return;
    }

    records.forEach((record) => {
      const li = document.createElement('li');
      li.className = 'list-group-item';

      const topRow = document.createElement('div');
      topRow.className = 'd-flex justify-content-between align-items-center';
      const nameSpan = document.createElement('span');
      nameSpan.className = 'fw-semibold';
      const displayName = record.className
        ? `${record.name} (${record.className})`
        : record.name;
      nameSpan.textContent = displayName;
      const scoreSpan = document.createElement('span');
      scoreSpan.className = 'fw-bold';
      scoreSpan.textContent = `${record.score}점`;

      topRow.appendChild(nameSpan);
      topRow.appendChild(scoreSpan);
      li.appendChild(topRow);

      const subRow = document.createElement('div');
      subRow.className = 'd-flex justify-content-between align-items-center text-muted small mt-1';
      const reactionText = typeof record.reactionTime === 'number'
        ? `반응 ${record.reactionTime.toFixed(2)}초`
        : '반응 미측정';
      const reactionSpan = document.createElement('span');
      reactionSpan.textContent = reactionText;

      const dateSpan = document.createElement('span');
      if (record.timestamp) {
        const date = new Date(record.timestamp);
        if (!Number.isNaN(date.getTime())) {
          dateSpan.textContent = `${date.getMonth() + 1}/${date.getDate()}`;
        }
      }

      subRow.appendChild(reactionSpan);
      subRow.appendChild(dateSpan);
      li.appendChild(subRow);

      listEl.appendChild(li);
    });
  }

  /**
   * 게임 리셋
   */
  reset() {
    this.resultModal.hide();
    // 모달이 완전히 사라진 후 시작 모달을 표시
    this.resultScreenEl.addEventListener('hidden.bs.modal', () => {
      this.showStartScreen();
    }, { once: true });
  }
}

// 전역 인스턴스 생성 및 게임 초기화
window.addEventListener('load', () => {
  // UI 매니저와 게임 로직 인스턴스 생성
  window.uiManager = new UIManager();
  window.game = new TrafficSafetyGame();

  // 페이지 로드 시 시작 모달 바로 표시
  window.uiManager.showStartScreen();
  window.uiManager.initializeLeaderboard();

  console.log('🎮 교통안전 VR 게임이 준비되었습니다!');
  console.log('👉 스페이스바 또는 화면 탭으로 브레이크를 밟으세요!');
});
