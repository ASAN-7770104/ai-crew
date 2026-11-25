---
name: release-check
description: "A check before deployment: tests, data, secrets, rollback and monitoring. Use before a release. Проверка перед выкладкой: тесты, данные, секреты, откат и наблюдение."
---

# Release check
- [ ] Tests were run now, the result is attached.
- [ ] Changes were reviewed; it is clear what and why.
- [ ] No secrets or personal data in the code or history.
- [ ] Data changes are reversible or there is a verified copy.
- [ ] Rollback is described: commands and who runs them.
- [ ] It is clear how to notice a failure in the first hour.
- [ ] A person has explicitly approved the deployment.
Mark an unchecked item "not checked"; do not tick it.

Answer in the user's language.
