# OjaLink security test documents

This folder contains the setup documents for OjaLink's refused-access and secret-key leak checks. It is owned by the **Security & access tester**.

## How the files connect

- [test-plan.md](test-plan.md) lists the checks and expected outcomes.
- [route-agreement.md](route-agreement.md) records the routes after the Project lead and Feature 10 owner confirm them.
- [test-accounts.md](test-accounts.md) is a safe account roster template; it must never contain passwords.
- [results.csv](results.csv) is the run log, with one blank result row for each test.
- [proof/README.md](proof/README.md) explains how to name and capture screenshots for results.
- [bug-report-template.md](bug-report-template.md) gives a consistent format for reporting failures.
- [key-leak-checklist.md](key-leak-checklist.md) records the checks for accidentally exposed keys.

The tester confirms routes and test accounts with the team, runs the plan when the features exist, records outcomes in `results.csv`, saves screenshots in `proof/`, and files bugs for failed checks.
