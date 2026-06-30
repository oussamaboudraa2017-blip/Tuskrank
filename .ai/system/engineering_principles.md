# Engineering Principles

## 1. Simplicity Over Cleverness

Write code that a junior developer can understand on first read. Avoid premature optimization, over-abstraction, and clever tricks that sacrifice readability. The best code is the code that is easiest to maintain.

## 2. Data Integrity First

The value of Tuskrank lives in its data. Every decision — schema design, API contracts, validation rules — must prioritize data integrity. A single incorrect ingredient score or missing product attribute undermines user trust.

## 3. Build for the Reader

Code is read far more often than it is written. Optimize for the reader: use descriptive names, write self-documenting code, add comments for "why" not "what", and maintain consistent patterns across the codebase.

## 4. Fail Fast, Fail Loud

Validate early, validate often. Prefer explicit errors over silent failures. When something goes wrong, the error message should tell the developer exactly what happened and where to look.

## 5. Evolve Incrementally

Each sprint builds on the last. Do not try to solve future problems today. Build what is needed now, with enough structure to extend later. YAGNI (You Aren't Gonna Need It) until you actually do.

## 6. Own Your Dependencies

Every dependency is a liability. Before adding one, ask: Does this solve a real problem we have today? Can we solve it with less? Are we committing to a well-maintained project? Minimize the dependency surface area.

## 7. Test What Matters

Test business logic, scoring algorithms, and data transformations thoroughly. Do not test framework behavior or third-party libraries. Write tests that give confidence, not just coverage numbers.

## 8. Security is Non-Negotiable

Security is not a feature to be added later. Every input is validated. Every query is parameterized. Every endpoint is authenticated or intentionally public. Every secret is secret.

## 9. Performance is a Feature

Users will not wait. Pages must load fast, searches must return instantly, and AI responses must stream. Performance is designed in from the start, not bolted on at the end.

## 10. Transparency Builds Trust

Tuskrank's brand promise is transparency. This extends to our code: our scoring algorithms are documented, our data sources are cited, and our methodology is defensible. We build trust by being honest about what we know and what we don't.
