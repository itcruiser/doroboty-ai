# DoRoboty.ai Prototype Glossary

Terms for the simulated recruitment workflow and the optional application deepening flow.

## Language

**Application (Aplikacja)**:
A candidate's response to a job that exists as a submitted record only after the final send action. For a job with deepening enabled, that action follows the candidate's decisions on the deepening questions or an explicit send without deepening after generation fails.
_Avoid_: Submitted application for an unfinished two-step form

**Deepening (Pogłębienie)**:
An optional second step of the application form in which a candidate answers or declines questions about selected job aspects before sending the application. It does not change the application's recruiting stage or Scenario Match Score.
_Avoid_: Post-submission supplement

**Application aspect snapshot (Migawka aspektów aplikacji)**:
The approved job aspects associated with an application when the candidate sends it. Later changes to the job's deepening settings do not alter this association.
_Avoid_: Current job aspects when referring to an existing application

**Approved aspect (Zatwierdzony aspekt)**:
A job-related topic selected by the employer for optional deepening questions and tied to a specific excerpt of the saved job. An enabled deepening configuration has one to three approved aspects.
_Avoid_: Model suggestion before employer approval

**Aspect author (Autor aspektu)**:
The source of an approved aspect's final wording: the employer or AI. Editing an AI suggestion makes the employer the author of the final wording, even when the suggestion remains recorded as its starting point.
_Avoid_: Treating an edited AI suggestion as AI-authored final text

**Completed deepening (Zakończone pogłębienie)**:
A deepening step in which every generated question has either a candidate answer or an explicit refusal. The application is submitted separately through the final send action.
_Avoid_: Submitted application

**Role simulation (Symulacja roli)**:
The prototype's selection of a prepared candidate or employer perspective. It controls which views are presented but does not provide confidentiality or authentication.
_Avoid_: Access control, authorization
