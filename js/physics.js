/**
 * 물리 엔진 - 제동거리 계산
 */

class PhysicsEngine {
  constructor() {
    // 물리 상수
    this.GRAVITY = 9.8; // m/s²
    this.FRICTION_COEFFICIENT = 0.7; // 마찰계수 (아스팔트)
    this.REACTION_TIME = 0.7; // 평균 반응시간 (초)
  }

  /**
   * km/h를 m/s로 변환
   */
  kmhToMs(kmh) {
    return kmh / 3.6;
  }

  /**
   * m/s를 km/h로 변환
   */
  msToKmh(ms) {
    return ms * 3.6;
  }

  /**
   * 제동거리 계산 (실제 물리 공식 사용)
   * 제동거리 = 반응거리 + 정지거리
   * 반응거리 = 속도 × 반응시간
   * 정지거리 = v² / (2 × μ × g)
   *
   * @param {number} speedKmh - 현재 속도 (km/h)
   * @param {number} reactionTime - 실제 반응시간 (초)
   * @return {object} 제동 관련 데이터
   */
  calculateBrakingDistance(speedKmh, reactionTime) {
    const speedMs = this.kmhToMs(speedKmh);

    // 반응거리 (차량이 반응시간 동안 이동하는 거리)
    const reactionDistance = speedMs * reactionTime;

    // 정지거리 (브레이크를 밟은 후 완전히 멈추기까지의 거리)
    const stoppingDistance = Math.pow(speedMs, 2) /
                            (2 * this.FRICTION_COEFFICIENT * this.GRAVITY);

    // 총 제동거리
    const totalBrakingDistance = reactionDistance + stoppingDistance;

    return {
      reactionDistance: reactionDistance,
      stoppingDistance: stoppingDistance,
      totalDistance: totalBrakingDistance,
      speedMs: speedMs,
      speedKmh: speedKmh,
      reactionTime: reactionTime
    };
  }

  /**
   * 현재 속도에서 감속 계산
   * @param {number} currentSpeed - 현재 속도 (m/s)
   * @param {number} deltaTime - 프레임 시간 (초)
   * @return {number} 새로운 속도 (m/s)
   */
  calculateDeceleration(currentSpeed, deltaTime) {
    const deceleration = this.FRICTION_COEFFICIENT * this.GRAVITY;
    const newSpeed = Math.max(0, currentSpeed - deceleration * deltaTime);
    return newSpeed;
  }

  /**
   * 충돌 감지
   * @param {object} vehiclePos - 차량 위치 {x, y, z}
   * @param {object} obstaclePos - 장애물 위치 {x, y, z}
   * @param {number} threshold - 충돌 임계값 (미터)
   * @return {boolean} 충돌 여부
   */
  checkCollision(vehiclePos, obstaclePos, threshold = 1.5) {
    const distance = Math.sqrt(
      Math.pow(vehiclePos.x - obstaclePos.x, 2) +
      Math.pow(vehiclePos.z - obstaclePos.z, 2)
    );
    return distance < threshold;
  }

  /**
   * 안전 점수 계산
   * @param {object} params - 평가 파라미터
   * @param {number} params.requiredBrakingDistance - 브레이크 이후 필요한 제동 거리 (m)
   * @param {number} params.availableDistanceAtBrake - 브레이크 시점의 실제 확보 거리 (m, 앞범퍼 기준)
   * @param {number} params.finalClearance - 완전히 멈춘 후 남은 거리 (m, 앞범퍼 기준)
   * @param {?number} params.reactionTime - 실제 반응 시간 (초). 측정 못한 경우 null
   * @param {boolean} params.collision - 게임 중 충돌 여부
   * @param {boolean} params.noBrake - 브레이크 입력 없이 통과했는지 여부
   * @return {object} 점수 및 평가
   */
  calculateSafetyScore({
    requiredBrakingDistance,
    availableDistanceAtBrake,
    finalClearance,
    reactionTime,
    collision = false,
    noBrake = false
  }) {
    let score = 100;
    let grade = '최우수';
    let message = '완벽한 대응입니다!';

    return {
      score: null,
      grade: null,
      message: null,
      safetyMargin: null,
      collision: collision || (typeof finalClearance === 'number' && finalClearance <= 0),
      finalClearance,
      availableDistanceAtBrake: (typeof availableDistanceAtBrake === 'number')
        ? availableDistanceAtBrake
        : finalClearance ?? 0,
      reactionTime
    };
  }
}

// 전역 물리 엔진 인스턴스
window.physicsEngine = new PhysicsEngine();
