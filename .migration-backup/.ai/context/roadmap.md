# Roadmap

> _Placeholder — to be elaborated incrementally after Sprint 0._

## Roadmap Principles

1. **Sprints are sequential and gated.** Each sprint depends on the prior.
2. **No sprint begins until the previous is reviewed.**
3. **Infrastructure before features.** DB → Backend → Frontend → Admin → AI → SEO → Tests → Deploy.
4. **Search and scoring are first-class features**, not afterthoughts.
5. **SEO is engineered in**, not bolted on.

## Sprint Sequence

| Sprint | Code                    | Theme                                |
| ------ | ----------------------- | ------------------------------------ |
| 0      | `Sprint_00.md`          | Repository initialization            |
| 1      | `Sprint_01_Database.md` | PostgreSQL schema, migrations, RLS   |
| 2      | `Sprint_02_Backend.md`  | NestJS API skeleton + core modules   |
| 3      | `Sprint_03_Search.md`   | Product & ingredient search          |
| 4      | `Sprint_04_Scoring.md`  | Quality scoring & healthier alternatives |
| 5      | `Sprint_05_Frontend.md` | Public Next.js app                   |
| 6      | `Sprint_06_Admin.md`    | Admin console                        |
| 7      | `Sprint_07_AI.md`       | AI explanations & search            |
| 8      | `Sprint_08_SEO.md`      | SEO infrastructure                   |
| 9      | `Sprint_09_Testing.md`  | Test hardening, e2e                  |
| 10     | `Sprint_10_Deployment.md` | CI/CD, Vercel, runtime infra        |

## Quarter Goals (Provisional)

### Q1
- DB, API, search, basic web MVP

### Q2
- Scoring, AI explanations, admin, public launch

### Q3
- SEO expansion, comparisons, deep linking

### Q4
- Scale, edge cache, personalization, US rollout

---

_See also: `../prompts/`._
