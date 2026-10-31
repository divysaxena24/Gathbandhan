# PRD 04 — Wedding Planning & Dependency Engine

## Goal
Generate complete, date-aware plans for Full-Service, Partial/Day-of, local, destination, one-day and three-day weddings.

## Requirements
- Database-driven task templates, not hardcoded UI arrays.
- Generate at least 25 tasks for a typical three-day destination Full-Service wedding.
- Generate deadlines backward from wedding/event dates using configurable offsets.
- Tasks include owner, status, priority, due date, estimated/actual effort and source template.
- Explicit task dependencies.
- Validate dependency graph is acyclic.
- Task states: TO_PLAN, IN_PROGRESS, BLOCKED, REVIEW, DONE.
- Recompute dependent dates when wedding date changes, with preview and confirmation.
- Detect overdue, blocked, at-risk and critical-path tasks.
- Workload view by employee, estimated hours and active wedding assignments.
- Support template variants and overrides.
- Audit major changes.

## Example dependencies
Venue booking → floor plan → decor planning → decor setup.
Menu finalization → menu design → menu printing.
Vendor selection → contract → advance milestone.
Guest RSVP close → final headcount → catering confirmation.

## Acceptance criteria
- Wedding creation generates task instances.
- Each generated task has owner and deadline or an explicit unassigned/unscheduled warning.
- Dependency links render and are enforced.
- Cycles are rejected.
- Date changes produce understandable impact preview.
- Planner can filter tasks by owner, event, status and deadline.
