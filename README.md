# 시작하는 방법 (택1)
- 선언적 스타일
- 프로그래밍 스타일

## 주의 사항
- n8n은 ts를 적용하여, 엄격하게 형식의 준수할 것을 요구합니다.
- eslint를 사용하여, 오류가 있는지 작업과정에서 늘 체크하세요.

## 선언적 스타일

단계별로 따라하기 쉬운 매뉴얼입니다. [선언적 스타일 따라하기 매뉴얼](https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/#prerequisites).

1. [새 저장소 생성](https://github.com/n8n-io/n8n-nodes-starter/generate) 이 템플릿 저장소에서 나의 github로 생성하세요.
2. 새로운 repo를 복제하세요.:
   ```
   git clone https://github.com/<your organization>/<your-repo-name>.git
   ```
3. 종속성을 설치하기 위해 실행합니다. `pnpm i`
4. vscode에서 프로젝트를 여세요.
5. `/nodes` 폴더와 `/credentials` 두개의 폴더를 자신의 노드로 대체합니다.
6. `package.json`을 나의 세부정보로 업데이트 하세요.
7. `pnpm lint` 명령어를 실행하여, 오류를 확인하세요. `pnpm lintfix` 명령어는 오류를 자동으로 수정합니다.
8. 로컬에서 노드를 테스트하세요. [로컬에서 노드 실행 매뉴얼](https://docs.n8n.io/integrations/creating-nodes/test/run-node-locally/)
11. 작업이 다 끝나셨다면 NPM 커뮤니티에 게시하세요. [npmjs.com에 게시](https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry)
