# anyone

# 교통안전 VR 운전 체험 게임

브라우저에서 실행 가능한 WebXR 기반 교통안전 교육 VR 게임입니다.

## 팀 소개와 문제의식

anyone 팀(팀장 이건용)은 카카오임팩트 챌린지에서, 좁은 이면도로를 도보로 하교하는 초등 저학년 아이들이 불법주정차 차량 때문에 시야를 잃고 사고 위험에 노출되는 문제를 해결하고자 이 교육용 게임을 기획했습니다.
- 골목 형태, 차량 배치, 어린이 동선을 실제 사례에 맞춰 재현했습니다.
- 플레이어가 운전자 시점에서 위험 상황을 체험하며 안전 운전 행동을 학습하도록 설계했습니다.

## 프로젝트 개요

어린이들이 운전자 시점에서 교통안전을 체험하고, 반응시간과 제동거리의 중요성을 배울 수 있는 교육용 VR 게임입니다.

**핵심 교육 포인트:**
- 불법주정차 차량으로 인한 시야 확보 문제
- 인도에서 갑자기 뛰어나오는 어린이
- 주차된 차량 사이에서 예측 불가능한 상황 발생

## 주요 기능

### 1. **VR 운전자 시점 (SUV)**
- A-Frame을 사용한 몰입형 3D 환경
- **SUV 운전자 시점**: 카메라 높이 1.8m (일반 승용차보다 약 60cm 높음)
- 운전대 표시로 몰입감 향상
- 실제 한국형 이면도로 재현
- **리얼한 도로 환경:**
  - 아스팔트 질감의 도로 (점선 중앙선, 흰색 가장자리선)
  - 콘크리트 블록 패턴의 인도
  - 상가 건물, 편의점, 아파트, 빌딩
  - 나무, 가로등, 쓰레기통, 전봇대
  - 안개 효과 및 실감나는 조명
- **불법주정차 차량 4대:**
  - 좌측: 검은색 세단, 흰색 SUV
  - 우측: 은색 세단, 파란색 해치백
  - 장애물 등장 지점 근처에 배치되어 시야 차단
- PC/모바일/VR 헤드셋 호환

### 2. **물리 기반 시뮬레이션**
- 실제 제동거리 공식 적용:
  - 총 제동거리 = 반응거리 + 정지거리
  - 반응거리 = 속도 × 반응시간
  - 정지거리 = v² / (2μg)
- 마찰계수 0.7 (아스팔트 도로)

### 3. **랜덤 이벤트**
- 2-5초 사이 무작위 타이밍에 장애물 등장
- 인도에서 도로로 뛰어나오는 어린이 캐릭터 애니메이션
- 왼쪽/오른쪽 인도에서 랜덤하게 등장
- **실제 물리 기반 움직임:**
  - 어린이 달리기 속도: 3.5 m/s (12.6 km/h)
  - 차량 속도: 30-50 km/h
  - 속도 비율이 실제 상황과 유사하게 구현
- **리얼한 달리기 애니메이션:**
  - 팔 스윙: 60도 범위로 앞뒤 움직임
  - 다리 움직임: 50도 범위로 교차 스윙
  - 몸통 흔들림 및 상하 움직임
  - 2.5 사이클/초의 자연스러운 보폭

### 4. **반응시간 측정**
- 장애물 등장 시점부터 브레이크 입력까지 정밀 측정
- 밀리초 단위 기록

### 5. **상세한 결과 분석**
- 반응시간
- 주행 속도
- 총 정지거리 (반응거리 + 제동거리)
- 안전 여유 거리
- 종합 안전 점수 및 등급

## 실행 방법

### 로컬 서버로 실행 (권장)

A-Frame은 보안상 로컬 파일 시스템에서 직접 실행되지 않으므로, 반드시 웹 서버를 통해 실행해야 합니다.

#### 방법 1: Python 내장 서버
```bash
# Python 3
cd traffic-safety-vr
python -m http.server 8000

# 브라우저에서 http://localhost:8000 접속
```

#### 방법 2: Node.js http-server
```bash
# http-server 설치
npm install -g http-server

# 서버 실행
cd traffic-safety-vr
http-server -p 8000

# 브라우저에서 http://localhost:8000 접속
```

#### 방법 3: VS Code Live Server
1. VS Code에서 "Live Server" 확장 설치
2. index.html 우클릭 → "Open with Live Server"

### VR 헤드셋으로 실행

1. 위 방법으로 로컬 서버 실행
2. 같은 Wi-Fi 네트워크에서 컴퓨터 IP 주소 확인
3. VR 헤드셋 브라우저에서 `http://[컴퓨터IP]:8000` 접속
4. VR 모드 버튼 클릭 (화면 우측 하단)

## 조작법

### PC
- **스페이스바**: 브레이크

### 모바일/터치스크린
- **화면 탭**: 브레이크

### VR 컨트롤러
- **트리거 버튼**: 브레이크

### VR 시점 조작
- **마우스 드래그** (PC): 시점 회전
- **터치 드래그** (모바일): 시점 회전
- **머리 움직임** (VR 헤드셋): 자연스러운 시점 변경

## 프로젝트 구조

```
traffic-safety-vr/
├── index.html              # 메인 HTML (A-Frame 씬 및 UI)
├── js/
│   ├── game.js            # 게임 메인 로직
│   ├── physics.js         # 물리 엔진 및 제동거리 계산
│   └── ui.js              # UI 매니저 및 결과 표시
├── assets/                # 에셋 폴더 (선택사항)
│   └── sounds/
│       └── brake.mp3
└── README.md
```

## 기술 스택

- **A-Frame 1.5.0**: WebVR/WebXR 프레임워크
- **A-Frame Extras 7.2.0**: 추가 컴포넌트 및 유틸리티
- **Vanilla JavaScript**: 순수 자바스크립트 (프레임워크 없음)
- **WebXR API**: VR 헤드셋 지원

## 코드 구조 설명

### 1. physics.js - 물리 엔진

```javascript
class PhysicsEngine {
  // 제동거리 계산
  calculateBrakingDistance(speedKmh, reactionTime)

  // 감속 계산
  calculateDeceleration(currentSpeed, deltaTime)

  // 충돌 감지
  checkCollision(vehiclePos, obstaclePos, threshold)

  // 안전 점수 계산
  calculateSafetyScore({ requiredBrakingDistance, availableDistanceAtBrake, finalClearance, reactionTime, collision, noBrake })
}
```

**핵심 공식:**
```javascript
// 반응거리
reactionDistance = speedMs × reactionTime

// 정지거리
stoppingDistance = v² / (2 × μ × g)
// μ = 0.7 (아스팔트 마찰계수)
// g = 9.8 m/s²

// 총 제동거리
totalDistance = reactionDistance + stoppingDistance
```

### 2. game.js - 게임 로직

```javascript
class TrafficSafetyGame {
  // 게임 시작
  start()

  // 랜덤 장애물 생성
  spawnObstacle()

  // 브레이크 입력 처리
  brake()

  // 게임 루프 (60 FPS)
  gameLoop()

  // 결과 계산 및 표시
  endGame()
}
```

**게임 플로우:**
1. 사용자가 "게임 시작" 클릭
2. 30-50 km/h 속도로 자동 주행
3. 2-5초 후 랜덤 위치에 장애물 등장
4. 사용자가 스페이스바/터치로 브레이크
5. 반응시간 측정 및 물리 기반 감속
6. 충돌 여부 판정 및 결과 표시

### 3. ui.js - UI 매니저

```javascript
class UIManager {
  // HUD 업데이트 (속도, 거리)
  updateHUD(speed, distance)

  // 브레이크 표시
  showBrakeIndicator()

  // 결과 화면 생성 및 표시
  showResult(gameData)
}
```

## 🎨 커스터마이징 가이드

### 속도 변경
```javascript
// game.js의 start() 함수에서
this.speed = 30 + Math.random() * 20; // 30-50 km/h
// 원하는 범위로 수정
```

### 장애물 등장 시간 조정
```javascript
// game.js의 getRandomDelay() 함수에서
return 2000 + Math.random() * 3000; // 2-5초
// 원하는 범위로 수정
```

### 어린이 달리기 속도 조정
```javascript
// game.js의 constructor에서
this.obstacleRunSpeed = 3.5; // 어린이 달리기 속도 (m/s)
// 실제 어린이: 3-4 m/s
// 성인: 5-6 m/s
```

### 카메라 높이 변경 (차량 종류)
```javascript
// index.html과 game.js에서
// 현재: 1.8m (SUV)
// 일반 승용차: 1.2m
// 트럭: 2.2m
```

### 도로 환경 변경
```html
<!-- index.html의 A-Frame 씬에서 -->
<!-- 건물, 나무, 가로등 등의 위치/색상 수정 -->
<a-box position="-6 2 -10" width="3" height="4" depth="5" color="#BCAAA4"></a-box>
```

### 장애물 디자인 변경
```javascript
// game.js의 spawnObstacle() 함수에서
// 현재는 박스 조합으로 어린이 캐릭터 생성
// 원하는 3D 모델로 교체 가능
```

### 3D 모델 추가 (선택사항)
```html
<!-- index.html의 a-assets에서 -->
<a-assets>
  <a-asset-item id="child-model" src="assets/models/child.gltf"></a-asset-item>
</a-assets>

<!-- 장애물로 사용 -->
<a-entity gltf-model="#child-model"></a-entity>
```

## 📱 배포 방법

### GitHub Pages로 배포

1. GitHub 저장소 생성
2. 프로젝트 파일 업로드
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin [저장소 URL]
git push -u origin main
```

3. Settings → Pages → Source를 "main" 브랜치로 설정
4. 배포된 URL로 접속 (예: `https://username.github.io/traffic-safety-vr/`)

### Netlify로 배포

1. [Netlify](https://www.netlify.com/) 회원가입
2. "New site from Git" 클릭
3. GitHub 저장소 연결
4. 자동 배포 완료

### Vercel로 배포

1. [Vercel](https://vercel.com/) 회원가입
2. "New Project" 클릭
3. GitHub 저장소 연결
4. 자동 배포 완료

## 📖 학습 자료

### A-Frame 공식 문서
- **시작하기**: https://aframe.io/docs/1.5.0/introduction/
- **튜토리얼**: https://aframe.io/docs/1.5.0/guides/
- **컴포넌트 API**: https://aframe.io/docs/1.5.0/core/component.html
- **예제 모음**: https://aframe.io/examples/showcase/

### Three.js 리소스
- **공식 문서**: https://threejs.org/docs/
- **예제**: https://threejs.org/examples/
- **WebXR 샘플**: https://threejs.org/examples/?q=webxr

### WebXR API
- **MDN 가이드**: https://developer.mozilla.org/en-US/docs/Web/API/WebXR_Device_API
- **WebXR 샘플**: https://immersive-web.github.io/webxr-samples/

### 무료 3D 모델 리소스
- **Sketchfab (Korea Street)**: https://sketchfab.com/tags/korea-street
- **Poly Pizza**: https://poly.pizza/
- **Free3D**: https://free3d.com/

### 물리 공식 참고
- **제동거리 계산**: https://en.wikipedia.org/wiki/Braking_distance
- **도로교통공단 자료**: https://www.koroad.or.kr/

## 🐛 문제 해결

### A-Frame이 로드되지 않음
- 반드시 웹 서버를 통해 실행 (로컬 파일로 직접 열지 말 것)
- 브라우저 콘솔에서 CORS 에러 확인

### VR 모드 버튼이 보이지 않음
- WebXR 지원 브라우저 사용 (Chrome, Edge, Firefox)
- HTTPS 환경 필요 (로컬호스트는 예외)

### 장애물이 보이지 않음
- 브라우저 콘솔에서 JavaScript 에러 확인
- A-Frame Inspector로 씬 구조 확인 (`Ctrl+Alt+I`)

### VR 헤드셋에서 실행 안 됨
- 같은 Wi-Fi 네트워크 확인
- 방화벽 설정 확인
- HTTPS 배포 권장

## 🎓 교육 활용 가이드

### 수업 활용 예시

1. **도입 (10분)**
   - 교통안전의 중요성 설명
   - 제동거리 개념 소개

2. **체험 (20분)**
   - 학생들이 개별적으로 VR 게임 체험
   - 여러 번 시도하며 반응시간 개선

3. **분석 (15분)**
   - 결과 화면 함께 보며 토론
   - 속도와 제동거리의 관계 이해
   - 반응시간의 중요성 강조

4. **정리 (5분)**
   - 배운 내용 정리
   - 실제 교통안전 행동 다짐

### 확장 아이디어

- 다양한 날씨 조건 추가 (비, 눈, 야간)
- 여러 난이도 레벨 (주정차 차량 수 증가, 속도 증가)
- 리더보드 (반응시간 순위)
- 멀티플레이어 모드
- 실제 교통상황 시나리오 (횡단보도, 교차로 등)
- 불법주정차 교육 모드 (주차 가능/불가능 구역 표시)
- 다양한 장애물 (공, 반려동물, 킥보드 등)

## 📄 라이선스

MIT License - 교육 목적으로 자유롭게 사용 가능합니다.

## 🤝 기여

이슈 및 Pull Request 환영합니다!

## 📞 문의

프로젝트 관련 문의사항은 이슈로 등록해주세요.

---

**만든이**: 당현송 (anyone 팀)  
**버전**: 1.0.0  
**최종 수정**: 2025-10-01
