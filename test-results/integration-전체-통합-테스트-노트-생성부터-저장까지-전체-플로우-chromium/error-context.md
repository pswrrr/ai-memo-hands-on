# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - heading "AI 메모장" [level=1] [ref=e6]
        - heading "로그인" [level=2] [ref=e7]
        - paragraph [ref=e8]: AI 메모장에 로그인하여 메모를 관리하세요
      - generic [ref=e10]:
        - heading "로그인" [level=2] [ref=e11]
        - generic [ref=e12]:
          - generic [ref=e13]:
            - generic [ref=e14]: 이메일
            - textbox "이메일" [ref=e15]:
              - /placeholder: example@email.com
          - generic [ref=e16]:
            - generic [ref=e17]: 비밀번호
            - generic [ref=e18]:
              - textbox "비밀번호" [ref=e19]:
                - /placeholder: 비밀번호 입력
              - button "비밀번호 보기" [ref=e20]:
                - img [ref=e21]
          - button "로그인" [ref=e24]
        - generic [ref=e25]:
          - link "비밀번호를 잊으셨나요?" [ref=e27] [cursor=pointer]:
            - /url: /auth/reset-password
          - paragraph [ref=e28]:
            - text: 계정이 없으신가요?
            - link "회원가입" [ref=e29] [cursor=pointer]:
              - /url: /auth/signup
    - paragraph [ref=e31]: © 2024 AI 메모장. 모든 권리 보유.
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e37] [cursor=pointer]:
    - img [ref=e38]
  - alert [ref=e41]
```