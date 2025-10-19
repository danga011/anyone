# 🐛 디버깅 가이드

## 어린이가 안 나오는 문제 해결

### 증상
- 2번에 1번씩 어린이가 나타나지 않음
- 콘솔에 로그가 찍히지 않음

### 원인 분석 및 수정사항

#### 1. 타이밍 문제 (✅ 수정됨)
**문제**: `currentTime`(절대 시간)과 `randomDelay`(상대 시간) 비교 오류

**수정 전**:
```javascript
if (!this.obstacleSpawned && currentTime > this.randomDelay) {
  this.spawnObstacle();
}
```

**수정 후**:
```javascript
const elapsedSinceStart = currentTime - this.gameStartTime;
if (!this.obstacleSpawned && elapsedSinceStart > this.randomDelay) {
  this.spawnObstacle();
}
```

#### 2. 재시작 시 상태 미리셋 (✅ 수정됨)
**문제**: 게임 재시작 시 `obstacleSpawned` 플래그가 리셋 안 됨

**수정**: `restart()` 함수에서 모든 상태 변수 명시적 리셋
```javascript
this.obstacleSpawned = false;
this.obstacleRunning = false;
this.isBraking = false;
this.obstacleBody = null;
// ... 등
```

### 디버깅 로그 확인

게임을 실행하고 브라우저 콘솔(F12)을 열면 다음 순서로 로그가 나타나야 합니다:

```
1. 🚸 어린이 보호구역입니다! 속도 제한: 30 km/h
2. ⏰ 어린이 등장 예정 시간: 3.2초 후
3. (3.2초 대기)
4. ✅ 조건 충족: 경과 시간 3.2초 > 딜레이 3.2초
5. 🎬 spawnObstacle() 함수 실행!
6.    방향: 왼쪽
7. ✅ DOM에 어린이 엘리먼트 추가 완료
8. 🏃 어린이가 왼쪽 인도에서 뛰어나옵니다!
9.    위치: x=-4.5, z=-25
10.   차량 위치: z=-10.5
11.   차량 속도: 30.0 km/h, 어린이 속도: 3.5 m/s
12. ✅ 어린이 애니메이션 준비 완료
13. 🏃‍♂️ 애니메이션 시작: 총 거리 3.2m, 속도 3.5 m/s
```

### 로그가 안 나오는 경우 확인사항

#### 1. gameStartTime이 설정되었는지 확인
```javascript
console.log('gameStartTime:', this.gameStartTime);
```

#### 2. 게임 루프가 실행되는지 확인
```javascript
// gameLoop() 첫 줄에 추가
console.log('게임 루프 실행 중...');
```

#### 3. obstacleSpawned 플래그 확인
```javascript
console.log('obstacleSpawned:', this.obstacleSpawned);
console.log('elapsedSinceStart:', elapsedSinceStart);
console.log('randomDelay:', this.randomDelay);
```

### 수동 테스트

콘솔에서 직접 어린이를 소환할 수 있습니다:
```javascript
// 게임이 실행 중일 때
window.game.spawnObstacle();
```

### 자주 발생하는 오류

#### 오류 1: "Cannot read property 'appendChild' of null"
**원인**: `obstaclesContainer`가 로드되지 않음
**해결**: 페이지가 완전히 로드된 후 게임 시작

#### 오류 2: 어린이가 보이지 않음 (DOM은 추가됨)
**원인**: 위치가 카메라 시야 밖
**해결**:
- 차량 위치 확인 (`this.position`)
- 장애물 위치 확인 (`this.obstaclePosition = -25`)
- 차량이 z=-25 근처에 있어야 함

#### 오류 3: 애니메이션이 작동하지 않음
**원인**: 엘리먼트 참조 실패
**로그 확인**: "✅ 어린이 애니메이션 준비 완료"가 나타나는지

### 해결 체크리스트

- [ ] 콘솔에 에러가 없는지 확인
- [ ] "🎬 spawnObstacle() 함수 실행!" 로그 나타나는지
- [ ] "✅ DOM에 어린이 엘리먼트 추가 완료" 로그 나타나는지
- [ ] A-Frame 씬에서 어린이가 시각적으로 보이는지
- [ ] VR 모드에서도 동일하게 작동하는지

### 강제 테스트 코드

어린이가 확실히 나오도록 강제하려면:

```javascript
// game.js의 getRandomDelay() 수정
getRandomDelay() {
  return 1000; // 항상 1초 후 등장
}
```

### 성능 문제 확인

프레임 레이트가 너무 낮으면 게임 루프가 제대로 실행되지 않을 수 있습니다.

```javascript
// 프레임 레이트 측정
let frameCount = 0;
let lastFpsUpdate = performance.now();

// gameLoop()에 추가
frameCount++;
if (currentTime - lastFpsUpdate > 1000) {
  console.log(`FPS: ${frameCount}`);
  frameCount = 0;
  lastFpsUpdate = currentTime;
}
```

최소 30 FPS 이상이어야 정상 작동합니다.

---

**참고**: 모든 수정사항이 적용된 현재 버전에서는 어린이가 100% 등장해야 합니다.
만약 여전히 문제가 발생한다면 위 디버깅 로그를 확인하고 이슈를 리포트해주세요.
