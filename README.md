# Readery

기술 글을 모아 한국어로 요약하고, 모르는 용어는 여백 각주로 풀어 주는 개인 읽기 공간. 읽은 글은 내 위키(Obsidian 볼트)와 그래프로 이어진다.

> 만드는 중. 지금은 관심 필터 파일럿만 있다.

## 관심 필터 파일럿

피드 글 100개(한국어 46 · 영어 54)를 [TypeSafe](https://typesafe.ai) Jev로 판정해 라벨과 비교했다. 관심사는 프론트엔드 · 백엔드 · 시스템 디자인 · 웹 · 오픈소스.

| | 한국어 | 영어 |
|---|---|---|
| 정확도 (통과·걸러짐으로 판정한 글 기준) | 91% | 100% |
| 놓친 관심 글 | 0 / 17 | 0 / 8 |

라벨은 사용자가 맡겨 Claude가 붙인 대리 라벨이다. 전체 수치는 [`data/labels/pilot-report.txt`](data/labels/pilot-report.txt).

```bash
npm install
echo "TYPESAFE_API_KEY=..." > .env
npm run pilot:eval   # 캐시된 판정으로 다시 채점한다. 관심사를 바꾸면 API를 다시 부른다
```
